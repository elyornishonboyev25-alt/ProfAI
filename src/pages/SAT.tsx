import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Calculator,
  Check,
  ChevronDown,
  Clock3,
  FileSearch,
  Flag,
  LibraryBig,
  Lock,
  Sparkles,
} from 'lucide-react'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { loadActivityLog, loadOnboardingProfile } from '@/utils/weeklyPlanner'
import { getSATSectionTest, SAT_TEST_CATALOG, type SATTestDefinition } from '@/features/sat/catalog'
import { loadSATAttempt } from '@/features/sat/attemptStorage'
import { scoreSATModules, type SATAttempt } from '@/features/sat/practiceTest4'

type AttemptWithTest = {
  attempt: SATAttempt
  test: SATTestDefinition
}

const glassCard = 'relative overflow-hidden rounded-[2rem] border border-white/90 bg-white/50 shadow-[0_24px_70px_rgba(55,65,100,0.14),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-[28px]'

function ProgressRing({ value, size = 126 }: { value: number; size?: number }) {
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const progress = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} aria-label={`${value}% complete`}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 110 110" aria-hidden="true">
        <defs>
          <linearGradient id={`sat-ring-${value}-${size}`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#ef353d" />
            <stop offset="100%" stopColor="#9f2028" />
          </linearGradient>
        </defs>
        <circle cx="55" cy="55" r={radius} fill="none" stroke="rgba(148,163,184,.24)" strokeWidth="11" />
        <circle
          cx="55"
          cy="55"
          r={radius}
          fill="none"
          stroke={`url(#sat-ring-${value}-${size})`}
          strokeLinecap="round"
          strokeWidth="11"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[1.75rem] font-extrabold tracking-[-0.05em] text-[#141521] sm:text-[2rem]">
        {value}%
      </span>
    </div>
  )
}

function SubjectIllustration({ subject }: { subject: 'math' | 'reading' }) {
  return (
    <div className="relative flex h-[7.25rem] w-[9rem] items-end justify-start" aria-hidden="true">
      <span className="absolute bottom-2 left-2 h-16 w-16 rounded-full bg-red-300/25 blur-2xl" />
      {subject === 'math' ? (
        <>
          <Calculator className="relative z-10 h-[5.7rem] w-[5.7rem] -rotate-6 text-[#4d5363]" strokeWidth={1.35} />
          <svg className="absolute bottom-2 right-0 h-20 w-[5.6rem]" viewBox="0 0 90 80">
            <path d="M5 68V44h14v24M28 68V32h14v36M51 68V19h14v49M74 68V7" fill="rgba(239,53,61,.24)" stroke="#535866" strokeWidth="1.6" />
            <path d="m2 28 18-20 15 14L59 0" fill="none" stroke="#535866" strokeWidth="1.6" />
            <path d="m50 1 10-1-1 10" fill="none" stroke="#535866" strokeWidth="1.6" />
          </svg>
        </>
      ) : (
        <>
          <BookOpenText className="relative z-10 h-[6.4rem] w-[6.4rem] -rotate-3 text-[#4d5363]" fill="rgba(239,53,61,.12)" strokeWidth={1.3} />
          <svg className="absolute bottom-8 right-1 h-16 w-16 rotate-[-12deg]" viewBox="0 0 64 64">
            <path d="m11 52 35-38 8 8-35 38-12 3z" fill="#f6a6a9" stroke="#535866" strokeWidth="1.6" />
            <path d="m46 14 4-4c2-2 4-2 6 0l2 2c2 2 2 4 0 6l-4 4z" fill="#f4d9d7" stroke="#535866" strokeWidth="1.6" />
          </svg>
        </>
      )}
    </div>
  )
}

