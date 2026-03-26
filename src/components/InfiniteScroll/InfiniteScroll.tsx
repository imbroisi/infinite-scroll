import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './InfiniteScroll.module.scss'

type InfiniteScrollProps = {
  totalItems?: number
  itemsPerPage?: number
  fetchPageItems: (pageIndex: number) => Promise<string[]>
}

export default function InfiniteScroll({
  totalItems = 100,
  itemsPerPage = 7,
  fetchPageItems,
}: InfiniteScrollProps) {
  // PHASE 1 (no API): render skeletons in groups as the user scrolls.
  const [loadedCount, setLoadedCount] = useState(() =>
    Math.min(itemsPerPage, totalItems),
  )
  const [done, setDone] = useState(false)

  // Controls advancing only after manual user input.
  // Prevents “auto-advancing” triggered by automatic browser events (like restored scroll on reload).
  const userArmedRef = useRef(false)
  const [pageActivations, setPageActivations] = useState(0)
  const lastTouchYRef = useRef<number | null>(null)

  // Names received by index (undefined = not received yet).
  const [names, setNames] = useState<(string | undefined)[]>(() =>
    Array.from({ length: totalItems }, () => undefined),
  )

  const observedElRef = useRef<HTMLLIElement | null>(null)
  const lastPageFirstElRef = useRef<HTMLLIElement | null>(null)

  const lastPageStartIndex =
    Math.floor((totalItems - 1) / itemsPerPage) * itemsPerPage
  const isAllLoaded = loadedCount >= totalItems
  const observedIndex = isAllLoaded ? totalItems - 1 : loadedCount - 1

  const pagesCount = Math.ceil(totalItems / itemsPerPage)

  const enqueueQueueRef = useRef<number[]>([])
  const isQueueProcessingRef = useRef(false)
  const queuedPagesRef = useRef<Set<number>>(new Set())
  const fetchedPagesRef = useRef<Set<number>>(new Set())
  const lastEnqueuedLoadedCountRef = useRef(0)

  const setObservedEl = useCallback((node: HTMLLIElement | null) => {
    observedElRef.current = node
  }, [])

  const setLastPageFirstEl = useCallback((node: HTMLLIElement | null) => {
    lastPageFirstElRef.current = node
  }, [])

  const triggeredForObservedIndexRef = useRef<number | null>(null)

  const processQueue = useCallback(async () => {
    if (isQueueProcessingRef.current) return
    isQueueProcessingRef.current = true

    try {
      while (enqueueQueueRef.current.length > 0) {
        const pageIndex = enqueueQueueRef.current.shift()!
        queuedPagesRef.current.delete(pageIndex)

        if (fetchedPagesRef.current.has(pageIndex)) continue

        const offset = pageIndex * itemsPerPage
        const batch = await fetchPageItems(pageIndex)

        setNames((prev) => {
          const next = [...prev]
          for (let i = 0; i < batch.length; i++) {
            const targetIndex = offset + i
            if (targetIndex >= totalItems) break
            next[targetIndex] = batch[i]
          }
          return next
        })

        fetchedPagesRef.current.add(pageIndex)
      }
    } finally {
      isQueueProcessingRef.current = false
    }
  }, [fetchPageItems, itemsPerPage, setNames, totalItems])

  const enqueuePageFetch = useCallback(
    (pageIndex: number) => {
      if (pageIndex < 0 || pageIndex >= pagesCount) return
      if (fetchedPagesRef.current.has(pageIndex)) return
      if (queuedPagesRef.current.has(pageIndex)) return

      queuedPagesRef.current.add(pageIndex)
      enqueueQueueRef.current.push(pageIndex)

      void processQueue()
    },
    [pagesCount, processQueue],
  )

  useEffect(() => {
    const prevLoadedCount = lastEnqueuedLoadedCountRef.current
    if (loadedCount <= prevLoadedCount) return

    const startPage = Math.floor(prevLoadedCount / itemsPerPage)
    const endPage = Math.floor((loadedCount - 1) / itemsPerPage)

    for (let pageIndex = startPage; pageIndex <= endPage; pageIndex++) {
      enqueuePageFetch(pageIndex)
    }

    lastEnqueuedLoadedCountRef.current = loadedCount
  }, [enqueuePageFetch, itemsPerPage, loadedCount])

  const tryAdvanceFromUserInput = useCallback(() => {
    if (done) return
    if (isAllLoaded) return
    if (!userArmedRef.current) return

    const el = observedElRef.current
    if (!el) return

    // threshold 0: “starts appearing” = intersects at least one pixel.
    const rect = el.getBoundingClientRect()
    const intersects = rect.bottom > 0 && rect.top < window.innerHeight
    if (!intersects) return

    if (triggeredForObservedIndexRef.current === observedIndex) return
    triggeredForObservedIndexRef.current = observedIndex

    // Consume the armed state: requires a new user action for the next group.
    userArmedRef.current = false

    setPageActivations((v) => v + 1)
    setLoadedCount((prev) =>
      Math.min(prev + itemsPerPage, totalItems),
    )
  }, [done, itemsPerPage, isAllLoaded, observedIndex, totalItems])

  useEffect(() => {
    if (done) return

    const armAndTry = () => {
      userArmedRef.current = true
      tryAdvanceFromUserInput()
    }

    const onWheel = (e: WheelEvent) => {
      // Only “scroll down”.
      if (e.deltaY > 0) armAndTry()
    }

    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY
      if (typeof y !== 'number') return

      const lastY = lastTouchYRef.current
      lastTouchYRef.current = y

      // Moving down means y increased.
      if (lastY != null && y > lastY) armAndTry()
    }

    const onKeyDown = (e: KeyboardEvent) => {
      // Only “downward” commands.
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'End') {
        armAndTry()
      }
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('touchmove', onTouchMove, { passive: true })

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('touchmove', onTouchMove)
    }
  }, [done, tryAdvanceFromUserInput])

  useEffect(() => {
    if (done) return

    const el = observedElRef.current
    if (!el) return

    // Reset the guard when the “target” changes.
    triggeredForObservedIndexRef.current = null

    const observerOptions = isAllLoaded
      ? // PHASE 2 (end): require the last page to be 100% visible.
        { threshold: 1 }
      : // PHASE 1: trigger when the 7th card of the series starts appearing.
        { threshold: 0 }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return

        if (isAllLoaded) {
          // End: when the last group is 100% on-screen.
          if (entry.intersectionRatio < 1) return

          const firstEl = lastPageFirstElRef.current
          const lastEl = observedElRef.current
          if (!firstEl || !lastEl) {
            setDone(true)
            return
          }

          const firstRect = firstEl.getBoundingClientRect()
          const lastRect = lastEl.getBoundingClientRect()

          const firstFullyVisible = firstRect.top >= 0
          const lastFullyVisible = lastRect.bottom <= window.innerHeight

          if (firstFullyVisible && lastFullyVisible) setDone(true)
          return
        }

        if (!userArmedRef.current) return
        if (!entry.isIntersecting) return

        // Prevent multiple activations while the same last item is still visible.
        if (triggeredForObservedIndexRef.current === observedIndex) return
        triggeredForObservedIndexRef.current = observedIndex

        // Consume the armed state: requires a new user action for the next page.
        userArmedRef.current = false

        setPageActivations((v) => v + 1)
        setLoadedCount((prev) =>
          Math.min(prev + itemsPerPage, totalItems),
        )
      },
      observerOptions,
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [done, itemsPerPage, isAllLoaded, observedIndex, totalItems])

  return (
    <div className={styles.wrapper}>
      <div className={styles.debug} aria-hidden="true">
        Renderizados: {loadedCount}
        <div>Ativações: {pageActivations}</div>
      </div>
      <ul className={styles.list}>
        {Array.from({ length: loadedCount }).map((_, idx) => {
          const isPageStart = idx % itemsPerPage === 0
          const isPageLast = idx % itemsPerPage === itemsPerPage - 1
          const name = names[idx]
          const isSkeleton = typeof name !== 'string'
          return (
            <li
              key={`item-${idx}`}
              className={isSkeleton ? styles.skeletonCard : styles.card}
              aria-hidden="true"
              ref={(node) => {
                if (idx === observedIndex) setObservedEl(node)
                if (idx === lastPageStartIndex) setLastPageFirstEl(node)
              }}
            >
              {isSkeleton ? (
                <>
                  {isPageStart ? (
                    <span className={styles.groupLabel} aria-hidden="true">
                      1
                    </span>
                  ) : null}

                  {isPageLast ? (
                    <span className={styles.ultimoLabel} aria-hidden="true">
                      ULTIMO
                    </span>
                  ) : null}
                </>
              ) : (
                name
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

