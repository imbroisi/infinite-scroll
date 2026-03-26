import styles from './InfiniteScroll.module.scss'
import type { InfiniteScrollProps } from './types'
import { useInfiniteScrollPaging } from './useInfiniteScrollPaging'
import { usePageFetchQueue } from './usePageFetchQueue'

export default function InfiniteScroll({
  totalItems = 100,
  itemsPerPage = 7,
  fetchPageItems,
  firstSkeletonSize,
  skeletonSize,
}: InfiniteScrollProps) {
  const {
    loadedCount,
    pageActivations,
    observedIndex,
    lastPageStartIndex,
    setObservedEl,
    setLastPageFirstEl,
  } = useInfiniteScrollPaging({ totalItems, itemsPerPage })

  const { names } = usePageFetchQueue({
    totalItems,
    itemsPerPage,
    loadedCount,
    fetchPageItems,
  })

  return (
    <div className={styles.wrapper}>
      <div className={styles.debug} aria-hidden="true">
        Renderizados: {loadedCount}
        <div>Ativações: {pageActivations}</div>
      </div>
      <ul className={styles.list}>
        {Array.from({ length: loadedCount }).map((_, idx) => {
          const name = names[idx]
          const isSkeleton = typeof name !== 'string'
          const size = idx === 0 ? firstSkeletonSize : skeletonSize
          return (
            <li
              key={`item-${idx}`}
              className={isSkeleton ? styles.skeletonCard : styles.card}
              style={
                size
                  ? {
                      width: size.width,
                      height: size.height,
                    }
                  : undefined
              }
              aria-hidden="true"
              ref={(node) => {
                if (idx === observedIndex) setObservedEl(node)
                if (idx === lastPageStartIndex) setLastPageFirstEl(node)
              }}
            >
              {!isSkeleton && name}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
