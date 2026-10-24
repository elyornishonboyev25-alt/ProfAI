import { useCallback, useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const historyGuards = new Set<(event: PopStateEvent) => boolean>()
let installed = false

/** Register before BrowserRouter: its listener can otherwise unmount a guard
 * while the browser is still delivering the same Window popstate event. */
export function installTestExitProtection() {
  if (installed || typeof window === 'undefined') return
  installed = true
  window.addEventListener('popstate', event => {
    for (const guard of historyGuards) if (guard(event)) break
  }, true)
}
installTestExitProtection()

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

  useLayoutEffect(() => {
    indexRef.current = window.history.state?.idx
  }, [location.key])

  useLayoutEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      if (confirmedRef.current) {
        confirmedRef.current = false
        return false
      }
      if (restoringRef.current) {
        event.stopImmediatePropagation()
        restoringRef.current = false
        const leave = queuedLeaveRef.current
        queuedLeaveRef.current = null
        leave?.()
        return true
      }
      if (!isActive()) return false
      const nextIndex = event.state?.idx
      const currentIndex = indexRef.current
      if (typeof nextIndex !== 'number' || typeof currentIndex !== 'number') return false
      const delta = nextIndex - currentIndex
      if (!delta) return false
      // Capture runs before BrowserRouter's listener, so the test stays mounted.
      event.stopImmediatePropagation()
      pendingRef.current = delta
      restoringRef.current = true
      window.history.go(-delta)
      onBlockedRef.current()
      return true
    }
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isActive()) return
      event.preventDefault()
      event.returnValue = ''
      // Saving on pagehide avoids pausing a test when this prompt is canceled.
    }
    historyGuards.add(onPopState)
    window.addEventListener('beforeunload', onBeforeUnload, true)
    return () => {
      historyGuards.delete(onPopState)
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
