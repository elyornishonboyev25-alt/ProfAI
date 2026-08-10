import {
  BookOpen,
  CalendarDays,
  CalendarCheck,
  Check,
  Clock3,
  FileCheck2,
  FileText,
  Headphones,
  Mic2,
  Pencil,
  PenLine,
  Target,
  X,
} from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { getReadingAnalysisHistory } from '@/utils/readingAnalysisStorage'
import { getWritingAnalysisHistory } from '@/utils/writingAnalysisStorage'
import { selectUserSessions, useSpeakingStore } from '@/store/speakingStore'
import { loadOnboardingProfile, saveOnboardingProfile } from '@/utils/weeklyPlanner'
import '@/styles/ieltsArena.css'

const skills = [
  {
    id: 'listening',
    title: 'Listening',
    description: 'Understand spoken English in various contexts.',
    tests: 15,
    icon: Headphones,
  },
  {
    id: 'reading',
    title: 'Reading',
    description: 'Analyze and comprehend diverse texts.',
    tests: 12,
    icon: BookOpen,
  },
  {
    id: 'writing',
    title: 'Writing',
    description: 'Express ideas clearly in written form.',
    tests: 10,
    icon: PenLine,
  },
  {
    id: 'speaking',
    title: 'Speaking',
    description: 'Communicate effectively in interviews.',
    tests: 8,
    icon: Mic2,
  },
] as const

type SkillId = (typeof skills)[number]['id']
type SkillScore = Record<SkillId, number>

const DAY_MS = 86_400_000

function examDateOverrideKey(userId?: string) {
  return `smarttest:ielts-exam-date:${userId?.trim() || 'guest'}`
}

function loadExamDate(userId?: string) {
  if (typeof window === 'undefined') return ''
  return window.localStorage.getItem(examDateOverrideKey(userId)) ?? loadOnboardingProfile(userId)?.ieltsExamDate ?? ''
}

function saveExamDate(date: string, userId?: string) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(examDateOverrideKey(userId), date)
  const profile = loadOnboardingProfile(userId)
  if (!profile) return
  const examAt = new Date(`${date}T08:00:00`).getTime()
  saveOnboardingProfile({
    ...profile,
    ieltsExamDate: date,
    daysToExam: Math.max(0, Math.ceil((examAt - Date.now()) / DAY_MS)),
  }, userId)
}

function remainingUntil(date: string, now: number) {
  if (!date) return null
  const distance = Math.max(0, new Date(`${date}T08:00:00`).getTime() - now)
  return {
    days: Math.floor(distance / DAY_MS),
    hours: Math.floor((distance / 3_600_000) % 24),
    minutes: Math.floor((distance / 60_000) % 60),
    seconds: Math.floor((distance / 1000) % 60),
    finished: distance === 0,
  }
}

function localToday() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function ArenaBrandMark() {
  return (
    <svg viewBox="0 0 120 96" role="img" aria-label="IELTS Arena graduation cap">
      <path d="M8 34.5 60 9l52 25.5L60 60 8 34.5Z" />
      <path d="M28 49.5v22c0 9 14.3 16.5 32 16.5s32-7.5 32-16.5v-22L60 65 28 49.5Z" />
      <path className="ielts-arena-tassel" d="M105 39v29" />
      <circle className="ielts-arena-tassel" cx="105" cy="74" r="4.5" />
    </svg>
  )
}

function formatBand(score: number) {
  return score.toFixed(1)
}

function validBand(score: unknown): number {
  return typeof score === 'number' && Number.isFinite(score) && score > 0 && score <= 9 ? score : 0
}

function isListeningAttempt(testId: string, testTitle: string) {
  return `${testId} ${testTitle}`.toLowerCase().includes('listening')
}

function calculateOverallBand(scores: SkillScore) {
  const completedBands = Object.values(scores).filter((score) => score > 0)
  if (completedBands.length === 0) return 0
  const average = completedBands.reduce((sum, score) => sum + score, 0) / completedBands.length
  return Math.round(average * 2) / 2
}

