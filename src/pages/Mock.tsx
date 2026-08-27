import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Clock3, Crown, Headphones, ShieldCheck, Sparkles, Target } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Stagger, StaggerItem, Tilt3D } from '@/components/fx'
import { useFeatureTrial } from '@/hooks/useFeatureTrial'
import CatalogHero from '@/components/catalog/CatalogHero'

const tracks = [
  {
    id: 'ielts',
    title: 'IELTS Mock Arena',
    subtitle: 'Full 4-section simulation',
    description:
      'Reading, Listening, Writing, and Speaking in exam-sequence order with strict timing behavior.',
    path: '/mock/ielts',
    tone: 'red',
    chips: ['2h 45m flow', '4 sections', 'exam pressure mode'],
  },
  {
    id: 'sat',
    title: 'SAT Mock Arena',
    subtitle: 'Digital SAT simulation',
    description:
      'Reading/Writing and Math modules inside one controlled environment with timer discipline and section gates.',
    path: '/mock/sat',
    tone: 'blue',
    chips: ['2h 14m flow', '4 modules', 'adaptive pacing'],
  },
] as const

function cardToneClass(tone: (typeof tracks)[number]['tone']) {
  if (tone === 'blue') {
    return 'border-blue-200 bg-gradient-to-br from-white via-blue-50 to-indigo-100/75 shadow-[0_20px_40px_rgba(37,99,235,0.16)]'
  }

  return 'border-blue-200 bg-gradient-to-br from-white via-indigo-50 to-blue-100/70 shadow-[0_20px_40px_rgba(37,99,235,0.16)]'
}

function labelToneClass(tone: (typeof tracks)[number]['tone']) {
  if (tone === 'blue') {
    return 'border-blue-200 text-blue-700'
  }

  return 'border-blue-200 text-blue-700'
}

function linkToneClass(tone: (typeof tracks)[number]['tone']) {
  if (tone === 'blue') {
    return 'text-blue-700'
  }

  return 'text-blue-700'
}

export default function Mock() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const mockTrial = useFeatureTrial('mock')
  const [showMockGate, setShowMockGate] = useState(false)

  const launchMock = (path: string) => {
    if (mockTrial.locked) {
      setShowMockGate(true)
      return
    }
    mockTrial.consume()
    navigate(path, { state: { from: from ?? 'mock' } })
  }

  return (
    <div className="workspace-page relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">

      <AnimatePresence>
        {showMockGate ? (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/55 backdrop-blur-md"
              onClick={() => setShowMockGate(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-md overflow-hidden rounded-[1.6rem] border border-amber-200 bg-white p-7 text-center shadow-[0_34px_78px_rgba(30,64,175,0.28)]"
            >
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-400 via-blue-500 to-indigo-500" />
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 text-white shadow-[0_16px_32px_rgba(245,158,11,0.4)]">
                <Crown className="h-8 w-8" />
              </div>
              <span className="premium-top-chip mt-5 inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Premium only
              </span>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900">Free mock exams used up</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                You&apos;ve used your {mockTrial.limit} free mock exams. Subscribe to Premium for unlimited full-length
                IELTS &amp; SAT mock simulations with AI analysis.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/premium')}
                  className="cta-sheen inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#1D4ED8] px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.34)]"
                >
                  <Crown className="h-4 w-4" />
                  Subscribe to Premium
                </button>
                <button
                  type="button"
                  onClick={() => setShowMockGate(false)}
                  className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  Maybe later
                </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <div className="relative mx-auto w-full max-w-[92rem] space-y-5">
        <CatalogHero
          tone="rose"
          backLabel="Test Preparation"
          onBack={() => navigate('/test-preparation')}
          eyebrow="Mock Exam Center"
          title={<>Real exam pressure. <span className="bg-gradient-to-r from-blue-700 via-indigo-600 to-orange-500 bg-clip-text text-transparent">Clear controlled practice.</span></>}
          subtitle="Choose IELTS or Digital SAT and enter a distraction-free simulation with official pacing, locked section flow and actionable review."
          filters={tracks.map((track) => ({ id: track.id, label: track.id === 'ielts' ? 'IELTS full mock' : 'Digital SAT mock' }))}
          activeFilter=""
          onFilterChange={(id) => {
            const track = tracks.find((item) => item.id === id)
            if (track) launchMock(track.path)
          }}
          summary={[
            { label: 'Exam tracks', value: '2' },
            { label: 'Session mode', value: 'Locked' },
          ]}
          badge={!mockTrial.isPremium && Number.isFinite(mockTrial.remaining) ? (
            <span className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 text-[10px] font-black uppercase tracking-[0.12em] text-amber-700">
              <Sparkles className="h-3.5 w-3.5" /> {Math.max(0, mockTrial.remaining)}/{mockTrial.limit} free mocks left
            </span>
          ) : undefined}
          actions={(
            <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-600">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white bg-white/75 px-3 py-1.5"><Clock3 className="h-3.5 w-3.5 text-blue-600" /> Full-length timing</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white bg-white/75 px-3 py-1.5"><Target className="h-3.5 w-3.5 text-blue-600" /> Real exam pressure</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white bg-white/75 px-3 py-1.5"><ShieldCheck className="h-3.5 w-3.5 text-blue-600" /> Section lock flow</span>
            </div>
          )}
        />

        <Stagger className="grid gap-5 md:grid-cols-2">
          {tracks.map((track, index) => (
            <StaggerItem key={track.id} className="h-full">
              <Tilt3D className="h-full rounded-[1.85rem]" max={6}>
                <button
                  onClick={() => launchMock(track.path)}
                  className={`interactive-lift group relative isolate flex min-h-[24rem] h-full w-full flex-col overflow-hidden rounded-[1.85rem] border p-6 text-left ${cardToneClass(track.tone)}`}
                >
                  <span className={`pointer-events-none absolute -right-16 -top-20 -z-10 h-64 w-64 rounded-full blur-3xl ${track.tone === 'blue' ? 'bg-blue-200/70' : 'bg-blue-200/70'}`} />
                  <div className="flex items-start justify-between gap-3">
                    <span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg ${track.tone === 'blue' ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-gradient-to-br from-blue-600 to-indigo-700'}`}>
                      <Headphones className="h-5 w-5" />
                    </span>
                    <span className="text-5xl font-black tracking-[-0.08em] text-white/80">0{index + 1}</span>
                  </div>
                  <div className={`mt-6 inline-flex w-fit items-center gap-2 rounded-full border bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${labelToneClass(track.tone)}`}>
                    {track.subtitle}
                  </div>
                  <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{track.title}</h2>
                  <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-slate-600">{track.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                    {track.chips.map((chip) => (
                      <span key={chip} className="rounded-full border border-white bg-white/85 px-3 py-1 text-slate-600 shadow-sm">
                        {chip}
                      </span>
                    ))}
                  </div>
                  <span className={`mt-auto inline-flex items-center gap-1 pt-7 text-sm font-black transition group-hover:translate-x-1 ${linkToneClass(track.tone)}`}>
                    Enter {track.title} <ArrowRight className="h-4 w-4" />
                  </span>
                </button>
              </Tilt3D>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </div>
  )
}
