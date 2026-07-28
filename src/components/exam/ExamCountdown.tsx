import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Clock3, Target } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

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
  const [nowTick, setNowTick] = useState(0)
  const remaining = useMemo(() => getRemaining(date), [date, nowTick])
  const blue = tone === 'blue'

  useEffect(() => {
    if (!date) return
    const timer = window.setInterval(() => setNowTick((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [date])

  if (!date) {
    return (
      <div className={`rounded-2xl border p-4 ${blue ? 'border-blue-100 bg-blue-50/70' : 'border-red-100 bg-red-50/70'}`}>
        <div className="flex items-center gap-2">
          <CalendarDays className={`h-4 w-4 ${blue ? 'text-blue-600' : 'text-red-600'}`} />
          <p className="text-sm font-black text-slate-900">{exam} exam date is not set</p>
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-500">Add your exam date and scores to activate the live countdown and personalized target.</p>
        <button onClick={() => navigate('/onboarding')} className={`mt-3 rounded-xl px-3 py-2 text-xs font-black text-white ${blue ? 'bg-blue-600' : 'bg-red-600'}`}>
          Set exam profile
        </button>
      </div>
    )
  }

  const units = [
    ['Days', remaining?.days ?? 0],
    ['Hours', remaining?.hours ?? 0],
    ['Minutes', remaining?.minutes ?? 0],
    ['Seconds', remaining?.seconds ?? 0],
  ] as const

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_13rem]">
      <div className={`rounded-2xl border p-4 ${blue ? 'border-blue-100 bg-blue-50/65' : 'border-red-100 bg-red-50/65'}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock3 className={`h-4 w-4 ${blue ? 'text-blue-600' : 'text-red-600'}`} />
            <p className="text-sm font-black text-slate-900">{exam} exam countdown</p>
          </div>
          <button onClick={() => navigate('/onboarding')} className={`text-[10px] font-black uppercase tracking-wider ${blue ? 'text-blue-700' : 'text-red-700'}`}>
            Change date
          </button>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {units.map(([label, value]) => (
            <div key={label} className="rounded-xl border border-white bg-white/85 px-2 py-2.5 text-center shadow-sm">
              <p className="text-xl font-black tabular-nums text-slate-950 sm:text-2xl">{String(value).padStart(2, '0')}</p>
              <p className="mt-0.5 text-[8px] font-black uppercase tracking-wider text-slate-400">{label}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[10px] font-semibold text-slate-500">
          Exam day: {new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className={`rounded-2xl border p-4 ${blue ? 'border-blue-100 bg-gradient-to-br from-blue-600 to-indigo-700' : 'border-red-100 bg-gradient-to-br from-red-600 to-rose-700'} text-white`}>
        <Target className="h-5 w-5 text-white/80" />
        <p className="mt-3 text-[9px] font-black uppercase tracking-[0.15em] text-white/70">Score journey</p>
        <p className="mt-1 text-2xl font-black">{currentScore ?? '—'} <span className="text-sm text-white/60">→</span> {targetScore ?? '—'}</p>
        <p className="mt-1 text-[10px] font-semibold text-white/75">Current to target</p>
      </div>
    </div>
  )
}
