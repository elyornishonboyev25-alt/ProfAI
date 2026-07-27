import { useEffect, useMemo, useRef, useState, type ComponentType, type CSSProperties, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  BarChart3,
  BadgeCheck,
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
  { label: 'Tracks', target: 'tracks' },
  { label: 'How it works', target: 'route' },
  { label: 'Success stories', target: 'reviews' },
] as const

const HERO_PILLS = [
  { icon: 'file', label: '30 Full Mocks', target: 'features' },
  { icon: 'pen', label: 'AI Writing Evaluation', target: 'features' },
  { icon: 'globe', label: 'Live Speaking Partners', target: 'features' },
] as const

// Ambient floating red spheres scattered behind/in front of the glass at varied depth.
const LANDING_SPHERES: Array<{ style: CSSProperties; delay: number; dur: number }> = [
  { style: { top: '14%', right: '6%', width: 26, height: 26, opacity: 0.75 }, delay: 0, dur: 8 },
  { style: { top: '30%', right: '30%', width: 14, height: 14, opacity: 0.55 }, delay: 1.4, dur: 10 },
  { style: { top: '46%', left: '3%', width: 44, height: 44, opacity: 0.4 }, delay: 0.6, dur: 11 },
  { style: { bottom: '22%', right: '12%', width: 90, height: 90, opacity: 0.32 }, delay: 2.1, dur: 12 },
  { style: { top: '62%', right: '4%', width: 18, height: 18, opacity: 0.6 }, delay: 1.1, dur: 9 },
  { style: { top: '20%', left: '18%', width: 20, height: 20, opacity: 0.5 }, delay: 0.3, dur: 10.5 },
]

const STATS = [
  { value: 30, suffix: '+', label: 'Full exam simulations' },
  { value: 10000, suffix: '+', label: 'Adaptive practice items' },
  { value: 12, suffix: '', label: 'AI-powered study tools' },
  { value: 4, suffix: '', label: 'Skills in one roadmap' },
] as const

const UNIVERSITIES = [
  { name: 'Harvard', mark: 'H', tone: 'from-[#9f1d35] to-[#6d1023]' },
  { name: 'Stanford', mark: 'S', tone: 'from-[#a40b35] to-[#760021]' },
  { name: 'MIT', mark: 'M', tone: 'from-[#ed1c24] to-[#a70f16]' },
  { name: 'Oxford', mark: 'O', tone: 'from-[#102f5e] to-[#061d3e]' },
  { name: 'Cambridge', mark: 'C', tone: 'from-[#9c1b32] to-[#54101f]' },
  { name: 'Yale', mark: 'Y', tone: 'from-[#184b8a] to-[#0a2f62]' },
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
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50/80 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-red-600">
      <Sparkles className="h-3 w-3" />
      {children}
    </span>
  )
}

