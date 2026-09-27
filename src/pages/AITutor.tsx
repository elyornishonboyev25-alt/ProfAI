import UiText from '@/components/common/UiText'
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
        <header className="mb-3 flex shrink-0 flex-row items-center gap-3 rounded-[1.6rem] border border-white/90 bg-[linear-gradient(125deg,rgba(255,255,255,.92),rgba(247,246,247,.78)_62%,rgba(255,238,241,.84))] p-3 shadow-[0_18px_50px_rgba(73,43,52,.09),inset_0_1px_0_white] backdrop-blur-2xl sm:p-3.5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="relative inline-flex">
              <span className="absolute inset-0 rounded-full bg-red-400/35 blur-lg" />
              <BrandMark size={44} className="relative" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="truncate text-lg font-black text-slate-950"> <UiText text={"ProfAI Coach"} /> </h1>
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
              </div>
              <p className="hidden truncate text-xs font-semibold text-slate-500 sm:block"> <UiText text={"Personal guidance grounded in your ProfAI journey"} /> </p>
              <span className="mt-1 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-emerald-700">
                <ShieldCheck className="h-3 w-3" />  <UiText text={"Account-private conversation"} /> </span>
            </div>
          </div>
          <button
            onClick={openTalk}
            className="ml-auto inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-red-400/45 bg-gradient-to-r from-red-700 to-red-500 px-3 text-xs font-bold text-white shadow-[0_10px_24px_rgba(185,28,47,.2)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(185,28,47,.28)] sm:px-4 sm:text-sm"
          >
            <Mic2 className="h-4 w-4" />
            <span className="hidden sm:inline"> <UiText text={"Start voice session"} /> </span>
            <span className="sm:hidden"> <UiText text={"Voice"} /> </span>
          </button>
        </header>

        <div className="grid min-h-0 min-w-0 flex-1 grid-rows-[auto_minmax(0,1fr)] gap-3 lg:grid-cols-[292px_minmax(0,1fr)] lg:grid-rows-1">
          <aside className="no-scrollbar min-h-0 min-w-0 space-y-3 overflow-x-hidden overflow-y-auto">
            <section className="hidden overflow-hidden rounded-3xl border border-white/90 bg-[linear-gradient(145deg,rgba(255,255,255,.86),rgba(248,245,246,.7))] p-4 shadow-[0_16px_42px_rgba(73,43,52,.07),inset_0_1px_0_white] backdrop-blur-2xl lg:block">
              <div className="flex items-center gap-4">
                <VoiceOrb state={voiceState} level={voiceLevel} size={64} />
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-white/80 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-red-700">
                    <Sparkles className="h-3 w-3" />
                     <UiText text={"Context connected"} /> </span>
                  <h2 className="mt-2 text-lg font-black text-slate-950"> <UiText text={"Hello,"} /> {firstName}</h2>
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                 <UiText text={"Pick a focus for this conversation. Your chat stays in place while the coaching style adapts."} /> </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {CAPABILITIES.map(({ icon: Icon, label }) => (
                  <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/75 px-2.5 py-1.5 text-[10px] font-bold text-slate-600">
                    <Icon className="h-3 w-3 text-red-600" />
                    {label}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-white/90 bg-[linear-gradient(145deg,rgba(255,255,255,.86),rgba(247,245,246,.75))] p-2.5 shadow-[0_16px_42px_rgba(73,43,52,.07),inset_0_1px_0_white] backdrop-blur-2xl">
              <div className="flex items-center gap-2 px-2 pb-3 pt-1">
                <BrainCircuit className="h-4 w-4 text-red-600" />
                <div>
                  <h2 className="text-sm font-black text-slate-950"> <UiText text={"Conversation mode"} /> </h2>
                  <p className="text-[10px] font-medium text-slate-500"> <UiText text={"Sets ProfAI’s focus — no page change"} /> </p>
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
                        ? 'border-red-200/90 bg-gradient-to-r from-red-50/90 to-white/85 shadow-[0_10px_24px_rgba(185,28,47,.1)]'
                        : 'border-white/70 bg-white/70 hover:border-red-100 hover:bg-white'
                    }`}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${selected ? 'bg-gradient-to-br from-red-700 to-red-500 text-white shadow-[0_6px_14px_rgba(185,28,47,.2)]' : 'border border-zinc-200 bg-white/75 text-slate-600'}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <b className="block truncate text-xs text-slate-950">{workspace.title}</b>
                      <small className="mt-0.5 block truncate text-[10px] font-semibold text-slate-500 lg:block">{workspace.detail}</small>
                    </span>
                    {selected ? <Check className="h-4 w-4 shrink-0 text-red-600" /> : null}
                  </button>
                  )
                })}
              </div>
            </section>
          </aside>

          <section className="min-h-0 min-w-0 overflow-hidden rounded-3xl border border-white/90 bg-[linear-gradient(145deg,rgba(255,255,255,.74),rgba(240,238,241,.58))] p-1.5 shadow-[0_22px_60px_rgba(73,43,52,.11),inset_0_1px_0_white] backdrop-blur-2xl sm:p-2">
            <AIChatWindow variant="page" />
          </section>
        </div>
      </motion.div>
    </main>
  )
}
