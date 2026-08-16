import { useEffect, useMemo, useRef, useState, type ComponentType, type CSSProperties, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronRight,
  Globe2,
  GraduationCap,
  Headphones,
  Languages,
  Loader2,
  Menu,
  Mic2,
  PenSquare,
  Quote,
  Radio,
  Sparkles,
  Star,
  Target,
  Trophy,
  Waves,
  X,
  Zap,
} from 'lucide-react'
import { BrandMark } from '@/components/brand/BrandLogo'
import { CountUp } from '@/components/fx'
import LiquidGlassHero, { LiquidGlassHeroMobile } from '@/components/landing/LiquidGlassHero'
import { loadReviews, submitReview, type LandingReview, type ReviewExam } from '@/lib/reviewsApi'

/* ──────────────────────────────────────────────────────────────────────────
   ProfAI — public marketing landing (guests only). An original, feature-rich
   premium landing: a layered live-product hero, animated stat band, a bento
   grid that shows off every study tool, an interactive track switcher, the
   route, a community review wall anyone can post to, and a closing CTA.
   Built with framer-motion; honours reduced-motion throughout.
   ────────────────────────────────────────────────────────────────────────── */

const EASE = [0.22, 1, 0.36, 1] as const

const NAV_LINKS = [
  { label: 'Features', target: 'features' },
  { label: 'Pricing', target: 'tracks' },
  { label: 'About', target: 'route' },
  { label: 'Contact', target: 'reviews' },
] as const

const HERO_PILLS = [
  { icon: 'file', label: '30 Full Mocks', target: 'features' },
  { icon: 'pen', label: 'AI Writing Evaluation', target: 'features' },
  { icon: 'globe', label: 'Live Speaking Partners', target: 'features' },
] as const

// Ambient floating red spheres scattered behind/in front of the glass at varied depth.
const STATS = [
  { value: 30, suffix: '+', label: 'Full timed mocks' },
  { value: 10000, suffix: '+', label: 'Practice items' },
  { value: 12, suffix: '', label: 'Study tools in one app' },
  { value: 4, suffix: '', label: 'Skills, one roadmap' },
] as const

type ExamOption = ReviewExam
const EXAM_OPTIONS: ExamOption[] = ['IELTS', 'SAT', 'General']

const EXAM_OPTIONS_NAV = EXAM_OPTIONS

/* ── helpers ───────────────────────────────────────────────────────────── */

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE, delay: i * 0.07 } }),
}

function SectionTag({ children }: { children: ReactNode }) {
  return <span className="text-[11px] font-black uppercase tracking-[0.28em] text-blue-600">{children}</span>
}

/* ── Bento feature data ────────────────────────────────────────────────── */

type Feature = {
  title: string
  body: string
  icon: ComponentType<{ className?: string }>
  route: string
  span: string
  visual?: ReactNode
  tone?: 'red' | 'dark'
}

function RubricVisual() {
  const rows = [
    ['Task Response', 78],
    ['Coherence', 64],
    ['Lexical', 85],
    ['Grammar', 70],
  ] as const
  return (
    <div className="mt-4 space-y-2.5">
      {rows.map(([label, w], i) => (
        <div key={label}>
          <div className="flex justify-between text-[11px] font-bold text-slate-500">
            <span>{label}</span>
            <span className="text-slate-400">{(w / 100 * 9).toFixed(1)}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${w}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, delay: i * 0.1, ease: EASE }}
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-400"
            />
          </div>
        </div>
      ))}
    </div>
  )
}

const WAVE_BARS = [0.5, 0.8, 0.4, 1, 0.6, 0.9, 0.45, 0.75, 0.55, 1, 0.5, 0.85, 0.6, 0.95, 0.4, 0.7, 0.5, 0.9]

