import { useEffect, useRef, useState } from 'react'

export const LISTENING_REVIEW_SECONDS = 120

/** The final audio end, never a wall-clock test duration, starts the grace period. */
export function useListeningAutoSubmit(enabled: boolean, audioDone: boolean, onSubmit: () => void, finishedAt?: number | null) {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null)
  const latestSubmit = useRef(onSubmit)
  useEffect(() => { latestSubmit.current = onSubmit }, [onSubmit])

  useEffect(() => {
    if (!enabled || !audioDone) {
      setSecondsRemaining(null)
      return
    }
    const deadline = (finishedAt ?? Date.now()) + LISTENING_REVIEW_SECONDS * 1000
    let submitted = false
    const finish = () => {
      const remaining = Math.max(0, Math.min(LISTENING_REVIEW_SECONDS, Math.ceil((deadline - Date.now()) / 1000)))
      setSecondsRemaining(remaining)
      if (submitted || remaining > 0) return
      submitted = true
      latestSubmit.current()
    }
    // Display and submission share the same persisted deadline, including reloads.
    finish()
    if (submitted) return
    const timer = window.setTimeout(finish, Math.max(0, deadline - Date.now()))
    const ticker = window.setInterval(finish, 250)
    // Background tabs can throttle timers. Submit on return if the deadline passed.
    document.addEventListener('visibilitychange', finish)
    return () => {
      window.clearTimeout(timer)
      window.clearInterval(ticker)
      document.removeEventListener('visibilitychange', finish)
    }
  }, [enabled, audioDone, finishedAt])

  return enabled && audioDone ? secondsRemaining : null
}
