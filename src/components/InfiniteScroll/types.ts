export type Size = { width: number; height: number }

export type InfiniteScrollProps = {
  totalItems?: number
  itemsPerPage?: number
  fetchPageItems: (pageIndex: number) => Promise<string[]>
  firstSkeletonSize?: Size
  skeletonSize?: Size
}

