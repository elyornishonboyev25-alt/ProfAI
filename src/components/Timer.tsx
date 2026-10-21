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
  const setTimeLeftRef = useRef(setTimeLeft)
  const onTimeUpRef = useRef(onTimeUp)

  setTimeLeftRef.current = setTimeLeft
  onTimeUpRef.current = onTimeUp

  useEffect(() => {
    liveTimeRef.current = timeLeft
    setDisplayTime(timeLeft)
  }, [timeLeft])

  useEffect(() => {
    if (!isActive || liveTimeRef.current <= 0) return

    const syncEvery = Math.max(1, Math.round(syncIntervalSeconds))
    const timer = window.setInterval(() => {
      const newTime = Math.max(0, liveTimeRef.current - 1)
      liveTimeRef.current = newTime
      setDisplayTime(newTime)

      if (newTime <= 0 || newTime % syncEvery === 0) {
        setTimeLeftRef.current(newTime)
      }
      if (newTime <= 0) {
        window.clearInterval(timer)
        onTimeUpRef.current?.()
      }
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isActive, syncIntervalSeconds])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const isLowTime = showWarning && displayTime > 0 && displayTime < 300

  if (variant === 'readingCompact') {
    return (
      <span className={`font-mono text-base font-semibold tracking-[0.08em] ${isLowTime ? 'text-red-600' : 'text-slate-700'}`}>
        {displayTime === -1 ? 'Unlimited' : formatTime(displayTime)}
      </span>
    )
  }

  return (
    <div className={`
      flex items-center space-x-2 px-4 py-2 rounded-lg font-mono font-semibold transition-colors
      ${isLowTime
        ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse'
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