function MiniBand({ score }: { score: number }) {
  const degrees = Math.min(360, Math.max(0, (score / 9) * 360))

  return (
    <div
      className="ielts-arena-mini-band"
      style={{ '--band-degrees': `${degrees}deg` } as React.CSSProperties}
      aria-label={`Band ${formatBand(score)}`}
    >
      <div>
        <span>Band</span>
        <strong>{formatBand(score)}</strong>
      </div>
    </div>
  )
}

function SkillCard({
  skill,
  onOpen,
  animateHover,
}: {
  skill: (typeof skills)[number] & { score: number }
  onOpen: (id: SkillId) => void
  animateHover: boolean
}) {
  const Icon = skill.icon

  return (
    <motion.article
      className="ielts-arena-glass ielts-arena-skill-card"
      whileHover={animateHover ? { y: -6, scale: 1.008 } : undefined}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
    >
      <div className="ielts-arena-card-heading">
        <span className="ielts-arena-icon ielts-arena-skill-icon"><Icon /></span>
        <h2>{skill.title}</h2>
      </div>
      <p className="ielts-arena-skill-description">{skill.description}</p>
      <div className="ielts-arena-card-footer">
        <MiniBand score={skill.score} />
        <div className="ielts-arena-card-action">
          <p>{skill.tests} Tests Available</p>
          <button type="button" onClick={() => onOpen(skill.id)} aria-label={`Practice ${skill.title}`}>
            Practice
          </button>
        </div>
      </div>
    </motion.article>
  )
}

