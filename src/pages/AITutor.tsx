import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  AudioLines,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  ImagePlus,
  Languages,
  Mic2,
  PenLine,
  Sigma,
  Sparkles,
} from 'lucide-react'
import AIChatWindow from '@/components/ai/AIChatWindow'
import VoiceOrb from '@/components/ai/VoiceOrb'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { AmbientBackdrop } from '@/components/fx'
import { BrandMark } from '@/components/brand/BrandLogo'

const EASE = [0.22, 1, 0.36, 1] as const

const WORKSPACES = [
  {
    icon: PenLine,
    title: 'IELTS Writing Coach',
    detail: 'Structure, vocabulary and band feedback',
    path: '/ielts/writing/tests',
    tone: 'from-red-500 to-rose-700',
  },
  {
    icon: Sigma,
    title: 'SAT Problem Solver',
    detail: 'Reasoning-first Math and Reading help',
    path: '/sat',
    tone: 'from-indigo-500 to-violet-700',
  },
  {
    icon: BookOpen,
    title: 'Vocabulary Builder',
    detail: 'Context, examples and spaced review',
    path: '/vocabulary',
    tone: 'from-amber-500 to-orange-600',
  },
  {
    icon: CalendarDays,
    title: 'Personal Study Plan',
    detail: 'Turn your exam date into daily actions',
    path: '/dashboard',
    tone: 'from-emerald-500 to-teal-700',
  },
] as const

const CAPABILITIES = [
  { icon: ImagePlus, label: 'Understands screenshots' },
  { icon: AudioLines, label: 'Voice conversation' },
  { icon: Languages, label: 'Uzbek, English and Russian' },
] as const

export default function AITutor() {
  const navigate = useNavigate()
  const openTalk = useAiAssistantStore((state) => state.openTalk)
  const voiceState = useAiAssistantStore((state) => state.voiceState)
  const voiceLevel = useAiAssistantStore((state) => state.voiceLevel)
  const user = useAuthStore((state: AuthState) => state.user)
  const firstName = user?.fullName?.split(' ')[0] ?? 'Learner'

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-8">
      <AmbientBackdrop variant="red" />
      <div className="pointer-events-none absolute left-[18%] top-20 h-44 w-44 rounded-full bg-red-400/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 right-[12%] h-52 w-52 rounded-full bg-orange-300/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: EASE }}
        className="relative mx-auto w-full max-w-[1450px]"
      >
        <header className="mb-5 flex flex-col gap-4 rounded-[1.7rem] border border-white/85 bg-white/78 p-4 shadow-[0_20px_65px_rgba(127,29,29,0.12)] backdrop-blur-2xl sm:flex-row sm:items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl border border-red-100 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:text-red-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </button>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="relative inline-flex">
              <span className="absolute inset-0 rounded-full bg-red-500/40 blur-lg" />
              <BrandMark size={44} className="relative" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-lg font-black text-slate-950">Prof · AI Tutor</h1>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
              </div>
              <p className="truncate text-xs font-semibold text-slate-500">Personal coaching connected to your ProfAI progress</p>
            </div>
          </div>
          <button
            onClick={openTalk}
            className="cta-sheen inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-700 via-red-600 to-rose-600 px-5 text-sm font-black text-white shadow-[0_14px_30px_rgba(220,38,38,0.3)] transition hover:-translate-y-0.5"
          >
            <Mic2 className="h-4 w-4" />
            Start voice session
          </button>
        </header>

        <div className="grid gap-5 lg:grid-cols-[330px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <section className="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 p-5 text-white shadow-[0_28px_70px_rgba(15,23,42,0.24)]">
              <div className="flex items-center gap-4">
                <VoiceOrb state={voiceState} level={voiceLevel} size={76} />
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-red-200">
                    <Sparkles className="h-3 w-3" />
                    Live learning context
                  </span>
                  <h2 className="mt-2 text-xl font-black">Hello, {firstName}</h2>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Ask for an explanation, feedback, a timed drill or a study plan. ProfAI uses the active learning context to keep answers focused.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {CAPABILITIES.map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/8 px-2.5 py-1.5 text-[10px] font-bold text-slate-200">
                    <Icon className="h-3 w-3 text-red-300" />
                    {label}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-[1.65rem] border border-white/90 bg-white/78 p-3 shadow-[0_18px_50px_rgba(15,23,42,0.09)] backdrop-blur-2xl">
              <div className="flex items-center gap-2 px-2 pb-3 pt-1">
                <BrainCircuit className="h-4 w-4 text-red-600" />
                <h2 className="text-sm font-black text-slate-950">Learning workspaces</h2>
              </div>
              <div className="space-y-2">
                {WORKSPACES.map(({ icon: Icon, title, detail, path, tone }) => (
                  <button
                    key={title}
                    onClick={() => navigate(path)}
                    className="group flex min-h-16 w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white/85 p-3 text-left transition hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md"
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${tone} text-white shadow-md`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <b className="block truncate text-xs text-slate-950">{title}</b>
                      <small className="mt-1 block truncate text-[10px] font-semibold text-slate-500">{detail}</small>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <section className="min-h-[43rem] overflow-hidden rounded-[1.8rem] border border-white/90 bg-white/70 p-2 shadow-[0_28px_75px_rgba(15,23,42,0.12)] backdrop-blur-2xl sm:p-3">
            <AIChatWindow variant="page" />
          </section>
        </div>
      </motion.div>
    </main>
  )
}
