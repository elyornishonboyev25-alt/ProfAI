import { useEffect, useMemo, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Bot,
  CheckCircle2,
  ChevronRight,
  Flame,
  Globe2,
  GraduationCap,
  Headphones,
  Languages,
  Loader2,
  Menu,
  Mic2,
  PenSquare,
  Play,
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
  { label: 'Tracks', target: 'tracks' },
  { label: 'How it works', target: 'route' },
  { label: 'Reviews', target: 'reviews' },
] as const

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
  return <span className="text-[11px] font-black uppercase tracking-[0.28em] text-red-600">{children}</span>
}

/* ── Hero: floating live-product cards ─────────────────────────────────── */

function FloatCard({
  className,
  depth,
  y,
  reduce,
  delay,
  children,
}: {
  className?: string
  depth: number
  y: MotionValue<number>
  reduce: boolean
  delay: number
  children: ReactNode
}) {
  return (
    <motion.div
      className={`absolute ${className}`}
      style={reduce ? undefined : { y }}
      initial={{ opacity: 0, scale: 0.85, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      <motion.div
        animate={reduce ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 4 + depth, repeat: Infinity, ease: 'easeInOut' }}
        className="rounded-2xl border border-black/5 bg-white/95 shadow-[0_24px_60px_rgba(15,23,42,0.14)] backdrop-blur"
      >
        {children}
      </motion.div>
    </motion.div>
  )
}

function HeroVisual({ y, reduce }: { y: MotionValue<number>; reduce: boolean }) {
  return (
    <div className="relative mx-auto h-[440px] w-full max-w-[520px]">
      {/* glow */}
      <div className="pointer-events-none absolute inset-6 rounded-[40px] bg-gradient-to-br from-red-300/30 via-rose-200/20 to-amber-100/10 blur-3xl" />

      {/* AI coach reply — the anchor card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
        className="absolute left-1/2 top-10 w-[300px] -translate-x-1/2 rounded-3xl border border-black/5 bg-white p-4 shadow-[0_30px_70px_rgba(15,23,42,0.16)]"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white">
            <Bot className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="text-[13px] font-black text-slate-900">AI Study Coach</p>
            <p className="flex items-center gap-1 text-[10px] font-bold text-green-600">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> analysing your last mock
            </p>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <p className="rounded-2xl rounded-tl-sm bg-slate-100 px-3 py-2 text-[12px] leading-5 text-slate-700">
            Your Reading dipped on True / False / Not Given. Let's drill it for 12 minutes.
          </p>
          <div className="flex items-center gap-2">
            <button className="rounded-xl bg-red-600 px-3 py-1.5 text-[11px] font-bold text-white">Start drill</button>
            <span className="text-[11px] font-semibold text-slate-400">+40 XP</span>
          </div>
        </div>
      </motion.div>

      {/* Band progress card */}
      <FloatCard className="-left-2 top-2 w-[190px]" depth={1.4} y={y} reduce={reduce} delay={0.28}>
        <div className="p-4">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Overall band</p>
          <p className="mt-1 text-2xl font-black tracking-tight text-slate-900">
            6.0 <span className="text-slate-300">→</span> <span className="text-red-600">7.5</span>
          </p>
          <div className="mt-3 flex items-end gap-1.5">
            {[40, 55, 48, 70, 65, 88].map((h, i) => (
              <motion.span
                key={i}
                initial={{ height: 4 }}
                animate={{ height: h * 0.5 }}
                transition={{ duration: 0.8, delay: 0.5 + i * 0.08, ease: EASE }}
                className="w-3 rounded-md bg-gradient-to-t from-red-500 to-rose-400"
                style={{ height: h * 0.5 }}
              />
            ))}
          </div>
        </div>
      </FloatCard>

      {/* Mock timer card */}
      <FloatCard className="-right-3 top-24 w-[200px]" depth={2.1} y={y} reduce={reduce} delay={0.42}>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Reading · P2</p>
            <span className="rounded-md bg-red-500 px-1.5 py-0.5 text-[10px] font-black text-white">18:42</span>
          </div>
          <div className="mt-3 space-y-1.5">
            {['Q12 ✓', 'Q13 ✓', 'Q14 …'].map((q, i) => (
              <div
                key={q}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${
                  i < 2 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                }`}
              >
                {q}
              </div>
            ))}
          </div>
        </div>
      </FloatCard>

      {/* Streak / XP card */}
      <FloatCard className="bottom-6 left-6 w-[210px]" depth={1.1} y={y} reduce={reduce} delay={0.56}>
        <div className="flex items-center gap-3 p-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
            <Flame className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-black tracking-tight text-slate-900">12-day streak</p>
            <p className="text-[11px] font-bold text-slate-400">Level 7 · 3,240 XP</p>
          </div>
        </div>
      </FloatCard>

      {/* Speaking live pill */}
      <FloatCard className="-right-1 bottom-20 w-[170px]" depth={2.6} y={y} reduce={reduce} delay={0.7}>
        <div className="flex items-center gap-2.5 p-3.5">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white">
            <Mic2 className="h-4 w-4" />
            <span className="absolute inset-0 animate-ping rounded-full bg-red-500/40" />
          </span>
          <div>
            <p className="text-[12px] font-black text-slate-900">Live partner</p>
            <p className="text-[10px] font-bold text-green-600">8 online now</p>
          </div>
        </div>
      </FloatCard>
    </div>
  )
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
              className="h-full rounded-full bg-gradient-to-r from-red-500 to-rose-400"
            />
          </div>
        </div>
      ))}
    </div>
  )
}

const WAVE_BARS = [0.5, 0.8, 0.4, 1, 0.6, 0.9, 0.45, 0.75, 0.55, 1, 0.5, 0.85, 0.6, 0.95, 0.4, 0.7, 0.5, 0.9]

function WaveVisual() {
  const reduce = !!useReducedMotion()
  return (
    <div className="mt-5 flex h-12 items-center gap-1">
      {WAVE_BARS.map((peak, i) => (
        <motion.span
          key={i}
          animate={reduce ? undefined : { scaleY: [0.3, peak, 0.3] }}
          transition={{ duration: 1.2 + (i % 5) * 0.18, repeat: Infinity, ease: 'easeInOut', delay: i * 0.05 }}
          className="h-full w-1 flex-1 rounded-full bg-gradient-to-t from-red-500/70 to-rose-400/70"
          style={{ transformOrigin: 'center', transform: `scaleY(${peak})` }}
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
    title: 'Mock Arena',
    body: '30+ full, exam-mode IELTS & SAT simulations with enforced section order and auto-submit.',
    icon: Target,
    route: '/mock/ielts',
    span: 'lg:col-span-1',
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
    route: '/speaking-community',
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
    id: 'TOEFL',
    label: 'TOEFL',
    icon: BookOpen,
    blurb: 'Full TOEFL iBT practice tests — Reading & Listening scored instantly out of 30, plus timed Speaking and Writing.',
    route: '/toefl',
    items: [
      { icon: BookOpen, name: 'Reading', note: 'Academic passages, auto-scored' },
      { icon: Headphones, name: 'Listening', note: 'Lectures with note-taking' },
      { icon: Mic2, name: 'Speaking', note: '4 timed tasks with prep timers' },
      { icon: PenSquare, name: 'Writing', note: 'Integrated + academic discussion' },
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
            <span className="rounded-md bg-red-500 px-2 py-0.5 text-white">{review.bandAfter}</span>
          </div>
        ) : (
          <span className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-black text-red-600">{review.exam}</span>
        )}
        <Quote className="h-5 w-5 text-red-200" />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-rose-600 text-sm font-black text-white">
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
  const reduce = !!useReducedMotion()
  const heroRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const floatY = useTransform(scrollYProgress, [0, 1], [0, -70])

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
    <div className="min-h-screen w-full overflow-x-hidden bg-[#FBF7F1] text-slate-900">
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-3 z-50 px-3 sm:top-4 sm:px-4">
        <div
          className={`mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300 sm:px-6 ${
            scrolled
              ? 'border border-black/5 bg-white/85 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl'
              : 'border border-transparent bg-white/40 backdrop-blur-md'
          }`}
        >
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2">
            <BrandMark size={34} />
            <span className="text-lg font-black tracking-tight">
              Prof<span className="text-red-600">AI</span>
            </span>
          </button>

          <nav className="hidden items-center gap-7 md:flex">
            {NAV_LINKS.map((l) => (
              <button
                key={l.target}
                onClick={() => go(l.target)}
                className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900"
              >
                {l.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/login')}
              className="hidden rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition hover:text-slate-900 sm:block"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate('/register')}
              className="group inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-[0_8px_20px_rgba(220,38,38,0.32)] transition hover:bg-red-700"
            >
              Start free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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
      <section ref={heroRef} className="relative px-4 pb-12 pt-28 sm:pt-36">
        <div className="pointer-events-none absolute -top-10 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(239,68,68,0.16),transparent)] blur-2xl" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
          {/* copy */}
          <div className="text-center lg:text-left">
            <motion.span
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-red-600 shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" /> Your AI-powered path to studying abroad
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.06, ease: EASE }}
              className="mt-5 text-[2.6rem] font-black leading-[1.04] tracking-tight sm:text-6xl"
            >
              One app from
              <br />
              first mock to
              <br />
              <span className="bg-gradient-to-r from-red-600 to-rose-500 bg-clip-text text-transparent">acceptance letter.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.14, ease: EASE }}
              className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-500 lg:mx-0 sm:text-lg"
            >
              IELTS, SAT &amp; TOEFL practice, an AI coach that builds your roadmap, writing &amp; speaking feedback, live
              partners, shadowing, vocab and university research — connected to the band you're chasing.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.22, ease: EASE }}
              className="mt-7 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
            >
              <button
                onClick={() => navigate('/register')}
                className="group inline-flex items-center gap-2 rounded-2xl bg-red-600 px-6 py-3.5 text-sm font-bold text-white shadow-[0_14px_34px_rgba(220,38,38,0.36)] transition hover:-translate-y-0.5 hover:bg-red-700"
              >
                Start free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => scrollToId('features')}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300"
              >
                <Play className="h-4 w-4 text-red-500" /> Explore the platform
              </button>
            </motion.div>

            {/* social proof row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-7 flex flex-wrap items-center justify-center gap-4 lg:justify-start"
            >
              <div className="flex -space-x-2">
                {['NN', 'SS', 'SR', 'DT'].map((t, i) => (
                  <span
                    key={t}
                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#FBF7F1] bg-gradient-to-br from-slate-700 to-slate-900 text-[10px] font-black text-white"
                    style={{ zIndex: 10 - i }}
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-[12px] font-semibold text-slate-500">Loved by students reaching 7.5+ &amp; 1500+</p>
              </div>
            </motion.div>
          </div>

          {/* live visual */}
          <div className="hidden lg:block">
            <HeroVisual y={floatY} reduce={reduce} />
          </div>
        </div>
      </section>

      {/* ── Stat band ───────────────────────────────────────────────── */}
      <section className="px-4 py-10">
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
      <section id="features" className="scroll-mt-24 px-4 py-16 sm:py-24">
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
                      : 'border-black/5 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.06)] hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(220,38,38,0.12)]'
                  }`}
                >
                  {dark && (
                    <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-red-600/40 blur-3xl" />
                  )}
                  <div className="relative flex items-center justify-between">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-2xl ${
                        dark ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white'
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
                    <div className="relative mt-auto flex items-center gap-2 pt-6 text-sm font-bold text-red-300">
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
      <section id="tracks" className="scroll-mt-24 bg-white/60 px-4 py-16 sm:py-24">
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
                      ? 'border-red-300 bg-red-600 text-white shadow-[0_10px_24px_rgba(220,38,38,0.28)]'
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
                      className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-red-100 hover:bg-white"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
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
      <section id="route" className="scroll-mt-24 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <SectionTag>Your route</SectionTag>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-5xl">
              From baseline to target — in four moves.
            </h2>
          </div>

          <div className="relative mt-12 grid gap-4 lg:grid-cols-4">
            <div className="pointer-events-none absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-red-200 to-transparent lg:block" />
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
                    <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white shadow-[0_10px_22px_rgba(220,38,38,0.32)]">
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
      <section id="reviews" className="scroll-mt-24 bg-white/60 px-4 py-16 sm:py-24">
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
                          className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
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
                                  ? 'border-red-300 bg-red-50 text-red-600'
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
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
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
                            className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
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
                          className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium outline-none transition focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100"
                        />
                        <p className="mt-1 text-right text-[11px] text-slate-400">{form.text.length}/600</p>
                      </div>

                      <div className="sm:col-span-2">
                        <button
                          onClick={handleSubmit}
                          disabled={!formValid || submitting}
                          className="inline-flex items-center gap-2 rounded-2xl bg-red-600 px-6 py-3.5 text-sm font-bold text-white shadow-[0_12px_28px_rgba(220,38,38,0.32)] transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
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
      <section className="px-4 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-slate-900 px-8 py-14 text-center sm:px-14 sm:py-20"
        >
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-red-600/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-rose-500/20 blur-3xl" />
          <div className="relative mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-red-300">
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
                className="group inline-flex items-center gap-2 rounded-2xl bg-red-600 px-6 py-3.5 text-sm font-bold text-white shadow-[0_14px_34px_rgba(220,38,38,0.4)] transition hover:-translate-y-0.5 hover:bg-red-700"
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
              Prof<span className="text-red-600">AI</span>
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
  )
}
