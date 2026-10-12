import { useCallback, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/** Keep BrowserRouter on the test until a browser history exit is confirmed. */
export function useTestExitGuard(active: boolean | (() => boolean), onBlocked: () => void) {
  const location = useLocation()
  const activeRef = useRef(active)
  const onBlockedRef = useRef(onBlocked)
  const indexRef = useRef<number | undefined>(window.history.state?.idx)
  const pendingRef = useRef<number | null>(null)
  const restoringRef = useRef(false)
  const confirmedRef = useRef(false)
  const queuedLeaveRef = useRef<(() => void) | null>(null)
  activeRef.current = active
  onBlockedRef.current = onBlocked
  const isActive = () => typeof activeRef.current === 'function' ? activeRef.current() : activeRef.current

  useEffect(() => {
    indexRef.current = window.history.state?.idx
  }, [location.key])

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      if (confirmedRef.current) {
        confirmedRef.current = false
        return
      }
      if (restoringRef.current) {
        event.stopImmediatePropagation()
        restoringRef.current = false
        const leave = queuedLeaveRef.current
        queuedLeaveRef.current = null
        leave?.()
        return
      }
      if (!isActive()) return
      const nextIndex = event.state?.idx
      const currentIndex = indexRef.current
      if (typeof nextIndex !== 'number' || typeof currentIndex !== 'number') return
      const delta = nextIndex - currentIndex
      if (!delta) return
      // Capture runs before BrowserRouter's listener, so the test stays mounted.
      event.stopImmediatePropagation()
      pendingRef.current = delta
      restoringRef.current = true
      window.history.go(-delta)
      onBlockedRef.current()
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isActive()) return
      event.preventDefault()
      event.returnValue = ''
      // Saving on pagehide avoids pausing a test when this prompt is canceled.
      event.stopImmediatePropagation()
    }
    window.addEventListener('popstate', onPopState, true)
    window.addEventListener('beforeunload', onBeforeUnload, true)
    return () => {
      window.removeEventListener('popstate', onPopState, true)
      window.removeEventListener('beforeunload', onBeforeUnload, true)
    }
  }, [])

  const cancelExit = useCallback(() => {
    pendingRef.current = null
    queuedLeaveRef.current = null
  }, [])

  const confirmExit = useCallback((saveAttempt: () => void, fallback: () => void) => {
    const leave = () => {
      saveAttempt()
      activeRef.current = false
      const delta = pendingRef.current
      pendingRef.current = null
      if (delta === null) {
        fallback()
      } else {
        confirmedRef.current = true
        window.history.go(delta)
      }
    }
    if (restoringRef.current) queuedLeaveRef.current = leave
    else leave()
  }, [])

  return { cancelExit, confirmExit }
}
