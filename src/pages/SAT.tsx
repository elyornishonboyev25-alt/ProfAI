import UiText from '@/components/common/UiText'
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BookOpenText,
  Check,
  Clock3,
  FileSearch,
  Flag,
  LibraryBig,
  Sparkles,
} from 'lucide-react'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { loadActivityLog, loadOnboardingProfile } from '@/utils/weeklyPlanner'
import { getSATReviewTests, getSATSectionTest, isSATTestComplete, SAT_TEST_CATALOG, type SATTestDefinition } from '@/features/sat/catalog'
import { loadSATAttempt, loadSATAttemptHistory } from '@/features/sat/attemptStorage'
import { scoreSATModules, type SATAttempt } from '@/features/sat/practiceTest4'
import { ARENA_GLASS_SURFACE, ArenaBackdrop } from '@/components/visuals/ArenaVisuals'

type AttemptWithTest = {
  attempt: SATAttempt
  test: SATTestDefinition
}

const glassCard = ARENA_GLASS_SURFACE

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

function ScoreChart({ scores }: { scores: number[] }) {
  const values = scores.slice(-5)

  if (!values.length) {
    return (
      <div className="mt-4 flex h-[13.5rem] flex-col items-center justify-center rounded-[1.4rem] border border-dashed border-slate-300/80 bg-white/25 px-5 text-center">
        <Flag className="h-7 w-7 text-slate-400" />
        <p className="mt-3 text-sm font-extrabold text-slate-700"> <UiText text={"No completed test yet"} /> </p>
        <p className="mt-1 max-w-[15rem] text-[11px] font-medium leading-5 text-slate-500"> <UiText text={"Your verified SAT scores will appear here after you submit a full mock."} /> </p>
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
  const firstCompletedFullAttempts = useMemo(() => {
    const fullTestsById = new Map(getSATReviewTests()
      .filter((test) => test.modules.length === 4)
      .map((test) => [test.id, test]))
    const firstCompletedAttemptByTest = new Map<string, AttemptWithTest>()

    loadSATAttemptHistory()
      .filter(({ attempt }) => attempt.status === 'submitted' && fullTestsById.has(attempt.testId))
      .sort((a, b) => a.savedAt - b.savedAt)
      .forEach(({ attempt }) => {
        if (!firstCompletedAttemptByTest.has(attempt.testId)) {
          firstCompletedAttemptByTest.set(attempt.testId, {
            attempt,
            test: fullTestsById.get(attempt.testId)!,
          })
        }
      })

    return [...firstCompletedAttemptByTest.values()]
      .sort((a, b) => (a.attempt.submittedAt ?? a.attempt.updatedAt) - (b.attempt.submittedAt ?? b.attempt.updatedAt))
  }, [])
  const completedTestIds = new Set(firstCompletedFullAttempts.map(({ test }) => test.id))
  const scoreHistory = firstCompletedFullAttempts.filter(({ test }) => isSATTestComplete(test)).map(({ attempt, test }) => (
    scoreSATModules(test.modules, attempt.answers).midpoint
  ))
  const bestScore = scoreHistory.length ? Math.max(...scoreHistory) : (profile?.currentSatScore ?? 0)
  const targetScore = profile?.targetSatScore ?? 1400
  const targetProgress = Math.min(100, Math.max(0, Math.round((bestScore / targetScore) * 100)))
  const availableTests = Object.values(SAT_TEST_CATALOG).sort((a, b) => a.mockId - b.mockId)
  const mockCount = availableTests.length

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
    : completedTestIds.size ? 100 : 0

  return (
    <div className="workspace-page relative min-h-screen overflow-x-clip px-4 pb-14 pt-6 sm:px-6 lg:px-8 lg:pb-20">
      <ArenaBackdrop />
      <div className="relative z-10 mx-auto max-w-[112rem]">
        <motion.header
          initial={minimalMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="pb-8 pt-5 text-center sm:pb-10 sm:pt-4"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/82 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-red-600">
            <Sparkles className="h-3 w-3" /> Digital SAT command center
          </div>
          <h1 className="mt-3 text-5xl font-extrabold tracking-[-0.06em] text-[#11121c] sm:text-6xl lg:text-[5.2rem]"> <UiText text={"SAT Arena"} /> </h1>
          <p className="mx-auto mt-3 max-w-3xl text-base font-medium tracking-[-0.025em] text-[#262733] sm:text-xl lg:text-[2rem]">
            Math + Reading &amp; Writing — your path to {targetScore}+
          </p>
        </motion.header>

        <button type="button" onClick={() => navigate('/sat/mocks')} className={`${glassCard} group mb-5 flex w-full flex-col gap-5 p-6 text-left transition hover:-translate-y-0.5 sm:flex-row sm:items-center sm:justify-between sm:p-8`}>
          <span className="block">
            <span className="flex items-center gap-2 text-red-600"><LibraryBig className="h-5 w-5" /><span className="text-[11px] font-extrabold uppercase tracking-[0.16em]">Digital SAT</span></span>
            <span className="mt-2 block text-3xl font-extrabold tracking-[-0.045em] text-[#151621] sm:text-4xl">Full Mock exams</span>
            <span className="mt-2 block text-sm font-medium text-slate-600">Browse all {mockCount} Reading &amp; Writing + Math simulations.</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-[#d5222c] px-6 py-3 text-sm font-extrabold text-white shadow-lg transition group-hover:bg-[#af1e27] sm:self-auto">
            View {mockCount} tests <ArrowRight className="h-4 w-4" />
          </span>
        </button>

        <button type="button" onClick={() => navigate('/sat/question-bank')} className="mb-5 flex w-full items-center justify-between gap-5 rounded-[1.7rem] border border-white/90 bg-white/75 p-5 text-left shadow-[0_16px_45px_rgba(30,42,70,.09)] backdrop-blur-xl transition hover:-translate-y-0.5 sm:p-6"><span className="flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-600"><FileSearch className="h-6 w-6" /></span><span><strong className="block text-lg font-extrabold tracking-tight text-slate-950">SAT Question Bank</strong><small className="mt-1 block text-xs font-semibold text-slate-500">Practice by Math or Reading & Writing, topic, skill and difficulty.</small></span></span><ArrowRight className="h-5 w-5 shrink-0 text-red-600" /></button>
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,.75fr)]">
          <aside className="grid gap-5 sm:grid-cols-2 xl:row-span-2 xl:grid-cols-1">
            <article className={`${glassCard} p-6 sm:p-7`}>
              <h2 className="text-[1.6rem] font-extrabold leading-tight tracking-[-0.04em] text-[#151621]"> <UiText text={"Continue where"} /> <br className="hidden xl:block" />  <UiText text={"you left off"} /> </h2>
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
              <h2 className="text-[1.65rem] font-extrabold tracking-[-0.045em] text-[#151621]"> <UiText text={"Score-trend chart"} /> </h2>
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
              <p className="text-xl font-extrabold tracking-[-0.035em] text-[#191a25]"> <UiText text={"Target score"} /> </p>
              <p className="mt-3 text-5xl font-extrabold tracking-[-0.065em] text-[#11121d] sm:text-6xl">{targetScore}+</p>
              <p className="mt-3 text-xs font-bold text-slate-500"> <UiText text={"Best score:"} /> {bestScore || '—'}</p>
            </div>
            <ProgressRing value={targetProgress} size={134} />
          </article>

          <div className="grid min-h-[15rem] grid-cols-3 gap-4">
            {[
              { label: 'Practice tests', value: `${completedTestIds.size}/${mockCount}`, icon: Check },
              { label: 'Best score', value: bestScore || '—', icon: Flag },
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

        <section className="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={() => navigate('/sat/mistakes')} className={`${glassCard} group p-5 text-left hover:-translate-y-1`}>
            <FileSearch className="h-6 w-6 text-red-500" />
            <span className="mt-4 block text-sm font-extrabold text-[#171823]"> <UiText text={"Mistake lab"} /> </span>
            <span className="mt-1 block text-[11px] font-medium text-slate-500"> <UiText text={"Review weak domains"} /> </span>
          </button>
          <button type="button" onClick={() => navigate('/vocabulary/sat', { state: { from: '/sat' } })} className={`${glassCard} group p-5 text-left hover:-translate-y-1`}>
            <BookOpenText className="h-6 w-6 text-red-500" />
            <span className="mt-4 block text-sm font-extrabold text-[#171823]"> <UiText text={"Vocabulary"} /> </span>
            <span className="mt-1 block text-[11px] font-medium text-slate-500">{availableTests.length * 40} SAT words</span>
          </button>
        </section>
      </div>
    </div>
  )
}
