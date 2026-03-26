import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styles from './InfiniteScroll.module.scss'

const TOTAL_ITEMS = 100
const GROUP_SIZE = 7

export default function InfiniteScroll() {
  const total = useMemo(() => TOTAL_ITEMS, [])

  // FASE 1 (sem API): renderizamos skeletons em blocos de 7 conforme o usuário rola.
  const [loadedCount, setLoadedCount] = useState(() =>
    Math.min(GROUP_SIZE, total),
  )
  const [done, setDone] = useState(false)

  // Controla para avançar somente após entrada manual do usuário.
  // Evita o “avanço” por eventos automáticos como restauração de scroll no reload.
  const userArmedRef = useRef(false)
  const [groupActivations, setGroupActivations] = useState(0)
  const lastTouchYRef = useRef<number | null>(null)

  const observedElRef = useRef<HTMLLIElement | null>(null)
  const lastGroupFirstElRef = useRef<HTMLLIElement | null>(null)

  const lastGroupStartIndex = Math.floor((total - 1) / GROUP_SIZE) * GROUP_SIZE
  const isAllLoaded = loadedCount >= total
  const observedIndex = isAllLoaded ? total - 1 : loadedCount - 1

  const setObservedEl = useCallback((node: HTMLLIElement | null) => {
    observedElRef.current = node
  }, [])

  const setLastGroupFirstEl = useCallback((node: HTMLLIElement | null) => {
    lastGroupFirstElRef.current = node
  }, [])

  const triggeredForObservedIndexRef = useRef<number | null>(null)

  const tryAdvanceFromUserInput = useCallback(() => {
    if (done) return
    if (isAllLoaded) return
    if (!userArmedRef.current) return

    const el = observedElRef.current
    if (!el) return

    // threshold 0: “começou a aparecer” = intersecta pelo menos um pixel.
    const rect = el.getBoundingClientRect()
    const intersects = rect.bottom > 0 && rect.top < window.innerHeight
    if (!intersects) return

    if (triggeredForObservedIndexRef.current === observedIndex) return
    triggeredForObservedIndexRef.current = observedIndex

    // Consome o armed: exige nova ação do usuário para o próximo grupo.
    userArmedRef.current = false

    setGroupActivations((v) => v + 1)
    setLoadedCount((prev) => Math.min(prev + GROUP_SIZE, total))
  }, [done, isAllLoaded, observedIndex, total])

  useEffect(() => {
    if (done) return

    const armAndTry = () => {
      userArmedRef.current = true
      tryAdvanceFromUserInput()
    }

    const onWheel = (e: WheelEvent) => {
      // Somente “scroll para baixo”.
      if (e.deltaY > 0) armAndTry()
    }

    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY
      if (typeof y !== 'number') return

      const lastY = lastTouchYRef.current
      lastTouchYRef.current = y

      // Movimento para baixo = y aumentou.
      if (lastY != null && y > lastY) armAndTry()
    }

    const onKeyDown = (e: KeyboardEvent) => {
      // Somente comandos “para baixo”.
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

    // Reinicia o guard quando o “alvo” mudar.
    triggeredForObservedIndexRef.current = null

    const observerOptions = isAllLoaded
      ? // FASE 2 (fim): exige o último grupo 100% visível.
        { threshold: 1 }
      : // FASE 1: dispara quando o 7º retângulo da série começa a aparecer.
        { threshold: 0 }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (!entry) return

        if (isAllLoaded) {
          // Fim: quando o último grupo estiver 100% na tela.
          if (entry.intersectionRatio < 1) return

          const firstEl = lastGroupFirstElRef.current
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

        // Evita múltiplas ativações enquanto o mesmo último item ainda está visível.
        if (triggeredForObservedIndexRef.current === observedIndex) return
        triggeredForObservedIndexRef.current = observedIndex

        // Consome o armed: exige nova ação do usuário para o próximo grupo.
        userArmedRef.current = false

        setGroupActivations((v) => v + 1)
        setLoadedCount((prev) => Math.min(prev + GROUP_SIZE, total))
      },
      observerOptions,
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [done, isAllLoaded, observedIndex, total])

  return (
    <div className={styles.wrapper}>
      <div className={styles.debug} aria-hidden="true">
        Renderizados: {loadedCount}
        <div>Ativações: {groupActivations}</div>
      </div>
      <ul className={styles.list}>
        {Array.from({ length: loadedCount }).map((_, idx) => {
          const isGroupStart = idx % GROUP_SIZE === 0
          const isGroupLast = idx % GROUP_SIZE === GROUP_SIZE - 1
          return (
            <li
              key={`skeleton-${idx}`}
              className={styles.skeletonCard}
              aria-hidden="true"
              ref={(node) => {
                if (idx === observedIndex) setObservedEl(node)
                if (idx === lastGroupStartIndex) setLastGroupFirstEl(node)
              }}
            >
              {isGroupStart ? (
                <span className={styles.groupLabel} aria-hidden="true">
                  1
                </span>
              ) : null}

              {isGroupLast ? (
                <span className={styles.ultimoLabel} aria-hidden="true">
                  ULTIMO
                </span>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

