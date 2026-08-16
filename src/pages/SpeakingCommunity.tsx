import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, BarChart3, Clock3, Crown, MessagesSquare, Mic, Sparkles, Users, Wand2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useCommunityTrial } from '@/hooks/useFeatureTrial'
import { computeSummary, selectUserSessions, useSpeakingStore } from '@/store/speakingStore'
import { Reveal } from '@/components/fx'
import AiCoach from '@/components/speaking/sections/AiCoach'
import Debate from '@/components/speaking/sections/Debate'
import Partner from '@/components/speaking/sections/Partner'
import Progress from '@/components/speaking/sections/Progress'
import Community from '@/components/speaking/sections/Community'

type Section = 'ai' | 'debate' | 'partner' | 'progress' | 'community'

const SECTIONS: Array<{ id: Section; label: string; icon: typeof Wand2; tag: string }> = [
  { id: 'ai', label: 'AI Coach', icon: Wand2, tag: 'Full Mock & Free Talk' },
  { id: 'debate', label: 'Debate', icon: MessagesSquare, tag: 'Group rooms' },
  { id: 'partner', label: 'Partner', icon: Users, tag: '1-on-1 voice' },
  { id: 'progress', label: 'My Progress', icon: BarChart3, tag: 'Charts & rank' },
  { id: 'community', label: 'Community', icon: Mic, tag: 'Speakers' },
]