function SubjectCard({
  title,
  topics,
  progress,
  subject,
  onStart,
}: {
  title: string
  topics: string[]
  progress: number
  subject: 'math' | 'reading'
  onStart: () => void
}) {
  return (
    <motion.article whileHover={{ y: -4 }} className={`${glassCard} min-h-[24rem] p-6 sm:p-7`}>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(116deg,rgba(255,255,255,.62)_0%,rgba(255,255,255,.08)_47%,rgba(205,220,242,.2)_48%,rgba(255,255,255,.05)_100%)]" />
      <div className="relative flex h-full flex-col">
        <h2 className="text-[1.7rem] font-extrabold leading-tight tracking-[-0.045em] text-[#12131f] sm:text-[2rem]">{title}</h2>
        <div className="mt-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-extrabold text-[#1b1c27]">Topics</h3>
            <ul className="mt-1 space-y-1 text-base font-medium leading-6 text-[#292a35] sm:text-lg">
              {topics.map((topic) => <li key={topic}>{topic}</li>)}
            </ul>
          </div>
          <ProgressRing value={progress} />
        </div>
        <div className="mt-auto flex items-end justify-between gap-4 pt-3">
          <SubjectIllustration subject={subject} />
          <button
            type="button"
            onClick={onStart}
            className="group mb-1 inline-flex min-w-[9.5rem] items-center justify-center gap-2 rounded-full border border-red-300/70 bg-gradient-to-b from-[#ee4248] to-[#d5222c] px-7 py-3 text-lg font-extrabold text-white shadow-[0_12px_24px_rgba(220,38,38,.3),inset_0_2px_3px_rgba(255,255,255,.55)] hover:-translate-y-0.5 hover:brightness-105"
          >
            Start <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </motion.article>
  )
}

function ScoreChart({ scores }: { scores: number[] }) {
  const values = scores.slice(-5)

  if (!values.length) {
    return (
      <div className="mt-4 flex h-[13.5rem] flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-slate-300/80 bg-white/25 px-5 text-center">
        <Flag className="h-7 w-7 text-slate-400" />
        <p className="mt-3 text-sm font-extrabold text-slate-700">No completed test yet</p>
        <p className="mt-1 max-w-[15rem] text-[11px] font-medium leading-5 text-slate-500">Your verified SAT scores will appear here after you submit a full mock.</p>
      </div>
    )
  }

  const points = values.map((score, index) => {
    const x = values.length === 1 ? 164 : 34 + (index / (values.length - 1)) * 256
    const y = 162 - ((score - 400) / 1200) * 132
    return { x, y: Math.min(162, Math.max(30, y)), score }
  })
  const line = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ')
  const area = `${line} L ${points[points.length - 1]?.x ?? 290} 174 L ${points[0]?.x ?? 34} 174 Z`

  return (
    <svg className="mt-4 h-[13.5rem] w-full" viewBox="0 0 310 190" role="img" aria-label={`SAT score trend: ${values.join(', ')}`}>
      <defs>
        <linearGradient id="score-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#ef353d" stopOpacity=".28" />
          <stop offset="100%" stopColor="#ef353d" stopOpacity=".02" />
        </linearGradient>
      </defs>
      {[1600, 1200, 800, 400].map((score) => {
        const y = 162 - ((score - 400) / 1200) * 132
        return (
          <g key={score}>
            <line x1="34" y1={y} x2="300" y2={y} stroke="rgba(148,163,184,.2)" strokeWidth="1" />
            <text x="0" y={y + 3} fill="#7b8494" fontSize="9" fontWeight="700">{score}</text>
          </g>
        )
      })}
      {values.length > 1 ? <path d={area} fill="url(#score-area)" /> : null}
      {values.length > 1 ? <path d={line} fill="none" stroke="#d9343d" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /> : null}
      {points.map((point, index) => (
        <g key={`${point.x}-${point.y}`}>
          <circle cx={point.x} cy={point.y} r="9" fill="rgba(255,255,255,.65)" />
          <circle cx={point.x} cy={point.y} r="5.5" fill={index === points.length - 1 ? '#ef353d' : '#b43038'} />
          <text x={point.x} y={Math.max(17, point.y - 13)} textAnchor="middle" fill="#991b1b" fontSize="10" fontWeight="800">{point.score}</text>
          <text x={point.x} y="187" textAnchor="middle" fill="#7b8494" fontSize="8" fontWeight="700">Test {scores.length - values.length + index + 1}</text>
        </g>
      ))}
    </svg>
  )
}

