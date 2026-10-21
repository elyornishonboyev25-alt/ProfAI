import { useEffect, useRef, useState } from 'react'
import { ClockIcon } from '@heroicons/react/24/outline'

interface TimerProps {
  duration: number // in seconds
  timeLeft: number
  setTimeLeft: (time: number) => void
  onTimeUp?: () => void
  isActive: boolean
  showWarning?: boolean // Show red color when time is low
  variant?: 'default' | 'readingCompact'
  syncIntervalSeconds?: number
}

export default function Timer({
  timeLeft,
  setTimeLeft,
  onTimeUp,
  isActive,
  showWarning = true,
  variant = 'default',
  syncIntervalSeconds = 1,
}: TimerProps) {
  const [displayTime, setDisplayTime] = useState(timeLeft)
  const liveTimeRef = useRef(timeLeft)
  const deadlineRef = useRef<number | null>(timeLeft > 0 ? Date.now() + timeLeft * 1000 : null)
  const setTimeLeftRef = useRef(setTimeLeft)
  const onTimeUpRef = useRef(onTimeUp)

  setTimeLeftRef.current = setTimeLeft
  onTimeUpRef.current = onTimeUp

  useEffect(() => {
    liveTimeRef.current = timeLeft
    deadlineRef.current = timeLeft > 0 ? Date.now() + timeLeft * 1000 : null
    setDisplayTime(timeLeft)
  }, [timeLeft])

  useEffect(() => {
    if (!isActive || liveTimeRef.current <= 0) return

    const syncEvery = Math.max(1, Math.round(syncIntervalSeconds))
    deadlineRef.current = Date.now() + liveTimeRef.current * 1000
    let finished = false
    const tick = () => {
      const newTime = Math.max(0, Math.ceil(((deadlineRef.current ?? Date.now()) - Date.now()) / 1000))
      if (finished || newTime === liveTimeRef.current) return
      liveTimeRef.current = newTime
      setDisplayTime(newTime)

      if (newTime <= 0 || newTime % syncEvery === 0) {
        setTimeLeftRef.current(newTime)
      }
      if (newTime <= 0) {
        finished = true
        window.clearInterval(timer)
        onTimeUpRef.current?.()
      }
    }
    const timer = window.setInterval(tick, 1000)
    document.addEventListener('visibilitychange', tick)
    window.addEventListener('focus', tick)

    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', tick); window.removeEventListener('focus', tick) }
  }, [isActive, syncIntervalSeconds])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const isLowTime = showWarning && displayTime > 0 && displayTime < 300

  if (variant === 'readingCompact') {
    return (
      <span role="timer" aria-live="off" className={`font-mono text-base font-semibold tabular-nums ${isLowTime ? 'text-red-600' : 'text-slate-700'}`}>
        {displayTime === -1 ? 'Unlimited' : formatTime(displayTime)}
      </span>
    )
  }

  return (
    <div className={`
      flex items-center space-x-2 px-4 py-2 rounded-lg font-mono font-semibold transition-colors
      ${isLowTime
        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
      }
    `}>
      <ClockIcon className="h-5 w-5" />
      <span className="text-lg">
        {displayTime === -1 ? 'Unlimited' : formatTime(displayTime)}
      </span>
    </div>
  )
}
