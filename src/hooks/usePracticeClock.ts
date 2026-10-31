import { useCallback, useEffect, useRef, useState } from 'react'

/** Active time only; checkpoints survive refresh without counting closed tabs. */
export function usePracticeClock(initialSeconds: number, onCheckpoint: (seconds: number) => void, stopped: boolean) {
  const [paused, setPaused] = useState(false)
  const [seconds, setSeconds] = useState(initialSeconds)
  const elapsed = useRef(initialSeconds)
  const since = useRef<number | null>(null)
  const callback = useRef(onCheckpoint)
  callback.current = onCheckpoint
  const read = useCallback(() => Math.floor(elapsed.current + (since.current === null ? 0 : (Date.now() - since.current) / 1000)), [])
  useEffect(() => {
    const settle = () => {
      if (since.current !== null) elapsed.current += (Date.now() - since.current) / 1000
      since.current = null
      setSeconds(read())
      callback.current(read())
    }
    const sync = () => {
      if (document.hidden || paused || stopped) settle()
      else if (since.current === null) since.current = Date.now()
    }
    sync()
    const tick = window.setInterval(() => { const next = read(); setSeconds(next); if (next % 10 === 0) callback.current(next) }, 1000)
    document.addEventListener('visibilitychange', sync)
    const checkpoint = () => callback.current(read())
    window.addEventListener('pagehide', checkpoint)
    window.addEventListener('beforeunload', checkpoint)
    return () => {
      window.clearInterval(tick)
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('pagehide', checkpoint)
      window.removeEventListener('beforeunload', checkpoint)
      settle()
    }
  }, [paused, stopped, read])
  return { seconds, paused, setPaused, read }
}
