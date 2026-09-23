import { useEffect, useRef } from 'react'

export const LISTENING_REVIEW_SECONDS = 20

/** The final audio end, never a wall-clock test duration, starts the grace period. */
export function useListeningAutoSubmit(enabled: boolean, audioDone: boolean, onSubmit: () => void) {
  const latestSubmit = useRef(onSubmit)
  useEffect(() => { latestSubmit.current = onSubmit }, [onSubmit])

  useEffect(() => {
    if (!enabled || !audioDone) return
    const deadline = Date.now() + LISTENING_REVIEW_SECONDS * 1000
    let submitted = false
    const finish = () => {
      if (submitted || Date.now() < deadline) return
      submitted = true
      latestSubmit.current()
    }
    const timer = window.setTimeout(finish, LISTENING_REVIEW_SECONDS * 1000)
    // Background tabs can throttle timers. Submit on return if the deadline passed.
    document.addEventListener('visibilitychange', finish)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', finish)
    }
  }, [enabled, audioDone])
}