export default function IELTS() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state: AuthState) => state.user)
  const speakingSessions = useSpeakingStore((state) => state.sessions)
  const { minimalMotion, allowHoverMotion } = useMotionPreferences()
  const [examDate, setExamDate] = useState(() => loadExamDate(user?.id))
  const [draftExamDate, setDraftExamDate] = useState(() => loadExamDate(user?.id))
  const [editingExamDate, setEditingExamDate] = useState(false)
  const [now, setNow] = useState(Date.now())
  const navigationState = location.state as { entry?: string; from?: string } | null
  const fromMock = navigationState?.entry === 'mock-ielts'
  const mockFrom = navigationState?.from ?? 'tests'
  const skillScores = useMemo<SkillScore>(() => {
    const objectiveHistory = getReadingAnalysisHistory(user?.id)
    const latestListening = objectiveHistory.find((entry) => isListeningAttempt(entry.testId, entry.testTitle))
    const latestReading = objectiveHistory.find((entry) => !isListeningAttempt(entry.testId, entry.testTitle))
    const latestWriting = getWritingAnalysisHistory(user?.id)[0]
    const userSpeakingSessions = selectUserSessions(speakingSessions, user?.id ?? null)
    const latestSpeaking = userSpeakingSessions[userSpeakingSessions.length - 1]

    return {
      listening: validBand(latestListening?.bandScore),
      reading: validBand(latestReading?.bandScore),
      writing: validBand(latestWriting?.overallBand),
      speaking: validBand(latestSpeaking?.overallBand),
    }
  }, [speakingSessions, user?.id])
  const scoredSkills = skills.map((skill) => ({ ...skill, score: skillScores[skill.id] }))
  const overallBand = calculateOverallBand(skillScores)
  const completedSkillCount = Object.values(skillScores).filter((score) => score > 0).length
  const overallDegrees = Math.min(360, Math.max(0, (overallBand / 9) * 360))
  const remaining = useMemo(() => remainingUntil(examDate, now), [examDate, now])
  const examDateObject = examDate ? new Date(`${examDate}T08:00:00`) : null
  const formattedExamDate = examDateObject
    ? examDateObject.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : 'No exam date selected'

  useEffect(() => {
    const storedDate = loadExamDate(user?.id)
    setExamDate(storedDate)
    setDraftExamDate(storedDate)
  }, [user?.id])

  useEffect(() => {
    if (!examDate) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [examDate])

  const confirmExamDate = () => {
    if (!draftExamDate) return
    saveExamDate(draftExamDate, user?.id)
    setExamDate(draftExamDate)
    setNow(Date.now())
    setEditingExamDate(false)
  }

  const openSection = (id: SkillId) => {
    const target = id === 'writing' ? '/ielts/writing/tests' : id === 'speaking' ? '/ielts/speaking/tests' : `/ielts/${id}`
    navigate(target, {
      state: fromMock ? { entry: 'mock-ielts', from: mockFrom } : { entry: 'ielts-hub' },
    })
  }

  const scrollToFeatures = () => {
    document.getElementById('ielts-arena-features')?.scrollIntoView({ behavior: minimalMotion ? 'auto' : 'smooth' })
  }

  return (
    <div className="ielts-arena-page">
      <div className="ielts-arena-ambient" aria-hidden="true">
        <span className="ielts-arena-ambient-blue" />
        <span className="ielts-arena-ambient-peach" />
        <span className="ielts-arena-ambient-bottom" />
      </div>

      <div className="ielts-arena-shell">
        <motion.header
          className="ielts-arena-header"
          aria-label="IELTS Arena navigation"
          initial={minimalMotion ? false : { opacity: 0, y: -18, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        >
          <button
            type="button"
            className="ielts-arena-brand"
            onClick={() => navigate(fromMock ? '/mock/ielts' : '/dashboard', fromMock ? { state: { from: mockFrom } } : undefined)}
            aria-label={fromMock ? 'Back to Mock IELTS' : 'Back to dashboard'}
          >
            <span className="ielts-arena-brand-mark"><ArenaBrandMark /></span>
            <span className="ielts-arena-brand-copy">
              <strong>IELTS <em>Arena</em></strong>
              <small>Master all four skills</small>
            </span>
          </button>

          <nav className="ielts-arena-nav" aria-label="Main links">
            <button type="button" className="is-active" onClick={scrollToFeatures}>Features</button>
            <button type="button" onClick={() => navigate('/premium')}>Pricing</button>
            <button type="button" onClick={() => navigate('/about')}>About</button>
            <a href="mailto:support@profai.uz">Contact</a>
          </nav>

          <button
            type="button"
            className="ielts-arena-login"
            onClick={() => navigate(user ? '/dashboard' : '/login')}
          >
            {user ? 'Dashboard' : 'Login'}
          </button>
        </motion.header>

        <motion.section
          className="ielts-arena-countdown"
          initial={minimalMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          aria-label="IELTS exam countdown"
        >
          <span className="ielts-arena-countdown-glow" aria-hidden="true" />
          <div className="ielts-arena-countdown-date">
            <span className="ielts-arena-countdown-icon"><CalendarDays /></span>
            <div>
              <span className="ielts-arena-kicker">Your booked IELTS exam</span>
              <strong>{formattedExamDate}</strong>
              <small>{examDate ? (remaining?.finished ? 'Exam day has arrived' : 'Countdown ends at 08:00 local time') : 'Add the exact date from your booking confirmation'}</small>
            </div>
            <button
              type="button"
              className="ielts-arena-date-edit"
              onClick={() => {
                setDraftExamDate(examDate)
                setEditingExamDate((value) => !value)
              }}
            >
              <Pencil /> {examDate ? 'Change' : 'Set date'}
            </button>
          </div>

          <div className="ielts-arena-countdown-units" aria-live="polite">
            {([
              ['Days', remaining?.days ?? 0],
              ['Hours', remaining?.hours ?? 0],
              ['Minutes', remaining?.minutes ?? 0],
              ['Seconds', remaining?.seconds ?? 0],
            ] as const).map(([label, value]) => (
              <div className="ielts-arena-countdown-unit" key={label}>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.strong
                    key={value}
                    initial={minimalMotion ? false : { opacity: 0, y: -7, filter: 'blur(3px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={minimalMotion ? undefined : { opacity: 0, y: 6 }}
                    transition={{ duration: 0.22 }}
                  >
                    {remaining ? String(value).padStart(2, '0') : '—'}
                  </motion.strong>
                </AnimatePresence>
                <span>{label}</span>
              </div>
            ))}
          </div>

          <div className="ielts-arena-countdown-progress">
            <span className="ielts-arena-countdown-icon"><Target /></span>
            <div>
              <span className="ielts-arena-kicker">Verified score data</span>
              <strong>{overallBand > 0 ? formatBand(overallBand) : '—'} <small>Overall</small></strong>
              <p>{completedSkillCount} of 4 skills scored</p>
            </div>
          </div>

          <AnimatePresence>
            {editingExamDate ? (
              <motion.div
                className="ielts-arena-date-editor"
                initial={minimalMotion ? false : { opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={minimalMotion ? undefined : { opacity: 0, height: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <Clock3 />
                <label htmlFor="ielts-exam-date">Exact exam date</label>
                <input
                  id="ielts-exam-date"
                  type="date"
                  min={localToday()}
                  value={draftExamDate}
                  onChange={(event) => setDraftExamDate(event.target.value)}
                />
                <button type="button" className="ielts-arena-date-save" onClick={confirmExamDate} disabled={!draftExamDate}>
                  <Check /> Save date
                </button>
                <button type="button" className="ielts-arena-date-cancel" onClick={() => setEditingExamDate(false)} aria-label="Cancel date editing">
                  <X />
                </button>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.section>

        <motion.main
          id="ielts-arena-features"
          className="ielts-arena-dashboard"
          initial={minimalMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.72, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
        >
          <section className="ielts-arena-skills" aria-label="IELTS skills">
            {scoredSkills.map((skill) => <SkillCard key={skill.id} skill={skill} onOpen={openSection} animateHover={allowHoverMotion} />)}
          </section>

          <section className="ielts-arena-glass ielts-arena-overview" aria-labelledby="ielts-overview-title">
            <h1 id="ielts-overview-title">Your IELTS<br />overview</h1>
            <div
              className="ielts-arena-overall-band"
              style={{ '--overall-degrees': `${overallDegrees}deg` } as React.CSSProperties}
              aria-label={`${formatBand(overallBand)} overall band`}
            >
              <div>
                <strong>{formatBand(overallBand)}</strong>
                <span>Overall Band</span>
              </div>
            </div>

            <div className="ielts-arena-bars" aria-label="Skill band comparison">
              {scoredSkills.map((skill) => (
                <div className="ielts-arena-bar-item" key={skill.id}>
                  <span>{formatBand(skill.score)}</span>
                  <div className="ielts-arena-bar-track">
                    <i style={{ height: `${(skill.score / 9) * 100}%` }} />
                  </div>
                  <small>{skill.title}</small>
                </div>
              ))}
            </div>
          </section>

          <aside className="ielts-arena-recommendations" aria-label="Recommended IELTS activities">
            <motion.button
              type="button"
              className="ielts-arena-glass ielts-arena-recommendation ielts-arena-reading-next"
              onClick={() => openSection('reading')}
              whileHover={{ y: -4 }}
            >
              <h2>Recommended next</h2>
              <div className="ielts-arena-recommendation-title">
                <span className="ielts-arena-icon"><FileText /></span>
                <strong>Task 1 reading</strong>
              </div>
              <p>Complete a focused reading set and review every missed answer.</p>
            </motion.button>

            <motion.button
              type="button"
              className="ielts-arena-glass ielts-arena-recommendation ielts-arena-mock-next"
              onClick={() => navigate('/mock/ielts', { state: { from: 'ielts' } })}
              whileHover={{ y: -4 }}
            >
              <h2>Recommended next</h2>
              <div className="ielts-arena-recommendation-row">
                <span className="ielts-arena-icon"><CalendarCheck /></span>
                <p>Complete a Full Mock task</p>
              </div>
            </motion.button>

            <motion.button
              type="button"
              className="ielts-arena-glass ielts-arena-recommendation ielts-arena-full-mock"
              onClick={() => navigate('/mock/ielts', { state: { from: 'ielts' } })}
              whileHover={{ y: -4 }}
            >
              <span className="ielts-arena-icon"><FileCheck2 /></span>
              <span><strong>Full-Mock</strong><small>Take a Full Mock Test</small></span>
            </motion.button>
          </aside>
        </motion.main>
      </div>
    </div>
  )
}
