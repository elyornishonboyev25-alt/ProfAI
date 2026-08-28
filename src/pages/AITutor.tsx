import { motion } from 'framer-motion'
import {
  AudioLines,
  BookOpen,
  BrainCircuit,
  CalendarDays,
  Check,
  GraduationCap,
  ImagePlus,
  Languages,
  Mic2,
  PenLine,
  Sigma,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import AIChatWindow from '@/components/ai/AIChatWindow'
import VoiceOrb from '@/components/ai/VoiceOrb'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { AmbientBackdrop } from '@/components/fx'
import { BrandMark } from '@/components/brand/BrandLogo'
import { AI_WORKSPACES, type AiWorkspaceId } from '@/services/ai/workspaces'

const EASE = [0.22, 1, 0.36, 1] as const

const WORKSPACE_ICONS: Record<AiWorkspaceId, typeof BrainCircuit> = {
  general: BrainCircuit,
  ielts: PenLine,
  sat: Sigma,
  english: BookOpen,
  plan: CalendarDays,
  admission: GraduationCap,
}

const CAPABILITIES = [
  { icon: ImagePlus, label: 'Understands screenshots' },
  { icon: AudioLines, label: 'Voice conversation' },
  { icon: Languages, label: 'Goal-aware study guidance' },
] as const

export default function AITutor() {
  const openTalk = useAiAssistantStore((state) => state.openTalk)
  const voiceState = useAiAssistantStore((state) => state.voiceState)
  const voiceLevel = useAiAssistantStore((state) => state.voiceLevel)
  const activeWorkspace = useAiAssistantStore((state) => state.activeWorkspace)
  const setActiveWorkspace = useAiAssistantStore((state) => state.setActiveWorkspace)
  const user = useAuthStore((state: AuthState) => state.user)
  const firstName = user?.fullName?.split(' ')[0] ?? 'Learner'

  return (
    <main className="workspace-page relative flex h-[calc(100dvh-5rem)] !min-h-0 overflow-hidden px-3 py-3 sm:px-4 sm:py-4 lg:h-dvh lg:px-5 lg:py-5">
      <AmbientBackdrop variant="red" />

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: EASE }}
        className="relative mx-auto flex h-full min-h-0 w-full max-w-[1400px] flex-col"
      >
        <header className="mb-3 flex shrink-0 flex-row items-center gap-3 rounded-[1.6rem] border border-white/90 bg-white/[0.72] p-3 shadow-[0_18px_50px_rgba(15,23,42,.07)] backdrop-blur-2xl sm:p-3.5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="relative inline-flex">
              <span className="absolute inset-0 rounded-full bg-blue-500/40 blur-lg" />
              <BrandMark size={44} className="relative" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-lg font-black text-slate-950">ProfAI Coach</h1>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
              </div>
              <p className="hidden truncate text-xs font-semibold text-slate-500 sm:block">Personal guidance grounded in your ProfAI journey</p>
              <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-700">
                <ShieldCheck className="h-3 w-3" /> Account-private conversation
              </span>
            </div>
          </div>
          <button
            onClick={openTalk}
            className="ml-auto inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-3 text-xs font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 sm:px-4 sm:text-sm"
          >
            <Mic2 className="h-4 w-4" />
            <span className="hidden sm:inline">Start voice session</span>
            <span className="sm:hidden">Voice</span>
          </button>
        </header>

        <div className="grid min-h-0 min-w-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-3 lg:grid-cols-[292px_minmax(0,1fr)] lg:grid-rows-1">
          <aside className="no-scrollbar min-h-0 min-w-0 space-y-3 overflow-x-hidden overflow-y-auto">
            <section className="hidden overflow-hidden rounded-3xl border border-white/90 bg-white/[0.68] p-4 shadow-[0_16px_42px_rgba(15,23,42,.06)] backdrop-blur-2xl lg:block">
              <div className="flex items-center gap-4">
                <VoiceOrb state={voiceState} level={voiceLevel} size={64} />
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-emerald-700">
                    <Sparkles className="h-3 w-3" />
                    Context connected
                  </span>
                  <h2 className="mt-2 text-lg font-black text-slate-950">Hello, {firstName}</h2>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Pick a focus for this conversation. Your chat stays in place while the coaching style adapts.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {CAPABILITIES.map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[10px] font-bold text-slate-600">
                    <Icon className="h-3 w-3 text-blue-500" />
                    {label}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/90 bg-white/[0.68] p-2.5 shadow-[0_16px_42px_rgba(15,23,42,.06)] backdrop-blur-2xl">
              <div className="flex items-center gap-2 px-2 pb-3 pt-1">
                <BrainCircuit className="h-4 w-4 text-blue-600" />
                <div>
                  <h2 className="text-sm font-black text-slate-950">Conversation mode</h2>
                  <p className="text-[10px] font-medium text-slate-500">Sets ProfAI’s focus — no page change</p>
                </div>
              </div>
              <div className="-mx-0.5 flex min-w-0 max-w-full gap-2 overflow-x-auto px-0.5 pb-1 lg:block lg:space-y-1.5 lg:overflow-visible lg:pb-0">
                {AI_WORKSPACES.map((workspace) => {
                  const Icon = WORKSPACE_ICONS[workspace.id]
                  const selected = activeWorkspace === workspace.id
                  return (
                  <button
                    key={workspace.id}
                    type="button"
                    onClick={() => setActiveWorkspace(workspace.id)}
                    aria-pressed={selected}
                    className={`group flex min-h-14 w-[176px] shrink-0 items-center gap-2.5 rounded-2xl border p-2.5 text-left transition lg:w-full ${
                      selected
                        ? 'border-blue-200/90 bg-gradient-to-r from-blue-50/95 to-white/80 shadow-[0_10px_24px_rgba(37,99,235,.08)]'
                        : 'border-white/70 bg-white/70 hover:border-slate-200 hover:bg-white'
                    }`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${selected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block truncate text-xs text-slate-950">{workspace.title}</b>
                      <small className="mt-0.5 block truncate text-[10px] font-semibold text-slate-500 lg:block">{workspace.detail}</small>
                    </span>
                    {selected ? <Check className="h-4 w-4 shrink-0 text-blue-600" /> : null}
                  </button>
                  )
                })}
              </div>
            </section>
          </aside>

          <section className="min-h-0 min-w-0 overflow-hidden rounded-3xl border border-white/90 bg-white/[0.45] p-1.5 shadow-[0_22px_60px_rgba(15,23,42,.09)] backdrop-blur-2xl sm:p-2">
            <AIChatWindow variant="page" />
          </section>
        </div>
      </motion.div>
    </main>
  )
}