function WaveVisual() {
  return (
    <div className="mt-5 flex h-12 items-center gap-1">
      {WAVE_BARS.map((peak, i) => (
        <span
          key={i}
          className="landing-wave-bar h-full w-1 flex-1 rounded-full bg-gradient-to-t from-blue-500/70 to-indigo-400/70"
          style={{
            transformOrigin: 'center',
            animationDuration: `${1.2 + (i % 5) * 0.18}s`,
            animationDelay: `${i * 0.05}s`,
            '--landing-wave-peak': peak,
          } as CSSProperties}
        />
      ))}
    </div>
  )
}

const FEATURES: Feature[] = [
  {
    title: 'AI Study Coach',
    body: 'A personal roadmap that reads every mock, finds your weakest sub-skill and hands you the exact next task — never random practice.',
    icon: Bot,
    route: '/register',
    span: 'lg:col-span-2 lg:row-span-2',
    tone: 'dark',
  },
  {
    title: 'Writing AI',
    body: 'Task 1 & 2 scored on the real band rubric in minutes — with line-level fixes.',
    icon: PenSquare,
    route: '/ielts/writing',
    span: 'lg:col-span-1',
    visual: <RubricVisual />,
  },
  {
    title: 'Speaking Community',
    body: 'Voice-only partner practice over live WebRTC, plus an AI examiner that scores fluency.',
    icon: Mic2,
    route: '/community?mode=ai',
    span: 'lg:col-span-1',
  },
  {
    title: 'Shadowing Lab',
    body: 'Paste any English YouTube link — we split it into lines you can loop, slow down and record.',
    icon: Waves,
    route: '/shadowing-lab',
    span: 'lg:col-span-1',
    visual: <WaveVisual />,
  },
  {
    title: 'Vocabulary Arena',
    body: 'Missed words return on a spaced schedule until they stop slowing your reading.',
    icon: Sparkles,
    route: '/vocabulary',
    span: 'lg:col-span-1',
  },
  {
    title: 'Reading Library & Podcasts',
    body: 'A curated reader with Ask-AI vocab help and subtitled English podcasts with A-B loop.',
    icon: Headphones,
    route: '/articles',
    span: 'lg:col-span-1',
  },
  {
    title: 'Admission Hub',
    body: '30+ study-abroad lessons and a QS university explorer to plan your application end to end.',
    icon: Globe2,
    route: '/admission',
    span: 'lg:col-span-2',
  },
]

/* ── Tracks data (interactive switcher) ────────────────────────────────── */

const TRACKS = [
  {
    id: 'IELTS',
    label: 'IELTS',
    icon: GraduationCap,
    blurb: 'Academic & General Training — every skill, full mocks and band-rubric feedback.',
    route: '/ielts',
    items: [
      { icon: BookOpen, name: 'Reading', note: 'Passage strategy & inference control' },
      { icon: Headphones, name: 'Listening', note: 'Audio flow & distractor filtering' },
      { icon: PenSquare, name: 'Writing', note: 'Task 1 + 2 with AI rubric scoring' },
      { icon: Mic2, name: 'Speaking', note: 'Part-by-part with fluency insights' },
    ],
  },
  {
    id: 'SAT',
    label: 'SAT',
    icon: Target,
    blurb: 'Digital-SAT style Math and Reading/Writing with timing blocks and a built-in calculator.',
    route: '/sat',
    items: [
      { icon: BarChart3, name: 'Math', note: 'Algebra, problem solving & speed blocks' },
      { icon: BookOpen, name: 'Reading/Writing', note: 'Evidence pairing & revision logic' },
      { icon: Zap, name: 'Calculator', note: 'Built-in graphing tool' },
      { icon: Trophy, name: 'Full mock', note: 'Adaptive, exam-mode simulation' },
    ],
  },
  {
    id: 'English',
    label: 'English Skills',
    icon: Languages,
    blurb: 'Build real fluency between mocks — shadowing, podcasts, reading and spaced vocab.',
    route: '/articles',
    items: [
      { icon: Waves, name: 'Shadowing Lab', note: 'YouTube → line-by-line practice' },
      { icon: Radio, name: 'Podcasts', note: 'Captions, speed control, A-B loop' },
      { icon: BookOpen, name: 'Reading Library', note: 'Pro reader + Ask-AI vocab' },
      { icon: Sparkles, name: 'Vocabulary', note: 'Spaced repetition that sticks' },
    ],
  },
  {
    id: 'Admission',
    label: 'Study Abroad',
    icon: Globe2,
    blurb: 'Turn your scores into offers — lessons, university research and an application roadmap.',
    route: '/admission',
    items: [
      { icon: GraduationCap, name: 'Lessons', note: '30+ study-abroad guides' },
      { icon: Globe2, name: 'Universities', note: 'QS rankings explorer' },
      { icon: Target, name: 'Roadmap', note: 'Step-by-step admission plan' },
      { icon: Trophy, name: 'Scholarships', note: 'Funding & application tips' },
    ],
  },
] as const

