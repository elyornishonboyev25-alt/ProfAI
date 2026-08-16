import { motion } from 'framer-motion'
import {
  BookOpen,
  CheckCircle2,
  Headphones,
  Lock,
  Mic2,
  PenSquare,
  Sparkles,
} from 'lucide-react'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'

export type LessonPathDay = {
  id: string
  label: string
  vocabularyCompleted: boolean
  readingCompleted: boolean
  listeningCompleted: boolean
}

type CoreModule = 'vocabulary' | 'reading' | 'listening'

type LessonPathProps = {
  days: LessonPathDay[]
  onOpenModule?: (module: CoreModule, day: LessonPathDay) => void
}

const coreModules: Array<{ key: CoreModule; label: string; icon: typeof BookOpen }> = [
  { key: 'vocabulary', label: 'Vocabulary', icon: BookOpen },
  { key: 'reading', label: 'Reading', icon: PenSquare },
  { key: 'listening', label: 'Listening', icon: Headphones },
]

const lockedModules = [
  { key: 'writing', label: 'Writing', icon: PenSquare },
  { key: 'speaking', label: 'Speaking', icon: Mic2 },
] as const

function isUnlocked(day: LessonPathDay, module: CoreModule) {
  if (module === 'vocabulary') return true
  if (module === 'reading') return day.vocabularyCompleted
  return day.readingCompleted
}

function isCompleted(day: LessonPathDay, module: CoreModule) {
  if (module === 'vocabulary') return day.vocabularyCompleted
  if (module === 'reading') return day.readingCompleted
  return day.listeningCompleted
}

export function LessonPath({ days, onOpenModule }: LessonPathProps) {
  const { allowHoverMotion, minimalMotion } = useMotionPreferences()

  return (
    <section className="panel-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Daily Learning Path</h2>
          <p className="mt-1 text-sm text-slate-600">Vocabulary - Reading - Listening flow is preserved. New modules are visual placeholders.</p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          <Sparkles className="h-3.5 w-3.5" />
          Path
        </span>
      </div>

      <div className="mt-4 space-y-4">
        {days.map((day) => (
          <article key={day.id} className="rounded-2xl border border-blue-100 bg-white/85 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.08)]">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-blue-700">{day.label}</p>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                6 nodes
              </span>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute left-5 top-6 h-[calc(100%-3rem)] w-px bg-blue-100" />
              <div className="space-y-2.5">
                {coreModules.map((module) => {
                  const unlocked = isUnlocked(day, module.key)
                  const completed = isCompleted(day, module.key)
                  const Icon = module.icon

                  return (
                    <motion.button
                      key={`${day.id}_${module.key}`}
                      type="button"
                      disabled={!unlocked}
                      onClick={() => onOpenModule?.(module.key, day)}
                      whileHover={allowHoverMotion && unlocked ? { y: -2 } : undefined}
                      className={`relative flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                        unlocked
                          ? 'border-blue-200 bg-gradient-to-r from-white to-blue-50/70'
                          : 'cursor-not-allowed border-slate-200 bg-slate-100/85 text-slate-500'
                      }`}
                    >
                      <span
                        className={`relative z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border ${
                          completed
                            ? 'border-emerald-200 bg-emerald-100 text-emerald-700'
                            : unlocked
                              ? 'border-blue-200 bg-blue-100 text-blue-700'
                              : 'border-slate-300 bg-slate-200 text-slate-500'
                        }`}
                      >
                        {completed ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">{module.label}</p>
                        <p className="text-xs text-slate-500">
                          {completed ? 'Completed' : unlocked ? 'Available' : 'Locked'}
                        </p>
                      </div>
                      {!unlocked ? <Lock className="ml-auto h-4 w-4 text-slate-400" /> : null}
                    </motion.button>
                  )
                })}

                {lockedModules.map((module) => {
                  const Icon = module.icon
                  return (
                    <div
                      key={`${day.id}_${module.key}`}
                      title="Coming Soon"
                      className="relative cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100/85 px-3 py-3 opacity-70 blur-[0.25px]"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-slate-200 text-slate-500">
                          <Icon className="h-4 w-4" />
                          <span className="absolute -bottom-1 -right-1 rounded-full border border-slate-300 bg-white p-0.5 text-slate-600">
                            <Lock className="h-2.5 w-2.5" />
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">{module.label}</p>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Coming Soon</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </article>
        ))}
      </div>

      {!minimalMotion ? (
        <p className="mt-4 text-xs text-slate-500">
          Locked placeholders are intentionally non-clickable and stay disabled until future release.
        </p>
      ) : null}
    </section>
  )
}

export default LessonPath
