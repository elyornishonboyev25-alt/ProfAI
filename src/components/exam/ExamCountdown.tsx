import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CalendarDays, Clock3, Target } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

type Props = {
  exam: 'SAT' | 'IELTS'
  date?: string
  currentScore?: number
  targetScore?: number
  tone?: 'blue' | 'red'
}

function getRemaining(date?: string) {
  if (!date) return null
  const distance = Math.max(0, new Date(`${date}T08:00:00`).getTime() - Date.now())
  return {
    days: Math.floor(distance / 86400000),
    hours: Math.floor((distance / 3600000) % 24),
    minutes: Math.floor((distance / 60000) % 60),
    seconds: Math.floor((distance / 1000) % 60),
  }
}

export default function ExamCountdown({ exam, date, currentScore, targetScore, tone = 'red' }: Props) {
  const navigate = useNavigate()
  const { minimalMotion } = useMotionPreferences()
  const [nowTick, setNowTick] = useState(0)
  const remaining = useMemo(() => getRemaining(date), [date, nowTick])
  const blue = tone === 'blue'
  const accent = blue ? 'text-blue-600' : 'text-blue-600'
  const soft = blue ? 'border-blue-100 bg-blue-50/65' : 'border-blue-100 bg-blue-50/65'

  useEffect(() => {
    if (!date) return
    const timer = window.setInterval(() => setNowTick((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [date])

  if (!date) {
    return (
      <section className={`flex flex-col gap-3 rounded-[1.35rem] border p-4 shadow-[0_12px_34px_rgba(15,23,42,0.06)] sm:flex-row sm:items-center sm:justify-between ${soft}`}>
        <div className="flex min-w-0 items-center gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ${accent}`}>
            <CalendarDays className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-900">Set your {exam} exam date</p>
            <p className="mt-0.5 text-xs text-slate-500">Activate a live countdown and personal score target.</p>
          </div>
        </div>
        <button onClick={() => navigate('/onboarding')} className={`min-h-10 shrink-0 rounded-xl px-4 text-xs font-black text-white shadow-sm ${blue ? 'bg-blue-600' : 'bg-blue-600'}`}>
          Set exam profile
        </button>
      </section>
    )
  }

  const units = [
    ['Days', remaining?.days ?? 0],
    ['Hours', remaining?.hours ?? 0],
    ['Minutes', remaining?.minutes ?? 0],
    ['Seconds', remaining?.seconds ?? 0],
  ] as const

  return (
    <motion.section
      initial={minimalMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative isolate overflow-hidden rounded-[1.45rem] border bg-white/82 p-3.5 shadow-[0_16px_42px_rgba(15,23,42,0.08)] backdrop-blur-2xl sm:p-4 ${blue ? 'border-blue-100' : 'border-blue-100'}`}
    >
      <span className={`pointer-events-none absolute -right-16 -top-20 -z-10 h-48 w-48 rounded-full blur-3xl ${blue ? 'bg-blue-200/45' : 'bg-blue-200/45'}`} />
      <div className="grid gap-3 xl:grid-cols-[minmax(12rem,.72fr)_minmax(25rem,1.45fr)_minmax(12rem,.72fr)] xl:items-center">
        <div className="flex min-w-0 items-center gap-3">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-[0_8px_20px_rgba(15,23,42,0.08)] ${accent}`}>
            <Clock3 className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{exam} exam countdown</p>
            <p className="mt-0.5 truncate text-sm font-black text-slate-900">
              {new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button onClick={() => navigate('/onboarding')} className={`ml-auto shrink-0 rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-wider transition hover:bg-white ${accent}`}>
            Change
          </button>
        </div>

        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {units.map(([label, value]) => (
            <div key={label} className={`relative overflow-hidden rounded-xl border bg-white px-1.5 py-2 text-center shadow-sm ${blue ? 'border-blue-100/80' : 'border-blue-100/80'}`}>
              <motion.p
                key={`${label}-${value}`}
                initial={minimalMotion ? false : { opacity: 0, y: -7 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                className="text-lg font-black tabular-nums tracking-tight text-slate-950 sm:text-xl"
              >
                {String(value).padStart(2, '0')}
              </motion.p>
              <p className="text-[7px] font-black uppercase tracking-[0.14em] text-slate-400 sm:text-[8px]">{label}</p>
            </div>
          ))}
        </div>

        <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 ${soft}`}>
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ${accent}`}>
            <Target className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-slate-400">Score journey</p>
            <p className="mt-0.5 whitespace-nowrap text-lg font-black tracking-tight text-slate-950">
              {currentScore ?? '—'} <span className={accent}>→</span> {targetScore ?? '—'}
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