export default function SpeakingCommunity() {
  const navigate = useNavigate()
  const user = useAuthStore((state: AuthState) => state.user)
  const sessions = useSpeakingStore((s) => s.sessions)
  const [section, setSection] = useState<Section>(() => {
    const requested = new URLSearchParams(window.location.search).get('section')
    return SECTIONS.some((item) => item.id === requested) ? requested as Section : 'ai'
  })
  const [partnerKey, setPartnerKey] = useState(0)
  const communityTrial = useCommunityTrial()
  const inLiveSection = section === 'debate' || section === 'partner'

  // Burn the shared 1-hour debate+partner budget while the learner is on those
  // tabs and the tab is visible. Premium owners are unlimited.
  useEffect(() => {
    if (communityTrial.isPremium || !inLiveSection || communityTrial.locked) return
    const id = window.setInterval(() => {
      if (!document.hidden) communityTrial.addSeconds(1)
    }, 1000)
    return () => window.clearInterval(id)
  }, [inLiveSection, communityTrial.isPremium, communityTrial.locked, communityTrial.addSeconds])

  const summary = useMemo(
    () => computeSummary(selectUserSessions(sessions, user?.id ?? null)),
    [sessions, user?.id],
  )

  const active = SECTIONS.find((s) => s.id === section) ?? SECTIONS[0]

  return (
    <div className="workspace-page relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">

      <div className="relative mx-auto w-full max-w-6xl space-y-6">
        {/* Hero */}
        <Reveal>
          <section className="premium-hero p-6 sm:p-8">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_26rem] xl:items-center">
              <div>
                <div className="premium-top-controls">
                  <button type="button" onClick={() => navigate('/dashboard')} className="premium-back-btn group">
                    <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
                    Back to Dashboard
                  </button>
                  <span className="premium-top-chip">
                    <Mic className="h-3.5 w-3.5" /> Speaking Studio
                  </span>
                </div>
                <h1 className="premium-section-title mt-4">
                  Master <span className="arena-title-accent-red">English Speaking</span>
                </h1>
                <p className="premium-section-subtitle max-w-3xl">
                  Practise with an AI examiner, study real questions with model answers, debate in groups, or talk live
                  with real partners — all in one professional studio.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3 xl:w-full">
                <HeroStat label="Avg Band" value={summary.averageBand ? summary.averageBand.toFixed(1) : '—'} note="Across sessions" />
                <HeroStat label="Speaking Time" value={`${summary.totalMinutes}m`} note="Total practised" />
                <HeroStat label="Day Streak" value={String(summary.currentStreak)} note="Keep it alive" />
              </div>
            </div>
          </section>
        </Reveal>

        {/* Section nav */}
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {SECTIONS.map((s) => {
            const Icon = s.icon
            const isActive = section === s.id
            return (
              <motion.button
                key={s.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSection(s.id)}
                className={`flex shrink-0 items-center gap-2 rounded-2xl border px-4 py-3 text-left transition ${
                  isActive
                    ? 'border-blue-300 bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-[0_12px_26px_rgba(37,99,235,0.3)]'
                    : 'border-blue-100 bg-white/90 text-slate-700 hover:border-blue-300'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                <span>
                  <span className="block text-sm font-bold leading-tight">{s.label}</span>
                  <span className={`block text-[10px] font-medium ${isActive ? 'text-white/80' : 'text-slate-400'}`}>{s.tag}</span>
                </span>
              </motion.button>
            )
          })}
        </div>

        {/* Active section */}
        <div className="min-h-[40vh]">
          <p className="mb-3 inline-flex items-center gap-2 text-lg font-black text-slate-900">
            <active.icon className="h-5 w-5 text-blue-600" /> {active.label}
          </p>
          {inLiveSection && !communityTrial.isPremium ? (
            <div
              className={`mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border px-4 py-2.5 text-sm font-bold ${
                communityTrial.locked ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-amber-200 bg-amber-50 text-amber-700'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-4 w-4" />
                {communityTrial.locked
                  ? 'Free debate & partner time used up'
                  : `Free community time left: ${formatRemaining(communityTrial.secondsRemaining)}`}
              </span>
              <button
                type="button"
                onClick={() => navigate('/premium')}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm"
              >
                <Crown className="h-3.5 w-3.5" /> Go Premium
              </button>
            </div>
          ) : null}
          {section === 'ai' ? <AiCoach /> : null}
          {section === 'debate'
            ? communityTrial.locked
              ? <CommunityLockedCard onUpgrade={() => navigate('/premium')} />
              : <Debate />
            : null}
          {section === 'partner'
            ? communityTrial.locked
              ? <CommunityLockedCard onUpgrade={() => navigate('/premium')} />
              : <Partner key={partnerKey} onExit={() => setPartnerKey((k) => k + 1)} />
            : null}
          {section === 'progress' ? <Progress onStart={() => setSection('ai')} /> : null}
          {section === 'community' ? <Community /> : null}
        </div>
      </div>
    </div>
  )
}

function formatRemaining(seconds: number) {
  if (!Number.isFinite(seconds)) return '—'
  const total = Math.max(0, Math.floor(seconds))
  const mm = Math.floor(total / 60)
  const ss = total % 60
  return `${mm}:${ss.toString().padStart(2, '0')}`
}

function CommunityLockedCard({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="rounded-[1.6rem] border border-amber-200 bg-white p-8 text-center shadow-[0_18px_44px_rgba(30,64,175,0.12)]">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-white shadow-[0_16px_32px_rgba(245,158,11,0.4)]">
        <Crown className="h-8 w-8" />
      </div>
      <span className="premium-top-chip mt-5 inline-flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5" />
        Premium only
      </span>
      <h3 className="mt-3 text-2xl font-black text-slate-900">Free community time used up</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
        You&apos;ve used your free hour of debate &amp; partner sessions. Subscribe to Premium for unlimited live
        speaking practice with the community.
      </p>
      <button
        type="button"
        onClick={onUpgrade}
        className="cta-sheen mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#1D4ED8] px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.34)]"
      >
        <Crown className="h-4 w-4" />
        Subscribe to Premium
      </button>
    </div>
  )
}

function HeroStat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="hero-metric-card interactive-lift">
      <p className="hero-metric-label">{label}</p>
      <p className="hero-metric-value-sm hero-metric-value-compact">{value}</p>
      <p className="hero-metric-note">{note}</p>
    </div>
  )
}
