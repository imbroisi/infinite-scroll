import TabbedAccordion from './components/TabbedAccordion/TabbedAccordion.tsx'
import { DEFAULT_TAB_CONFIG } from './components/TabbedAccordion/tabbedAccordion.demoData'
import styles from './App.module.scss'
import { useRef } from 'react'

function App() {
  const shellScrollRef = useRef<HTMLDivElement>(null)

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <div ref={shellScrollRef} className={styles.shellScroll}>
          <TabbedAccordion
            scrollContainerRef={shellScrollRef}
            tabs={DEFAULT_TAB_CONFIG}
          />
        </div>
      </div>
    </div>
  )
}

export default App
