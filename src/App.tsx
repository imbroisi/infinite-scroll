import InfiniteScroll from './components/InfiniteScroll/InfiniteScroll.tsx'
import styles from './App.module.scss'
import { fetchPeopleBatch } from './api/mockPeopleApi'

function App() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Infinite Scroll</h1>
        <p className={styles.subtitle}>
          PHASE 2: placeholders in pages of `itemsPerPage` + API requests in a queue (2s per call).
        </p>
      </header>

      <InfiniteScroll
        totalItems={100}
        itemsPerPage={7}
        fetchPageItems={(pageIndex: number) =>
          fetchPeopleBatch(pageIndex * 7, 7, 100)
        }
      />
    </div>
  )
}

export default App
