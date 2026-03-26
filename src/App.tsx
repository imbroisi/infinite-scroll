import InfiniteScroll from './components/InfiniteScroll/InfiniteScroll'
import styles from './App.module.scss'

function App() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Infinite Scroll</h1>
        <p className={styles.subtitle}>
          FASE 1: skeletons em blocos de 7 conforme o scroll (sem API).
        </p>
      </header>

      <InfiniteScroll />
    </div>
  )
}

export default App
