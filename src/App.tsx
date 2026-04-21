import TabbedAccordion from './components/TabbedAccordion/TabbedAccordion.tsx'
import styles from './App.module.scss'
import { useRef } from 'react'

function App() {
  const shellScrollRef = useRef<HTMLDivElement>(null)

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div ref={shellScrollRef} className={styles.shellScroll}>
          <TabbedAccordion scrollContainerRef={shellScrollRef} />
        </div>
      </div>
    </div>
  )
}

export default App