export default function SAT() {
  const navigate = useNavigate()
  const user = useAuthStore((state: AuthState) => state.user)
  const { minimalMotion } = useMotionPreferences()
  const [showMockCatalog, setShowMockCatalog] = useState(false)
  const profile = loadOnboardingProfile(user?.id)

  const attempts = useMemo<AttemptWithTest[]>(() => (
    Object.values(SAT_TEST_CATALOG)
      .map((test) => ({ test, attempt: loadSATAttempt(test.id) }))
      .filter((item): item is AttemptWithTest => Boolean(item.attempt))
      .sort((a, b) => b.attempt.updatedAt - a.attempt.updatedAt)
  ), [])
  const sectionAttempts = useMemo<AttemptWithTest[]>(() => (
    Object.values(SAT_TEST_CATALOG)
      .flatMap((test) => (['math', 'reading-writing'] as const).map((section) => getSATSectionTest(test.mockId, section)))
      .map((test) => ({ test, attempt: loadSATAttempt(test.id) }))
      .filter((item): item is AttemptWithTest => Boolean(item.attempt))
  ), [])

  const activeAttempt = attempts.find(({ attempt }) => attempt.status === 'active')
  const completedAttempts = attempts.filter(({ attempt }) => attempt.status === 'submitted')
  const scoreHistory = completedAttempts
    .slice()
    .sort((a, b) => a.attempt.updatedAt - b.attempt.updatedAt)
    .map(({ attempt, test }) => scoreSATModules(test.modules, attempt.answers).midpoint)
  const bestScore = scoreHistory.length ? Math.max(...scoreHistory) : (profile?.currentSatScore ?? 1050)
  const targetScore = profile?.targetSatScore ?? 1400
  const targetProgress = Math.min(100, Math.max(1, Math.round((bestScore / targetScore) * 100)))
  const availableTests = Object.values(SAT_TEST_CATALOG).sort((a, b) => a.mockId - b.mockId)
  const mockSlots = Array.from({ length: 30 }, (_, index) => ({
    displayNumber: index + 1,
    test: availableTests[index],
  }))

  const answeredBySection = (section: 'math' | 'reading-writing') => {
    const latest = [...attempts, ...sectionAttempts]
      .sort((a, b) => b.attempt.updatedAt - a.attempt.updatedAt)
      .find(({ test }) => test.modules.some((module) => module.section === section))
    if (!latest) return section === 'math' ? 45 : 60
    const questions = latest.test.modules.flatMap((module) => module.questions).filter((question) => question.section === section)
    const answered = questions.filter((question) => latest.attempt.answers[question.id]?.trim()).length
    return Math.max(section === 'math' ? 12 : 18, Math.round((answered / Math.max(1, questions.length)) * 100))
  }

  const activityLog = loadActivityLog(user?.id)
  const trackedStudyMinutes = Object.values(activityLog).reduce((total, day) => (
    total + (day['sat-math'] ?? 0) + (day['sat-rw'] ?? 0) + (day.mock ?? 0)
  ), 0)
  const savedAttemptMinutes = [...attempts, ...sectionAttempts].reduce((total, { attempt, test }) => {
    const endedAt = attempt.submittedAt ?? attempt.terminatedAt ?? attempt.updatedAt
    const elapsedMinutes = Math.floor(Math.max(0, endedAt - attempt.startedAt) / 60_000)
    return total + Math.min(elapsedMinutes, Math.ceil(test.totalDurationSeconds / 60))
  }, 0)
  const studyMinutes = Math.max(trackedStudyMinutes, savedAttemptMinutes)
  const studyHours = studyMinutes >= 60 ? `${Math.round(studyMinutes / 60)}h` : `${studyMinutes}m`
  const recentProgress = activeAttempt
    ? Math.round((Object.keys(activeAttempt.attempt.answers).length / activeAttempt.test.questionCount) * 100)
    : completedAttempts.length ? 100 : 0

  return (
    <div className="workspace-page relative min-h-screen overflow-x-clip px-4 pb-14 pt-6 sm:px-6 lg:px-8 lg:pb-20">
      <div className="relative mx-auto max-w-[112rem]">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/55 px-4 py-2 text-xs font-extrabold text-slate-600 shadow-sm backdrop-blur-xl hover:bg-white/80 hover:text-red-600"
        >
          <ArrowLeft className="h-4 w-4" /> Dashboard
        </button>

        <motion.header
          initial={minimalMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="pb-8 pt-5 text-center sm:pb-10 sm:pt-4"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/40 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-red-600 backdrop-blur-xl">
            <Sparkles className="h-3 w-3" /> Digital SAT command center
          </div>
          <h1 className="mt-3 text-5xl font-extrabold tracking-[-0.06em] text-[#11121c] sm:text-6xl lg:text-[5.2rem]">SAT Arena</h1>
          <p className="mx-auto mt-3 max-w-3xl text-base font-medium tracking-[-0.025em] text-[#262733] sm:text-xl lg:text-[2rem]">
            Math + Reading &amp; Writing — your path to {targetScore}+
          </p>
        </motion.header>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(18rem,.54fr)]">
          <SubjectCard
            title="SAT Math"
            topics={['Algebra', 'Problem Solving', 'Advanced Math']}
            progress={answeredBySection('math')}
            subject="math"
            onStart={() => navigate('/sat/math')}
          />
          <SubjectCard
            title="SAT Reading & Writing"
            topics={['Evidence', 'Grammar', 'Revision']}
            progress={answeredBySection('reading-writing')}
            subject="reading"
            onStart={() => navigate('/sat/reading-writing')}
          />

          <aside className="grid gap-5 sm:grid-cols-2 xl:row-span-2 xl:grid-cols-1">
            <article className={`${glassCard} p-6 sm:p-7`}>
              <h2 className="text-[1.6rem] font-extrabold leading-tight tracking-[-0.04em] text-[#151621]">Continue where<br className="hidden xl:block" /> you left off</h2>
              <div className="mt-5 rounded-[1.55rem] border border-white/90 bg-white/42 p-5 shadow-[0_12px_30px_rgba(55,65,100,.08),inset_0_1px_0_white]">
                <p className="text-sm font-semibold text-slate-600">{activeAttempt ? 'Recent lesson' : 'Recommended next'}</p>
                <h3 className="mt-1 text-base font-extrabold leading-snug text-[#22232e]">
                  {activeAttempt ? activeAttempt.test.title : availableTests[0]?.title ?? 'Digital SAT Practice'}
                </h3>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-300/70">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#9f2028] to-[#ef353d]" style={{ width: `${Math.max(10, recentProgress)}%` }} />
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/mock/sat/${activeAttempt?.test.mockId ?? availableTests[0]?.mockId ?? 1}`)}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold text-red-700 hover:text-red-500"
                >
                  {activeAttempt ? 'Continue test' : 'Start practice'} <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>

            <article className={`${glassCard} p-6 sm:p-7`}>
              <h2 className="text-[1.65rem] font-extrabold tracking-[-0.045em] text-[#151621]">Score-trend chart</h2>
              <ScoreChart scores={scoreHistory} />
              {scoreHistory.length ? (
                <div className="mt-1 flex items-center justify-between text-[11px] font-bold text-slate-500">
                  <span>{scoreHistory.length} completed {scoreHistory.length === 1 ? 'test' : 'tests'}</span><span>Latest: {scoreHistory[scoreHistory.length - 1]}</span>
                </div>
              ) : null}
            </article>
          </aside>

          <article className={`${glassCard} flex min-h-[15rem] items-center justify-between gap-4 p-6 sm:p-7`}>
            <div>
              <p className="text-xl font-extrabold tracking-[-0.035em] text-[#191a25]">Target score</p>
              <p className="mt-3 text-5xl font-extrabold tracking-[-0.065em] text-[#11121d] sm:text-6xl">{targetScore}+</p>
              <p className="mt-3 text-xs font-bold text-slate-500">Best score: {bestScore}</p>
            </div>
            <ProgressRing value={targetProgress} size={134} />
          </article>

          <div className="grid min-h-[15rem] grid-cols-3 gap-4">
            {[
              { label: 'Practice tests', value: `${completedAttempts.length}/${30}`, icon: Check },
              { label: 'Best score', value: bestScore, icon: Flag },
              { label: 'Study hours', value: studyHours, icon: Clock3 },
            ].map(({ label, value, icon: Icon }) => (
              <article key={label} className={`${glassCard} flex flex-col justify-center p-4 sm:p-5`}>
                <Icon className="mb-5 h-5 w-5 text-red-500" />
                <p className="text-xs font-semibold leading-5 text-[#343540] sm:text-sm">{label}:</p>
                <p className="mt-2 text-2xl font-extrabold tracking-[-0.05em] text-[#151621] sm:text-3xl lg:text-[2.15rem]">{value}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_auto]">
          <article className={`${glassCard} p-6 sm:p-7`}>
            <button type="button" onClick={() => setShowMockCatalog((current) => !current)} className="flex w-full flex-col gap-5 text-left sm:flex-row sm:items-center sm:justify-between" aria-expanded={showMockCatalog} aria-controls="sat-mock-catalog">
              <span className="block">
                <span className="flex items-center gap-2 text-red-600"><LibraryBig className="h-4 w-4" /><span className="text-[10px] font-extrabold uppercase tracking-[0.16em]">Available practice tests</span></span>
                <span className="mt-2 block text-2xl font-extrabold tracking-[-0.045em] text-[#151621]">Full Digital SAT mocks</span>
                <span className="mt-1 block text-xs font-medium text-slate-500">Click to browse all 30 Reading &amp; Writing + Math simulations.</span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-[#171823] px-5 py-3 text-xs font-extrabold text-white shadow-lg sm:self-auto">
                View 30 tests <ChevronDown className={`h-4 w-4 transition-transform ${showMockCatalog ? 'rotate-180' : ''}`} />
              </span>
            </button>
          </article>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[24rem]">
            <button type="button" onClick={() => navigate('/sat/mistakes')} className={`${glassCard} group p-5 text-left hover:-translate-y-1`}>
              <FileSearch className="h-6 w-6 text-red-500" />
              <span className="mt-4 block text-sm font-extrabold text-[#171823]">Mistake lab</span>
              <span className="mt-1 block text-[11px] font-medium text-slate-500">Review weak domains</span>
            </button>
            <button type="button" onClick={() => navigate('/vocabulary/sat')} className={`${glassCard} group p-5 text-left hover:-translate-y-1`}>
              <BookOpenText className="h-6 w-6 text-red-500" />
              <span className="mt-4 block text-sm font-extrabold text-[#171823]">Vocabulary</span>
              <span className="mt-1 block text-[11px] font-medium text-slate-500">600 SAT words</span>
            </button>
          </div>

          <AnimatePresence initial={false}>
            {showMockCatalog ? (
              <motion.article
                id="sat-mock-catalog"
                initial={minimalMotion ? false : { opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={minimalMotion ? undefined : { opacity: 0, height: 0, y: -8 }}
                className={`${glassCard} lg:col-span-2`}
              >
                <div className="p-6 sm:p-7">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-red-600">Practice library</p>
                      <h2 className="mt-1 text-2xl font-extrabold tracking-[-0.045em] text-[#151621]">30 full Digital SAT tests</h2>
                    </div>
                    <p className="text-xs font-bold text-slate-500">3 available · 27 coming soon</p>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-6">
                    {mockSlots.map(({ displayNumber, test }) => (
                      <button
                        key={displayNumber}
                        type="button"
                        disabled={!test}
                        onClick={() => test && navigate(`/mock/sat/${test.mockId}`)}
                        className={`group min-h-[8.5rem] rounded-[1.35rem] border p-4 text-left ${test
                          ? 'border-red-200/80 bg-gradient-to-br from-white to-red-50/70 shadow-[0_12px_28px_rgba(185,28,28,.1)] hover:-translate-y-1 hover:border-red-300'
                          : 'cursor-not-allowed border-white/70 bg-white/28 opacity-70'
                        }`}
                      >
                        <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-extrabold ${test ? 'bg-red-600 text-white shadow-md' : 'bg-slate-200/80 text-slate-500'}`}>
                          {String(displayNumber).padStart(2, '0')}
                        </span>
                        <span className="mt-4 block text-sm font-extrabold text-[#171823]">Test {displayNumber}</span>
                        <span className={`mt-1 inline-flex items-center gap-1 text-[9px] font-extrabold uppercase tracking-wider ${test ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {test ? <><Check className="h-3 w-3" /> Available</> : <><Lock className="h-3 w-3" /> Coming soon</>}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.article>
            ) : null}
          </AnimatePresence>
        </section>
      </div>
    </div>
  )
}
