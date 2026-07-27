import { motion, useReducedMotion } from 'framer-motion'
import {
  Award,
  BarChart3,
  BookOpen,
  Bot,
  CheckCircle2,
  GraduationCap,
  Headphones,
  Mic2,
  PenSquare,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react'

const EASE = [0.22, 1, 0.36, 1] as const

const SKILLS = [
  { label: 'Reading', score: 88, icon: BookOpen },
  { label: 'Listening', score: 94, icon: Headphones },
  { label: 'Writing', score: 82, icon: PenSquare },
  { label: 'Speaking', score: 86, icon: Mic2 },
] as const

function ScoreRing({ compact = false }: { compact?: boolean }) {
  const reduce = !!useReducedMotion()
  const radius = 52
  const circumference = Math.PI * 2 * radius
  const progress = circumference * (7.5 / 9)

  return (
    <div className={`relative grid shrink-0 place-items-center ${compact ? 'h-32 w-32' : 'h-40 w-40'}`}>
      <svg viewBox="0 0 128 128" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="10" />
        <motion.circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="url(#hero-score-ring)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: reduce ? circumference - progress : circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: reduce ? 0 : 1.4, delay: 0.45, ease: EASE }}
        />
        <defs>
          <linearGradient id="hero-score-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="55%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>
        </defs>
      </svg>
      <div className="relative text-center">
        <p className={`${compact ? 'text-3xl' : 'text-4xl'} font-black tracking-[-0.06em] text-slate-950`}>7.5</p>
        <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Overall band</p>
      </div>
    </div>
  )
}

function SkillBars() {
  const reduce = !!useReducedMotion()

  return (
    <div className="space-y-3">
      {SKILLS.map((skill, index) => {
        const Icon = skill.icon
        return (
          <div key={skill.label}>
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[10px] font-black text-slate-600">{skill.label}</span>
              </div>
              <span className="text-[10px] font-black text-slate-400">{skill.score}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-red-600 to-rose-400"
                initial={{ width: reduce ? `${skill.score}%` : 0 }}
                animate={{ width: `${skill.score}%` }}
                transition={{ duration: reduce ? 0 : 0.9, delay: 0.65 + index * 0.08, ease: EASE }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function LiquidGlassHero() {
  const reduce = !!useReducedMotion()

  return (
    <div className="relative mx-auto h-[570px] w-full max-w-[650px]">
      <div className="absolute left-[8%] top-[6%] h-[84%] w-[84%] rounded-full bg-gradient-to-br from-red-200/80 via-rose-100/45 to-blue-100/60 blur-[60px]" />
      <motion.div
        animate={reduce ? undefined : { y: [0, -8, 0], rotate: [0, 1, 0] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
        className="profai-glass-panel absolute left-[7%] top-[9%] h-[460px] w-[86%] overflow-hidden rounded-[34px]"
      >
        <div className="flex h-14 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-600 text-white shadow-[0_7px_16px_rgba(220,38,38,0.25)]">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-xs font-black tracking-tight text-slate-900">Performance cockpit</p>
              <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-slate-400">AI analysis complete</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live roadmap
          </div>
        </div>

        <div className="grid h-[calc(100%-3.5rem)] grid-cols-[4rem_1fr]">
          <aside className="border-r border-slate-100 bg-slate-50/60 py-5">
            <div className="flex flex-col items-center gap-4">
              {[BarChart3, Target, BookOpen, GraduationCap].map((Icon, index) => (
                <span
                  key={index}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                    index === 0 ? 'bg-red-600 text-white shadow-[0_8px_18px_rgba(220,38,38,0.24)]' : 'text-slate-400'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </div>
          </aside>

          <main className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">Good morning, future scholar</p>
                <h3 className="mt-1 text-xl font-black tracking-[-0.035em] text-slate-950">Your score is moving up.</h3>
              </div>
              <div className="flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-2.5 py-2 text-[9px] font-black text-red-600">
                <TrendingUp className="h-3.5 w-3.5" /> +1.5 band
              </div>
            </div>

            <div className="mt-4 grid grid-cols-[0.82fr_1.18fr] gap-3">
              <div className="grid place-items-center rounded-2xl border border-slate-100 bg-white p-3 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
                <ScoreRing />
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] font-black text-slate-700">Skill readiness</p>
                  <p className="text-[9px] font-bold text-slate-400">This week</p>
                </div>
                <SkillBars />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-3">
              {[
                { value: '9.0', label: 'IELTS goal', icon: Award },
                { value: '1600', label: 'SAT goal', icon: Target },
                { value: '24', label: 'Tasks done', icon: CheckCircle2 },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
                    <Icon className="h-4 w-4 text-red-500" />
                    <p className="mt-2 text-lg font-black tracking-[-0.04em] text-slate-950">{item.value}</p>
                    <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400">{item.label}</p>
                  </div>
                )
              })}
            </div>
          </main>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 18, y: -10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.7, delay: 0.65, ease: EASE }}
        className="absolute right-0 top-[4%] w-52 rounded-2xl border border-white bg-white/92 p-4 shadow-[0_24px_55px_rgba(15,23,42,0.16)] backdrop-blur-xl"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-white">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">University fit</p>
            <p className="text-base font-black text-slate-950">94% match</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2">
          <span className="text-[9px] font-black text-emerald-700">Strong profile</span>
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -18, y: 12 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.7, delay: 0.8, ease: EASE }}
        className="absolute bottom-[4%] left-0 w-56 rounded-2xl border border-white bg-slate-950 p-4 text-white shadow-[0_25px_60px_rgba(15,23,42,0.26)]"
      >
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-600">
            <Bot className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-black">AI Study Coach</p>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </div>
            <p className="mt-1 text-[9px] leading-4 text-slate-400">Your next best task is ready.</p>
          </div>
        </div>
        <div className="mt-3 rounded-xl bg-white/7 px-3 py-2.5 text-[9px] font-bold text-slate-300">
          Writing Task 2 · Coherence drill <span className="float-right text-red-300">12 min</span>
        </div>
      </motion.div>
    </div>
  )
}

export function LiquidGlassHeroMobile() {
  return (
    <div className="relative mx-auto mt-3 w-full max-w-md overflow-hidden rounded-[28px] border border-white bg-white/90 p-4 shadow-[0_28px_70px_rgba(15,23,42,0.13)] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-black text-slate-900">Performance cockpit</p>
            <p className="text-[8px] font-bold uppercase tracking-wider text-emerald-600">Roadmap updated</p>
          </div>
        </div>
        <span className="rounded-full bg-red-50 px-2.5 py-1 text-[9px] font-black text-red-600">+1.5 band</span>
      </div>

      <div className="mt-4 grid grid-cols-[0.82fr_1.18fr] gap-3">
        <div className="grid place-items-center rounded-2xl bg-slate-50 p-2">
          <ScoreRing compact />
        </div>
        <div className="rounded-2xl border border-slate-100 p-3">
          <p className="mb-3 text-[10px] font-black text-slate-700">Skill readiness</p>
          <SkillBars />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          ['IELTS', '9.0'],
          ['SAT', '1600'],
          ['UNIVERSITY', '94%'],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-slate-950 px-3 py-3 text-white">
            <p className="text-lg font-black tracking-tight">{value}</p>
            <p className="mt-0.5 text-[7px] font-black uppercase tracking-wider text-slate-400">{label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
