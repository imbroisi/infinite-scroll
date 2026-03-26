import { useCallback, useEffect, useRef, useState } from 'react'

type Params = {
  totalItems: number
  itemsPerPage: number
}

export function useInfiniteScrollPaging({ totalItems, itemsPerPage }: Params) {
  const [loadedCount, setLoadedCount] = useState(() =>
    Math.min(itemsPerPage, totalItems),
  )
  const [done, setDone] = useState(false)
  const [pageActivations, setPageActivations] = useState(0)

  const userArmedRef = useRef(false)
  const lastTouchYRef = useRef<number | null>(null)

  const observedElRef = useRef<HTMLLIElement | null>(null)
  const lastPageFirstElRef = useRef<HTMLLIElement | null>(null)

  const lastPageStartIndex =
    Math.floor((totalItems - 1) / itemsPerPage) * itemsPerPage
  const isAllLoaded = loadedCount >= totalItems
  const observedIndex = isAllLoaded ? totalItems - 1 : loadedCount - 1

  const setObservedEl = useCallback((node: HTMLLIElement | null) => {
    observedElRef.current = node
  }, [])

  const setLastPageFirstEl = useCallback((node: HTMLLIElement | null) => {
    lastPageFirstElRef.current = node
  }, [])

  const triggeredForObservedIndexRef = useRef<number | null>(null)

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

    // Consume the armed state: requires a new user action for the next page.
    userArmedRef.current = false

    setPageActivations((v) => v + 1)
    setLoadedCount((prev) => Math.min(prev + itemsPerPage, totalItems))
  }, [done, isAllLoaded, itemsPerPage, observedIndex, totalItems])

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
          // End: when the last page is 100% on-screen.
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
        setLoadedCount((prev) => Math.min(prev + itemsPerPage, totalItems))
      },
      observerOptions,
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [done, isAllLoaded, itemsPerPage, observedIndex, totalItems])

  return {
    loadedCount,
    done,
    pageActivations,
    observedIndex,
    lastPageStartIndex,
    setObservedEl,
    setLastPageFirstEl,
  }
}

