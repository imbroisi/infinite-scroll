import { useCallback, useEffect, useRef, useState } from 'react'

type Params = {
  totalItems: number
  itemsPerPage: number
  loadedCount: number
  fetchPageItems: (pageIndex: number) => Promise<string[]>
}

export function usePageFetchQueue({
  totalItems,
  itemsPerPage,
  loadedCount,
  fetchPageItems,
}: Params) {
  const [names, setNames] = useState<(string | undefined)[]>(() =>
    Array.from({ length: totalItems }, () => undefined),
  )

  const pagesCount = Math.ceil(totalItems / itemsPerPage)

  const queueRef = useRef<number[]>([])
  const isProcessingRef = useRef(false)
  const queuedPagesRef = useRef<Set<number>>(new Set())
  const fetchedPagesRef = useRef<Set<number>>(new Set())
  const lastEnqueuedLoadedCountRef = useRef(0)

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current) return
    isProcessingRef.current = true

    try {
      while (queueRef.current.length > 0) {
        const pageIndex = queueRef.current.shift()!
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
      isProcessingRef.current = false
    }
  }, [fetchPageItems, itemsPerPage, totalItems])

  const enqueuePageFetch = useCallback(
    (pageIndex: number) => {
      if (pageIndex < 0 || pageIndex >= pagesCount) return
      if (fetchedPagesRef.current.has(pageIndex)) return
      if (queuedPagesRef.current.has(pageIndex)) return

      queuedPagesRef.current.add(pageIndex)
      queueRef.current.push(pageIndex)
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

  return { names }
}