function UniversityProof() {
  return (
    <section className="relative px-4 pb-6 pt-4 sm:pb-10">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[32px] border border-slate-200/70 bg-white/85 shadow-[0_24px_70px_rgba(15,23,42,0.07)] backdrop-blur-xl">
        <div className="grid border-b border-slate-100 md:grid-cols-[0.9fr_1.35fr]">
          <div className="relative overflow-hidden bg-slate-950 px-6 py-8 text-white sm:px-9">
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-red-600/25 blur-3xl" />
            <div className="relative">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-300">Ambitious goals. One system.</p>
              <h2 className="mt-2 max-w-sm text-2xl font-black leading-tight tracking-[-0.03em] sm:text-3xl">
                From target score to dream campus.
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
                Prep, performance analytics and admissions planning — connected in one intelligent journey.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-3">
            {[
              { icon: Award, eyebrow: 'IELTS target', value: '9.0', note: 'Band-level skill coaching' },
              { icon: Target, eyebrow: 'SAT target', value: '1600', note: 'Digital SAT practice path' },
              { icon: GraduationCap, eyebrow: 'Admissions', value: 'Top 50', note: 'University research tools' },
            ].map((item, index) => {
              const Icon = item.icon
              return (
                <div
                  key={item.eyebrow}
                  className={`group relative px-6 py-7 transition hover:bg-red-50/45 ${
                    index ? 'border-t border-slate-100 sm:border-l sm:border-t-0' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{item.eyebrow}</p>
                      <p className="mt-1 text-4xl font-black tracking-[-0.05em] text-slate-950">{item.value}</p>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-600 transition group-hover:bg-red-600 group-hover:text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">{item.note}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="px-5 py-6 sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Explore universities worldwide</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">Build a smarter shortlist with rankings, fit and admission insights.</p>
            </div>
            <div className="grid grid-cols-3 gap-x-5 gap-y-4 sm:grid-cols-6">
              {UNIVERSITIES.map((university) => (
                <div key={university.name} className="group flex items-center gap-2.5">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${university.tone} text-xs font-black text-white shadow-[0_8px_20px_rgba(15,23,42,0.14)] transition-transform group-hover:-translate-y-0.5`}
                  >
                    {university.mark}
                  </span>
                  <span className="hidden text-xs font-black tracking-tight text-slate-700 xl:block">{university.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-3 max-w-6xl text-right text-[9px] font-medium text-slate-400">
        University names are shown for research and goal-setting purposes. ProfAI is an independent platform.
      </p>
    </section>
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

function CoachPlanVisual() {
  const tasks = [
    { label: 'Coherence drill', meta: '12 min', done: true },
    { label: 'Listening mock · Part 3', meta: '24 min', done: false },
    { label: 'Academic word set', meta: '18 words', done: false },
  ] as const

  return (
    <div className="relative mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.055] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-red-300">Today’s roadmap</p>
          <p className="mt-1 text-sm font-black text-white">3 focused tasks · 54 min</p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white">
          <Flame className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-4 space-y-2">
        {tasks.map((task, index) => (
          <div key={task.label} className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.055] px-3 py-2.5">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                task.done ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-slate-400'
              }`}
            >
              {task.done ? <CheckCircle2 className="h-3.5 w-3.5" /> : <span className="text-[9px] font-black">0{index + 1}</span>}
            </span>
            <p className="min-w-0 flex-1 truncate text-[11px] font-bold text-slate-200">{task.label}</p>
            <span className="text-[9px] font-bold text-slate-500">{task.meta}</span>
          </div>
        ))}
      </div>
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
    visual: <CoachPlanVisual />,
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
      className="group flex h-full flex-col rounded-[26px] border border-slate-200/70 bg-white p-5 shadow-[0_14px_34px_rgba(15,23,42,0.055)] transition duration-300 hover:-translate-y-1 hover:border-red-100 hover:shadow-[0_22px_48px_rgba(220,38,38,0.09)]"
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
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-sm font-black text-white shadow-[0_8px_18px_rgba(220,38,38,0.2)]">
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
    <div className="landing-premium relative min-h-screen w-full overflow-x-hidden bg-[#fbfaf8] text-slate-900">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-[-12rem] top-[-8rem] h-[34rem] w-[34rem] rounded-full bg-blue-100/50 blur-[110px]" />
        <div className="absolute right-[-10rem] top-24 h-[38rem] w-[38rem] rounded-full bg-red-100/65 blur-[120px]" />
        <div className="landing-grid absolute inset-0 opacity-35" />
      </div>
      <div className="relative z-10">
      {/* ── Navigation ──────────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-3 z-50 px-3 sm:top-5 sm:px-4">
        <div
          className={`mx-auto flex max-w-6xl items-center justify-between overflow-hidden rounded-[24px] border border-white/80 bg-white/85 px-4 py-2.5 backdrop-blur-2xl transition-all duration-300 sm:px-5 ${
            scrolled ? 'shadow-[0_16px_50px_rgba(15,23,42,0.12)]' : 'shadow-[0_10px_35px_rgba(15,23,42,0.06)]'
          }`}
        >
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="relative flex items-center gap-2.5">
            <BrandMark size={39} className="drop-shadow-[0_6px_12px_rgba(220,38,38,0.22)]" />
            <span className="text-xl font-black tracking-[-0.04em]">
              Prof<span className="text-red-600">AI</span>
            </span>
          </button>

          <nav className="relative hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((l) => (
              <button
                key={l.target}
                onClick={() => go(l.target)}
                className="rounded-full px-3.5 py-2 text-[13px] font-bold text-slate-500 transition hover:bg-slate-100/80 hover:text-slate-950"
              >
                {l.label}
              </button>
            ))}
          </nav>

          <div className="relative flex items-center gap-2">
            <button
              onClick={() => navigate('/login')}
              className="hidden rounded-xl px-4 py-2.5 text-[13px] font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 sm:block"
            >
              Sign in
            </button>
            <button
              onClick={() => navigate('/register')}
              className="hidden items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-[13px] font-black text-white shadow-[0_10px_26px_rgba(220,38,38,0.26)] transition hover:-translate-y-0.5 hover:bg-red-700 sm:inline-flex"
            >
              Start free <ArrowRight className="h-3.5 w-3.5" />
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
      <section ref={heroRef} className="relative px-4 pb-8 pt-28 sm:pt-36">
        <div className="relative mx-auto grid min-h-[610px] max-w-6xl items-center gap-10 lg:grid-cols-[0.94fr_1.06fr]">
          {/* copy */}
          <div className="text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, ease: EASE }}
              className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-white/85 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-600 shadow-[0_8px_28px_rgba(220,38,38,0.08)]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI-powered exam & admissions platform
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.06, ease: EASE }}
              className="mt-6 text-[3.35rem] font-black leading-[0.92] tracking-[-0.065em] text-slate-950 sm:text-[5rem] lg:text-[4.7rem]"
            >
              Your highest score.
              <span className="mt-2 block bg-gradient-to-r from-red-600 via-rose-500 to-orange-500 bg-clip-text text-transparent">
                Your best future.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.14, ease: EASE }}
              className="mx-auto mt-6 max-w-xl text-[15px] font-medium leading-7 text-slate-500 lg:mx-0 sm:text-lg sm:leading-8"
            >
              Master IELTS and SAT with an AI coach that turns every mock into a personalized roadmap — then research
              the universities where your score can take you.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.22, ease: EASE }}
              className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start"
            >
              <button
                onClick={() => navigate('/register')}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-red-600 px-7 py-4 text-sm font-black text-white shadow-[0_16px_34px_rgba(220,38,38,0.3)] transition hover:-translate-y-0.5 hover:bg-red-700"
              >
                Start learning free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => scrollToId('features')}
                className="group inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-7 py-4 text-sm font-black text-slate-800 shadow-[0_10px_25px_rgba(15,23,42,0.05)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white"
              >
                Explore the platform
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.32, ease: EASE }}
              className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-xs font-bold text-slate-500 lg:justify-start"
            >
              <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-emerald-500" /> No card required</span>
              <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-emerald-500" /> Instant score analysis</span>
              <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-emerald-500" /> Study at your pace</span>
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

        {/* feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: EASE }}
          className="relative mx-auto mt-6 grid max-w-6xl gap-3 sm:grid-cols-3"
        >
          {HERO_PILLS.map((pill) => {
            const Icon = pill.icon === 'file' ? BookOpen : pill.icon === 'pen' ? PenSquare : Globe2
            return (
              <button
                key={pill.label}
                onClick={() => scrollToId(pill.target)}
                className="group flex items-center gap-3.5 overflow-hidden rounded-2xl border border-white/80 bg-white/75 px-5 py-4 text-left shadow-[0_14px_35px_rgba(15,23,42,0.06)] backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white hover:shadow-[0_20px_44px_rgba(220,38,38,0.1)]"
              >
                <span
                  className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-red-600"
                  style={{
                    background: 'linear-gradient(145deg, rgba(254,242,242,1), rgba(255,255,255,1))',
                    boxShadow: '0 8px 18px rgba(220,38,38,0.12)',
                    border: '1px solid rgba(254,202,202,0.75)',
                  }}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <span className="relative text-sm font-black tracking-tight text-slate-800 sm:text-base">{pill.label}</span>
              </button>
            )
          })}
        </motion.div>
      </section>

      {/* ── Stat band ───────────────────────────────────────────────── */}
      <section className="relative z-10 px-4 py-8">
        <div className="mx-auto grid max-w-6xl grid-cols-2 overflow-hidden rounded-[28px] border border-slate-200/70 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.06)] sm:grid-cols-4">
          {STATS.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
              className={`px-4 py-6 text-center sm:py-7 ${i % 2 ? 'border-l border-slate-100' : ''} ${i > 1 ? 'border-t border-slate-100 sm:border-t-0' : ''} ${i > 0 ? 'sm:border-l sm:border-slate-100' : ''}`}
            >
              <p className="text-3xl font-black tracking-[-0.05em] text-slate-950 sm:text-4xl">
                <CountUp value={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-1.5 text-[11px] font-bold leading-5 text-slate-500">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <UniversityProof />

      {/* ── Bento features ──────────────────────────────────────────── */}
      <section id="features" className="relative scroll-mt-24 px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
            className="mx-auto max-w-3xl text-center"
          >
            <SectionTag>Everything in one place</SectionTag>
            <h2 className="mt-5 text-3xl font-black leading-[1.03] tracking-[-0.045em] sm:text-5xl">
              Your entire prep team,
              <span className="block text-red-600">inside one intelligent platform.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-7 text-slate-500">
              Every mock, drill, correction and vocabulary session feeds one shared roadmap — so your effort compounds
              instead of getting lost across disconnected tools.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-8% 0px' }}
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            className="mt-14 grid gap-4 sm:grid-cols-2 lg:auto-rows-[250px] lg:grid-cols-4"
          >
            {FEATURES.map((f) => {
              const Icon = f.icon
              const dark = f.tone === 'dark'
              return (
                <motion.button
                  key={f.title}
                  variants={fadeUp}
                  onClick={() => navigate(f.route)}
                  className={`group relative flex flex-col overflow-hidden rounded-[28px] border p-6 text-left transition duration-300 ${f.span} ${
                    dark
                      ? 'border-white/10 bg-slate-950 text-white shadow-[0_32px_80px_rgba(15,23,42,0.28)]'
                      : 'border-slate-200/70 bg-white/90 shadow-[0_16px_38px_rgba(15,23,42,0.055)] hover:-translate-y-1.5 hover:border-red-100 hover:shadow-[0_24px_55px_rgba(220,38,38,0.1)]'
                  }`}
                >
                  {dark && (
                    <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-red-600/40 blur-3xl" />
                  )}
                  <div className="relative flex items-center justify-between">
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
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
                  <h3 className={`relative mt-5 text-lg font-black tracking-[-0.025em] ${dark ? 'text-white' : 'text-slate-950'}`}>
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
      <section id="tracks" className="relative scroll-mt-24 overflow-hidden bg-slate-950 px-4 py-20 sm:py-28">
        <div className="pointer-events-none absolute -left-32 top-12 h-80 w-80 rounded-full bg-red-600/15 blur-[100px]" />
        <div className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[110px]" />
        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <SectionTag>Choose your goal</SectionTag>
            <h2 className="mt-5 text-3xl font-black leading-[1.03] tracking-[-0.045em] text-white sm:text-5xl">
              One destination. A roadmap made for you.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400">
              Switch between focused tracks while your progress, weak points and study history stay connected.
            </p>
          </div>

          {/* tabs */}
          <div className="mt-10 flex flex-wrap justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-2 sm:mx-auto sm:w-fit">
            {TRACKS.map((t) => {
              const Icon = t.icon
              const active = t.id === activeTrack
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTrack(t.id)}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-2.5 text-sm font-bold transition ${
                    active
                      ? 'border-red-500 bg-red-600 text-white shadow-[0_10px_24px_rgba(220,38,38,0.3)]'
                      : 'border-transparent bg-transparent text-slate-400 hover:bg-white/5 hover:text-white'
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
              className="grid gap-7 rounded-[32px] border border-white/10 bg-white p-6 shadow-[0_28px_80px_rgba(0,0,0,0.3)] sm:p-9 lg:grid-cols-[0.85fr_1.4fr] lg:items-center"
            >
              <div>
                <p className="text-3xl font-black tracking-[-0.04em] text-slate-950">{track.label}</p>
                <p className="mt-3 max-w-sm text-sm font-medium leading-6 text-slate-500">{track.blurb}</p>
                <button
                  onClick={() => navigate(track.route)}
                    className="group mt-6 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(220,38,38,0.24)] transition hover:-translate-y-0.5 hover:bg-red-700"
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
                      className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:-translate-y-0.5 hover:border-red-100 hover:bg-white hover:shadow-[0_12px_28px_rgba(220,38,38,0.07)]"
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
      <section id="route" className="scroll-mt-24 px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <SectionTag>Your route</SectionTag>
            <h2 className="mt-5 text-3xl font-black leading-[1.03] tracking-[-0.045em] sm:text-5xl">
              A clear path from first mock
              <span className="block text-red-600">to your target score.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-500">
              No guesswork and no random practice. Every step is chosen from your real performance data.
            </p>
          </div>

          <div className="relative mt-14 grid gap-4 lg:grid-cols-4">
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
                  className="group relative overflow-hidden rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_16px_36px_rgba(15,23,42,0.055)] transition duration-300 hover:-translate-y-1 hover:border-red-100 hover:shadow-[0_22px_48px_rgba(220,38,38,0.09)]"
                >
                  <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-red-50 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
                  <div className="flex items-center justify-between">
                    <span className="relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-600 text-white shadow-[0_10px_22px_rgba(220,38,38,0.32)]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-4xl font-black tracking-[-0.06em] text-slate-100">{s.n}</span>
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
      <section id="reviews" className="scroll-mt-24 border-y border-slate-100 bg-white/75 px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <SectionTag>Student proof</SectionTag>
              <h2 className="mt-5 text-3xl font-black leading-[1.03] tracking-[-0.045em] sm:text-5xl">
                Real progress. Shared by students.
              </h2>
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
              className="group inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(15,23,42,0.16)] transition hover:-translate-y-0.5 hover:bg-red-600"
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
      <section className="px-4 py-20 sm:py-28">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative mx-auto max-w-6xl overflow-hidden rounded-[38px] bg-[linear-gradient(135deg,#080d18_0%,#111827_48%,#7f1d1d_145%)] px-8 py-14 text-center shadow-[0_38px_90px_rgba(15,23,42,0.25)] sm:px-14 sm:py-20"
        >
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-red-600/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-rose-500/20 blur-3xl" />
          <div className="relative mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-red-300 backdrop-blur-xl">
              <Sparkles className="h-3.5 w-3.5" /> Your next milestone starts here
            </span>
            <h2 className="mt-6 text-3xl font-black leading-[1.04] tracking-[-0.045em] text-white sm:text-5xl">
              Turn your target score
              <br />
              into a plan you can follow.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-300">
              Take a diagnostic mock, unlock your personal roadmap and start improving the skills that matter most.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => navigate('/register')}
                className="group inline-flex items-center gap-2 rounded-2xl bg-red-600 px-7 py-4 text-sm font-black text-white shadow-[0_14px_34px_rgba(220,38,38,0.4)] transition hover:-translate-y-0.5 hover:bg-red-700"
              >
                Create free account
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-7 py-4 text-sm font-black text-white backdrop-blur-xl transition hover:bg-white/10"
              >
                I already have an account
              </button>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-black/5 bg-white/50 px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
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
          <p className="text-[11px] font-medium text-slate-400">Independent exam & admissions platform · {new Date().getFullYear()}</p>
        </div>
      </footer>
      </div>
    </div>
  )
}
