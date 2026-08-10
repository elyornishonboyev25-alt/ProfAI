import {
  BookOpen,
  CalendarCheck,
  FileCheck2,
  FileText,
  Headphones,
  Mic2,
  PenLine,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useLocation, useNavigate } from 'react-router-dom'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { loadOnboardingProfile } from '@/utils/weeklyPlanner'
import '@/styles/ieltsArena.css'

const skills = [
  {
    id: 'listening',
    title: 'Listening',
    description: 'Understand spoken English in various contexts.',
    score: 7,
    tests: 15,
    icon: Headphones,
  },
  {
    id: 'reading',
    title: 'Reading',
    description: 'Analyze and comprehend diverse texts.',
    score: 7.5,
    tests: 12,
    icon: BookOpen,
  },
  {
    id: 'writing',
    title: 'Writing',
    description: 'Express ideas clearly in written form.',
    score: 6.5,
    tests: 10,
    icon: PenLine,
  },
  {
    id: 'speaking',
    title: 'Speaking',
    description: 'Communicate effectively in interviews.',
    score: 6.5,
    tests: 8,
    icon: Mic2,
  },
] as const

type SkillId = (typeof skills)[number]['id']

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
}: {
  skill: (typeof skills)[number]
  onOpen: (id: SkillId) => void
}) {
  const Icon = skill.icon

  return (
    <motion.article
      className="ielts-arena-glass ielts-arena-skill-card"
      whileHover={{ y: -5, scale: 1.006 }}
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
  const profile = loadOnboardingProfile(user?.id)
  const { minimalMotion } = useMotionPreferences()
  const navigationState = location.state as { entry?: string; from?: string } | null
  const fromMock = navigationState?.entry === 'mock-ielts'
  const mockFrom = navigationState?.from ?? 'tests'
  const profileBand = profile?.currentIeltsScore
  const overallBand = profileBand && profileBand >= 0 && profileBand <= 9 ? profileBand : 6.8
  const overallDegrees = Math.min(360, Math.max(0, (overallBand / 9) * 360))

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
        <header className="ielts-arena-header" aria-label="IELTS Arena navigation">
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
        </header>

        <main id="ielts-arena-features" className="ielts-arena-dashboard">
          <section className="ielts-arena-skills" aria-label="IELTS skills">
            {skills.map((skill) => <SkillCard key={skill.id} skill={skill} onOpen={openSection} />)}
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
              {skills.map((skill) => (
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
        </main>
      </div>
    </div>
  )
}