const STEPS = [
  { n: '01', title: 'Take a full mock', body: 'Set a clean baseline across all four skills under real exam timing.', icon: Target },
  { n: '02', title: 'Open your skill map', body: 'See exactly which sub-skill is costing you the most band points.', icon: BarChart3 },
  { n: '03', title: 'Train the gaps', body: 'The AI coach assigns the precise tasks and words you keep missing.', icon: Bot },
  { n: '04', title: 'Watch the band move', body: 'Mocks, practice and rubric scores stay in one timeline you can trust.', icon: Trophy },
] as const

/* ── Star input ────────────────────────────────────────────────────────── */

function StarInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const active = (hover || value) >= n
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star className={`h-6 w-6 ${active ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-slate-300'}`} />
          </button>
        )
      })}
    </div>
  )
}

/* ── Review card ───────────────────────────────────────────────────────── */

function ReviewCard({ review }: { review: LandingReview }) {
  const hasBand = review.bandBefore && review.bandAfter
  return (
    <motion.article
      variants={fadeUp}
      className="flex h-full flex-col rounded-2xl border border-black/5 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.06)]"
    >
      <div className="flex items-center justify-between">
        {hasBand ? (
          <div className="flex items-center gap-1.5 text-sm font-black">
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-500">{review.bandBefore}</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
            <span className="rounded-md bg-blue-500 px-2 py-0.5 text-white">{review.bandAfter}</span>
          </div>
        ) : (
          <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-black text-blue-600">{review.exam}</span>
        )}
        <Quote className="h-5 w-5 text-blue-200" />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-black text-white">
          {initials(review.name) || 'A'}
        </span>
        <div>
          <p className="text-sm font-black text-slate-900">{review.name}</p>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3 w-3 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-slate-200'}`}
              />
            ))}
            {review.source === 'local' && (
              <span className="ml-1 text-[9px] font-bold uppercase tracking-wide text-slate-300">You</span>
            )}
          </div>
        </div>
      </div>

      <p className="mt-3 flex-1 text-[13px] leading-6 text-slate-600">"{review.text}"</p>
    </motion.article>
  )
}

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function Landing() {
  const navigate = useNavigate()
  const heroRef = useRef<HTMLDivElement>(null)

  const [scrolled, setScrolled] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [activeTrack, setActiveTrack] = useState<(typeof TRACKS)[number]['id']>('IELTS')

  // Reviews
  const [reviews, setReviews] = useState<LandingReview[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [justSubmitted, setJustSubmitted] = useState(false)
  const [form, setForm] = useState({
    name: '',
    exam: 'IELTS' as ExamOption,
    rating: 5,
    bandBefore: '',
    bandAfter: '',
    text: '',
  })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    let alive = true
    void loadReviews().then((data) => {
      if (alive) {
        setReviews(data)
        setReviewsLoading(false)
      }
    })
    return () => {
      alive = false
    }
  }, [])

  const formValid = form.name.trim().length >= 2 && form.text.trim().length >= 8

  const handleSubmit = async () => {
    if (!formValid || submitting) return
    setSubmitting(true)
    try {
      const created = await submitReview({
        name: form.name,
        exam: form.exam,
        rating: form.rating,
        bandBefore: form.bandBefore,
        bandAfter: form.bandAfter,
        text: form.text,
      })
      setReviews((prev) => [created, ...prev])
      setJustSubmitted(true)
      setForm({ name: '', exam: 'IELTS', rating: 5, bandBefore: '', bandAfter: '', text: '' })
      window.setTimeout(() => {
        setJustSubmitted(false)
        setFormOpen(false)
      }, 2200)
    } finally {
      setSubmitting(false)
    }
  }

  const ratingAvg = useMemo(() => {
    if (!reviews.length) return 5
    return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  }, [reviews])

  const go = (target: string) => {
    setMobileNav(false)
    scrollToId(target)
  }

  const track = TRACKS.find((t) => t.id === activeTrack)!

  return (
    <div className="relative min-h-screen w-full overflow-x-clip bg-transparent text-slate-900">
      {/* frosted ambient wash — white base, pale red top-right, faint cool blue left */}
      <div className="relative z-10">
      {/* ── Nav (liquid glass pill) ─────────────────────────────────── */}
      <header className="fixed inset-x-0 top-3 z-50 px-3 sm:top-5 sm:px-4">
        <div
          className={`lg-glass lg-glass-sheen mx-auto flex max-w-6xl items-center justify-between overflow-hidden rounded-[28px] px-4 py-3 transition-all duration-300 sm:px-6 sm:py-3.5 ${
            scrolled ? 'shadow-[0_16px_40px_rgba(15,23,42,0.14)]' : ''
          }`}
        >
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="relative flex items-center gap-2.5">
            <BrandMark size={46} className="drop-shadow-[0_6px_12px_rgba(37,99,235,0.28)]" />
            <span className="text-2xl font-black tracking-tight">
              Prof<span className="text-blue-600">AI</span>
            </span>
          </button>

          <nav className="relative hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((l, i) => (
              <button
                key={l.target}
                onClick={() => go(l.target)}
                className={`rounded-full px-4 py-2 text-[15px] font-semibold transition ${
                  i === 0
                    ? 'bg-white/70 text-slate-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_4px_12px_rgba(15,23,42,0.06)]'
                    : 'text-slate-600 hover:bg-white/50 hover:text-slate-900'
                }`}
              >
                {l.label}
              </button>
            ))}
          </nav>

          <div className="relative flex items-center gap-2">
            <button
              onClick={() => navigate('/login')}
              className="lg-glass lg-hover hidden rounded-full px-7 py-2.5 text-[15px] font-bold text-blue-600 sm:block"
              style={{
                border: '1.5px solid rgba(37,99,235,0.45)',
                boxShadow: '0 0 0 4px rgba(37,99,235,0.06), 0 8px 22px rgba(37,99,235,0.18), inset 0 1px 0 rgba(255,255,255,0.9)',
              }}
            >
              Login
            </button>
            <button onClick={() => setMobileNav((v) => !v)} className="ml-1 rounded-lg p-1.5 text-slate-700 md:hidden" aria-label="Menu">
              {mobileNav ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileNav && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mx-auto mt-2 max-w-6xl rounded-2xl border border-black/5 bg-white/95 p-3 shadow-xl backdrop-blur-xl md:hidden"
            >
              {NAV_LINKS.map((l) => (
                <button
                  key={l.target}
                  onClick={() => go(l.target)}
                  className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {l.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section ref={heroRef} className="relative px-4 pb-12 pt-32 sm:pt-40">
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.02fr_1.05fr]">
          {/* copy */}
          <div className="text-center lg:text-left">
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.06, ease: EASE }}
              className="text-[3rem] font-black leading-[0.98] tracking-[-0.02em] text-slate-900 sm:text-[5rem]"
            >
              Your Path to Top
              <br />
              Universities
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.14, ease: EASE }}
              className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-500 lg:mx-0 sm:text-lg"
            >
              AI-powered SAT &amp; IELTS prep platform for studying abroad. Personalized learning, real-time
              feedback, and guaranteed results.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.22, ease: EASE }}
              className="mt-8 flex justify-center lg:justify-start"
            >
              <button
                onClick={() => navigate('/register')}
                className="lg-btn-red group inline-flex items-center gap-2 rounded-full px-11 py-5 text-lg font-bold text-white"
              >
                <span className="relative">Start Free</span>
                <ArrowRight className="relative h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>
          </div>

          {/* mobile: dashboard drops below the text */}
          <div className="lg:hidden">
            <LiquidGlassHeroMobile />
          </div>

          {/* live visual — liquid glass band dashboard (desktop) */}
          <div className="hidden lg:block">
            <LiquidGlassHero />
          </div>
        </div>

        {/* feature pills (glass) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
          className="relative mx-auto mt-10 grid max-w-6xl gap-4 sm:grid-cols-3"
        >
          {HERO_PILLS.map((pill) => {
            const Icon = pill.icon === 'file' ? BookOpen : pill.icon === 'pen' ? PenSquare : Globe2
            return (
              <button
                key={pill.label}
                onClick={() => scrollToId(pill.target)}
                className="lg-glass lg-glass-sheen lg-hover group flex items-center gap-3.5 overflow-hidden rounded-full px-6 py-4 text-left"
              >
                <span
                  className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-blue-600"
                  style={{
                    background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9), rgba(254,226,226,0.85))',
                    boxShadow: '0 4px 12px rgba(37,99,235,0.16), inset 0 1px 0 rgba(255,255,255,0.95)',
                    border: '1px solid rgba(191,219,254,0.9)',
                  }}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <span className="relative text-lg font-bold tracking-tight text-slate-800">{pill.label}</span>
              </button>
            )
          })}
        </motion.div>
      </section>

      {/* ── Stat band ───────────────────────────────────────────────── */}
      <section className="landing-deferred-section px-4 py-10">
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 rounded-3xl border border-black/5 bg-white/70 p-6 shadow-[0_18px_44px_rgba(15,23,42,0.05)] sm:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
              className="text-center"
            >
              <p className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                <CountUp value={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-1 text-[12px] font-semibold text-slate-500">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Bento features ──────────────────────────────────────────── */}
      <section id="features" className="landing-deferred-section scroll-mt-24 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mx-auto max-w-2xl text-center"
          >
            <SectionTag>Everything in one place</SectionTag>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-5xl">
              Not a question bank. A whole prep team.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-500">
              Twelve study tools that talk to each other — so every mock, drill and word pushes the same band upward.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-8% 0px' }}
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            className="mt-12 grid auto-rows-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {FEATURES.map((f) => {
              const Icon = f.icon
              const dark = f.tone === 'dark'
              return (
                <motion.button
                  key={f.title}
                  variants={fadeUp}
                  onClick={() => navigate(f.route)}
                  className={`group relative flex flex-col overflow-hidden rounded-3xl border p-6 text-left transition ${f.span} ${
                    dark
                      ? 'border-white/10 bg-slate-900 text-white shadow-[0_30px_70px_rgba(15,23,42,0.3)]'
                      : 'border-black/5 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.06)] hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(37,99,235,0.12)]'
                  }`}
                >
                  {dark && (
                    <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-600/40 blur-3xl" />
                  )}
                  <div className="relative flex items-center justify-between">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                        dark ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                      } transition`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <ArrowUpRight
                      className={`h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                        dark ? 'text-white/40' : 'text-slate-300'
                      }`}
                    />
                  </div>
                  <h3 className={`relative mt-4 text-lg font-black tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
                    {f.title}
                  </h3>
                  <p className={`relative mt-1.5 text-sm leading-6 ${dark ? 'text-slate-300' : 'text-slate-500'}`}>{f.body}</p>
                  {f.visual}
                  {dark && (
                    <div className="relative mt-auto flex items-center gap-2 pt-6 text-sm font-bold text-blue-300">
                      Meet your coach <ChevronRight className="h-4 w-4" />
                    </div>
                  )}
                </motion.button>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Tracks (interactive) ────────────────────────────────────── */}
      <section id="tracks" className="landing-deferred-section scroll-mt-24 bg-white/60 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <SectionTag>Choose your goal</SectionTag>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-5xl">Built for the test you're taking.</h2>
          </div>

          {/* tabs */}
          <div className="mt-9 flex flex-wrap justify-center gap-2">
            {TRACKS.map((t) => {
              const Icon = t.icon
              const active = t.id === activeTrack
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTrack(t.id)}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-2.5 text-sm font-bold transition ${
                    active
                      ? 'border-blue-300 bg-blue-600 text-white shadow-[0_10px_24px_rgba(37,99,235,0.28)]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {t.label}
                </button>
              )
            })}
          </div>

          {/* panel — remounts on track change via React key to replay the entrance */}
          <div className="mt-8">
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="grid gap-4 rounded-3xl border border-black/5 bg-white p-6 shadow-[0_18px_44px_rgba(15,23,42,0.06)] sm:p-8 lg:grid-cols-[1fr_1.4fr] lg:items-center"
            >
              <div>
                <p className="text-2xl font-black tracking-tight text-slate-900">{track.label}</p>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{track.blurb}</p>
                <button
                  onClick={() => navigate(track.route)}
                  className="group mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Open {track.label}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {track.items.map((it) => {
                  const Icon = it.icon
                  return (
                    <div
                      key={it.name}
                      className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-blue-100 hover:bg-white"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-black text-slate-900">{it.name}</p>
                        <p className="mt-0.5 text-[12px] leading-5 text-slate-500">{it.note}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────── */}
      <section id="route" className="landing-deferred-section scroll-mt-24 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <SectionTag>Your route</SectionTag>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-5xl">
              From baseline to target — in four moves.
            </h2>
          </div>

          <div className="relative mt-12 grid gap-4 lg:grid-cols-4">
            <div className="pointer-events-none absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent lg:block" />
            {STEPS.map((s, i) => {
              const Icon = s.icon
              return (
                <motion.div
                  key={s.n}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: i * 0.12, ease: EASE }}
                  className="relative rounded-3xl border border-black/5 bg-white p-6 shadow-[0_14px_30px_rgba(15,23,42,0.05)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-[0_10px_22px_rgba(37,99,235,0.32)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-3xl font-black text-slate-100">{s.n}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-black tracking-tight text-slate-900">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-slate-500">{s.body}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Reviews wall ────────────────────────────────────────────── */}
      <section id="reviews" className="landing-deferred-section scroll-mt-24 bg-white/60 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <SectionTag>Student proof</SectionTag>
              <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-5xl">Bands moving up.</h2>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < Math.round(ratingAvg) ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-slate-200'}`}
                    />
                  ))}
                </div>
                <p className="text-sm font-bold text-slate-500">
                  {ratingAvg.toFixed(1)} / 5.0 · {reviews.length}+ reviews
                </p>
              </div>
            </div>
            <button
              onClick={() => setFormOpen((v) => !v)}
              className="group inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              {formOpen ? 'Close' : 'Leave a review'}
              {!formOpen && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
            </button>
          </div>

          {/* Submit form */}
          <AnimatePresence initial={false}>
            {formOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="overflow-hidden"
              >
                <div className="mt-6 rounded-3xl border border-black/5 bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.08)] sm:p-8">
                  {justSubmitted ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                      <CheckCircle2 className="h-12 w-12 text-green-500" />
                      <p className="text-lg font-black text-slate-900">Thank you! Your review is live.</p>
                      <p className="text-sm text-slate-500">It now appears in the wall below.</p>
                    </div>
                  ) : (
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="text-[11px] font-black uppercase tracking-wide text-slate-500">Your name</label>
                        <input
                          value={form.name}
                          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                          placeholder="e.g. Aziza K."
                          maxLength={60}
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-black uppercase tracking-wide text-slate-500">Exam</label>
                        <div className="mt-1.5 flex gap-2">
                          {EXAM_OPTIONS_NAV.map((ex) => (
                            <button
                              key={ex}
                              type="button"
                              onClick={() => setForm((f) => ({ ...f, exam: ex }))}
                              className={`flex-1 rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
                                form.exam === ex
                                  ? 'border-blue-300 bg-blue-50 text-blue-600'
                                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                              }`}
                            >
                              {ex}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <label className="text-[11px] font-black uppercase tracking-wide text-slate-500">Band before</label>
                          <input
                            value={form.bandBefore}
                            onChange={(e) => setForm((f) => ({ ...f, bandBefore: e.target.value }))}
                            placeholder="5.5"
                            maxLength={12}
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                        <ArrowRight className="mb-3 h-4 w-4 shrink-0 text-slate-300" />
                        <div className="flex-1">
                          <label className="text-[11px] font-black uppercase tracking-wide text-slate-500">Band after</label>
                          <input
                            value={form.bandAfter}
                            onChange={(e) => setForm((f) => ({ ...f, bandAfter: e.target.value }))}
                            placeholder="7.5"
                            maxLength={12}
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-black uppercase tracking-wide text-slate-500">Rating</label>
                        <div className="mt-2">
                          <StarInput value={form.rating} onChange={(n) => setForm((f) => ({ ...f, rating: n }))} />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-black uppercase tracking-wide text-slate-500">Your story</label>
                        <textarea
                          value={form.text}
                          onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                          placeholder="What changed for you? How did the mocks, AI coach and route help?"
                          rows={4}
                          maxLength={600}
                          className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
                        />
                        <p className="mt-1 text-right text-[11px] text-slate-400">{form.text.length}/600</p>
                      </div>

                      <div className="sm:col-span-2">
                        <button
                          onClick={handleSubmit}
                          disabled={!formValid || submitting}
                          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(37,99,235,0.32)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" /> Posting…
                            </>
                          ) : (
                            <>
                              Publish review <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Wall */}
          {reviewsLoading ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-44 animate-pulse rounded-2xl bg-slate-200/60" />
              ))}
            </div>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-8% 0px' }}
              variants={{ show: { transition: { staggerChildren: 0.06 } } }}
              className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {reviews.slice(0, 9).map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────── */}
      <section className="landing-deferred-section px-4 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-slate-900 px-8 py-14 text-center sm:px-14 sm:py-20"
        >
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-600/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="relative mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-blue-300">
              <Sparkles className="h-3.5 w-3.5" /> Start free — no card required
            </span>
            <h2 className="mt-5 text-3xl font-black leading-[1.1] tracking-tight text-white sm:text-5xl">
              Take one mock today.
              <br />
              See your band move by next week.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-base leading-7 text-slate-300">
              Set your baseline, let the AI coach map your route, and train only what costs you band points.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => navigate('/register')}
                className="group inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-[0_14px_34px_rgba(37,99,235,0.4)] transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Create free account
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-white/5"
              >
                I already have an account
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-black/5 px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-5 sm:flex-row">
          <div className="flex items-center gap-2">
            <BrandMark size={28} />
            <span className="font-black tracking-tight">
              Prof<span className="text-blue-600">AI</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {NAV_LINKS.map((l) => (
              <button key={l.target} onClick={() => go(l.target)} className="text-sm font-semibold text-slate-500 hover:text-slate-900">
                {l.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">Independent prep platform · {new Date().getFullYear()}</p>
        </div>
      </footer>
      </div>
    </div>
  )
}
