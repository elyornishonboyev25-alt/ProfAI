import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Headphones,
  History,
  Loader2,
  MapPin,
  Menu,
  Mic2,
  PenSquare,
  Quote,
  Sparkles,
  Star,
  Target,
  X,
} from 'lucide-react'
import { BrandMark } from '@/components/brand/BrandLogo'
import { CountUp } from '@/components/fx'
import { loadReviews, submitReview, type LandingReview, type ReviewExam } from '@/lib/reviewsApi'

/* ──────────────────────────────────────────────────────────────────────────
   ProfAI — public marketing landing (guests only). Mirrors the polish of a
   top-tier prep landing: animated hero with floating university badges, a
   live mock mockup, a feature route, and a community review wall that anyone
   can post to. Built with framer-motion; respects reduced-motion.
   ────────────────────────────────────────────────────────────────────────── */

const EASE = [0.22, 1, 0.36, 1] as const

const NAV_LINKS = [
  { label: 'Results', target: 'results' },
  { label: 'Platform', target: 'platform' },
  { label: 'Route', target: 'route' },
  { label: 'Reviews', target: 'reviews' },
] as const

const UNIVERSITIES = [
  { name: 'MIT', color: '#8A1A2B', pos: 'left-[8%] top-[6%]', rotate: -8, depth: 26 },
  { name: 'Columbia', color: '#1D4F91', pos: 'right-[6%] top-[2%]', rotate: 7, depth: 36 },
  { name: 'Harvard', color: '#A41034', pos: 'left-[2%] top-[40%]', rotate: -6, depth: 44 },
  { name: 'Stanford', color: '#8C1515', pos: 'right-[1%] top-[38%]', rotate: 8, depth: 30 },
  { name: 'Yale', color: '#0F4D92', pos: 'left-[14%] bottom-[6%]', rotate: -5, depth: 38 },
  { name: 'Oxford', color: '#002147', pos: 'right-[12%] bottom-[4%]', rotate: 6, depth: 48 },
] as const

const TARGETS = ['9.0', '1600', '8.5', '1540'] as const

const FEATURES = [
  {
    eyebrow: 'Full mocks',
    title: 'Walk in already knowing the rhythm',
    body: 'Timed Listening, Reading, Writing and Speaking — followed by a clear review path, not a raw score.',
    icon: Target,
  },
  {
    eyebrow: '10,000+ items',
    title: 'Practice what costs band points',
    body: 'Filter by skill, question type, difficulty and the exact patterns you keep missing.',
    icon: BookOpen,
  },
  {
    eyebrow: 'Writing AI',
    title: 'Get rubric feedback in minutes',
    body: 'Task Response, Coherence, Lexical and Grammar scored on the band rubric. No guessing what to fix.',
    icon: PenSquare,
  },
  {
    eyebrow: 'Vocab',
    title: 'Keep weak words in rotation',
    body: 'Missed words return on a spaced schedule until they stop slowing your reading down.',
    icon: Sparkles,
  },
  {
    eyebrow: 'History',
    title: 'Watch the band move',
    body: 'Mocks, practice and rubric scores stay in one timeline, so your trend is always obvious.',
    icon: History,
  },
] as const

const STEPS = [
  { n: '01', title: 'Take a full mock', body: 'Set a clean baseline across all four skills under real timing.' },
  { n: '02', title: 'Open the map', body: 'See which skill — and which sub-skill — is costing you the most band points.' },
  { n: '03', title: 'Practice the gaps', body: 'Train on the exact question types you missed, not random sets.' },
  { n: '04', title: 'Replay weak vocab', body: 'Keep slow words in rotation until your reading speed catches up.' },
] as const

const SKILL_CARDS = [
  { label: 'Listening', icon: Headphones, pos: 'left-[2%] top-[8%]', delay: 0 },
  { label: 'Reading', icon: BookOpen, pos: 'right-[4%] top-[0%]', delay: 0.4 },
  { label: 'Writing', icon: PenSquare, pos: 'left-[10%] bottom-[6%]', delay: 0.8 },
  { label: 'Speaking', icon: Mic2, pos: 'right-[8%] bottom-[12%]', delay: 1.2 },
] as const

const EXAM_OPTIONS: ReviewExam[] = ['IELTS', 'SAT', 'General']

/* ── small helpers ─────────────────────────────────────────────────────── */

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
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE, delay: i * 0.08 },
  }),
}

function SectionTag({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-black uppercase tracking-[0.28em] text-red-600">{children}</span>
  )
}

/* ── Hero university badge ─────────────────────────────────────────────── */

function UniBadge({
  name,
  color,
  pos,
  rotate,
  depth,
  y,
  reduce,
}: {
  name: string
  color: string
  pos: string
  rotate: number
  depth: number
  y: MotionValue<number>
  reduce: boolean
}) {
  return (
    <motion.div
      className={`absolute ${pos} z-10 hidden sm:block`}
      style={reduce ? undefined : { y }}
      initial={{ opacity: 0, scale: 0.6, rotate }}
      animate={{ opacity: 1, scale: 1, rotate }}
      transition={{ duration: 0.7, ease: EASE, delay: 0.2 + depth / 120 }}
    >
      <motion.div
        animate={reduce ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 4 + depth / 16, repeat: Infinity, ease: 'easeInOut' }}
        className="rounded-2xl border border-black/5 bg-white px-4 py-2.5 shadow-[0_18px_40px_rgba(15,23,42,0.16)]"
        style={{ boxShadow: `0 18px 40px rgba(15,23,42,0.14), inset 0 0 0 1px ${color}14` }}
      >
        <span className="text-lg font-black tracking-tight" style={{ color }}>
          {name}
        </span>
      </motion.div>
    </motion.div>
  )
}

/* ── Animated mock mockup (right side of the platform section) ─────────── */

function MockMockup() {
  const reduce = useReducedMotion()
  return (
    <div className="relative w-full">
      <div className="overflow-hidden rounded-[26px] border border-black/5 bg-white shadow-[0_40px_90px_rgba(15,23,42,0.14)]">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-slate-200" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            IELTS · Reading · Passage 2
          </p>
          <span className="rounded-md bg-red-500 px-2 py-0.5 text-[11px] font-black text-white">18:42</span>
        </div>

        <div className="grid gap-5 p-5 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-600">Passage</p>
            <p className="mt-2 text-[13px] leading-6 text-slate-600">
              The migration patterns of arctic terns have long puzzled ornithologists. These small seabirds
              travel from pole to pole each year, covering distances no other vertebrate matches.{' '}
              <span className="rounded bg-red-100/80 px-0.5 text-slate-800">
                the birds use atmospheric pressure systems to conserve energy
              </span>
              , adding thousands of kilometres to the trip.
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Question 14</p>
            <p className="mt-2 text-[13px] font-bold leading-5 text-slate-800">
              Arctic terns extend their migration distance because they:
            </p>
            <div className="mt-3 space-y-2">
              {[
                { k: 'A', t: 'follow ocean currents', on: false },
                { k: 'B', t: 'use pressure systems to save energy', on: true },
                { k: 'C', t: 'avoid predator territories', on: false },
                { k: 'D', t: 'rely on celestial cues alone', on: false },
              ].map((opt) => (
                <motion.div
                  key={opt.k}
                  initial={false}
                  animate={
                    opt.on && !reduce
                      ? { borderColor: ['#FECACA', '#EF4444', '#FECACA'] }
                      : {}
                  }
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-[12px] font-semibold ${
                    opt.on
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : 'border-slate-200 bg-white text-slate-500'
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                      opt.on ? 'border-red-500' : 'border-slate-300'
                    }`}
                  >
                    {opt.on && <span className="h-2 w-2 rounded-full bg-red-500" />}
                  </span>
                  {opt.t}
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-600">
            <MapPin className="h-3.5 w-3.5" /> 14 of 40
          </span>
          <span className="text-[11px] font-medium text-slate-400">Auto-saved</span>
        </div>
      </div>

      {/* soft glow */}
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[40px] bg-gradient-to-br from-red-200/30 to-rose-100/20 blur-3xl" />
    </div>
  )
}

/* ── Star rating input ─────────────────────────────────────────────────── */

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
            <Star
              className={`h-6 w-6 ${active ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-slate-300'}`}
            />
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
          <span className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-black text-red-600">
            {review.exam}
          </span>
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
  const reduce = useReducedMotion()
  const heroRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const badgeShift = useTransform(scrollYProgress, [0, 1], [0, -80])

  const [scrolled, setScrolled] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const [targetIdx, setTargetIdx] = useState(0)

  // Reviews
  const [reviews, setReviews] = useState<LandingReview[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [justSubmitted, setJustSubmitted] = useState(false)
  const [form, setForm] = useState({
    name: '',
    exam: 'IELTS' as ReviewExam,
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
    if (reduce) return
    const id = window.setInterval(() => setTargetIdx((i) => (i + 1) % TARGETS.length), 2600)
    return () => window.clearInterval(id)
  }, [reduce])

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

  return (
    <div className="min-h-screen w-full bg-[#FBF7F1] text-slate-900">
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-3 z-50 px-3 sm:top-4 sm:px-4">
        <div
          className={`mx-auto flex max-w-6xl items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300 sm:px-6 ${
            scrolled
              ? 'border border-black/5 bg-white/85 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl'
              : 'border border-transparent bg-white/50 backdrop-blur-md'
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
              Start
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() => setMobileNav((v) => !v)}
              className="ml-1 rounded-lg p-1.5 text-slate-700 md:hidden"
              aria-label="Menu"
            >
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
      <section ref={heroRef} className="relative overflow-hidden px-4 pb-16 pt-28 sm:pt-36">
        <div className="pointer-events-none absolute left-1/2 top-24 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-gradient-to-br from-red-200/40 via-rose-100/30 to-transparent blur-[90px]" />

        <div className="relative mx-auto max-w-5xl">
          {/* Floating university badges + giant target */}
          <div className="relative mx-auto h-[330px] max-w-3xl sm:h-[360px]">
            {UNIVERSITIES.map((u) => (
              <UniBadge key={u.name} {...u} y={badgeShift} reduce={!!reduce} />
            ))}

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: EASE }}
                className="relative"
              >
                <AnimatePresence mode="wait">
                  <motion.span
                    key={TARGETS[targetIdx]}
                    initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -24, filter: 'blur(8px)' }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="block bg-gradient-to-b from-slate-900 to-slate-700 bg-clip-text text-[120px] font-black leading-none tracking-tighter text-transparent sm:text-[180px]"
                  >
                    {TARGETS[targetIdx]}
                  </motion.span>
                </AnimatePresence>
              </motion.div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-1 text-[11px] font-black uppercase tracking-[0.32em] text-slate-400"
              >
                Your target. Your destination.
              </motion.p>
            </div>
          </div>

          {/* Headline */}
          <div className="mx-auto mt-8 max-w-3xl text-center">
            <motion.span
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE }}
              className="inline-flex items-center gap-1.5 rounded-full border border-red-100 bg-white px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-red-600 shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" /> Study abroad, powered by AI
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08, ease: EASE }}
              className="mt-5 text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl"
            >
              Reach your <span className="text-red-600">target band.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.16, ease: EASE }}
              className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-500 sm:text-lg"
            >
              Full IELTS &amp; SAT mocks, focused practice, writing AI feedback and vocab — in one prep route
              that takes you from baseline to acceptance letter.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.24, ease: EASE }}
              className="mt-7 flex flex-wrap items-center justify-center gap-3"
            >
              <button
                onClick={() => navigate('/register')}
                className="group inline-flex items-center gap-2 rounded-2xl bg-red-600 px-6 py-3.5 text-sm font-bold text-white shadow-[0_14px_34px_rgba(220,38,38,0.36)] transition hover:-translate-y-0.5 hover:bg-red-700"
              >
                Start preparation
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <button
                onClick={() => scrollToId('platform')}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300"
              >
                See the platform
              </button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Trust strip ─────────────────────────────────────────────── */}
      <section className="border-y border-black/5 bg-white/60 px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-[11px] font-black uppercase tracking-[0.28em] text-slate-400">
            Built for serious IELTS &amp; SAT preparation
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
            {['Cambridge', 'College Board', 'IDP · IELTS', 'British Council'].map((b) => (
              <span key={b} className="text-lg font-black tracking-tight text-slate-300 transition-colors hover:text-slate-400">
                {b}
              </span>
            ))}
          </div>
          <p className="mx-auto mt-5 max-w-2xl text-center text-[11px] leading-5 text-slate-400">
            ProfAI is independent and not endorsed by Cambridge Assessment, College Board, IDP or the British
            Council. Names are used for clarity only.
          </p>
        </div>
      </section>

      {/* ── Platform / mock showcase ────────────────────────────────── */}
      <section id="platform" className="scroll-mt-24 px-4 py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_1.15fr]">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-12% 0px' }}
            variants={fadeUp}
          >
            <SectionTag>Practice engine</SectionTag>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-5xl">
              Mock, map,
              <br />
              train.
            </h2>
            <p className="mt-4 max-w-md text-base leading-7 text-slate-500">
              Start with a timed mock. ProfAI shows you what to fix next — a targeted task, not random practice.
            </p>

            <div className="mt-7 space-y-5">
              {[
                ['Timed mocks', 'Full IELTS Academic, General Training and SAT.'],
                ['Skill map', 'Sub-skills, pacing and band-rubric gaps.'],
                ['Next task', 'A precise task after each mock — never random.'],
              ].map(([t, d]) => (
                <div key={t} className="flex gap-3 border-t border-slate-200 pt-4">
                  <span className="font-black text-slate-900">{t}</span>
                  <span className="text-sm leading-6 text-slate-500">{d}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30, rotateX: 8 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, margin: '-12% 0px' }}
            transition={{ duration: 0.8, ease: EASE }}
            style={{ perspective: 1000 }}
          >
            <MockMockup />
          </motion.div>
        </div>
      </section>

      {/* ── Feature route list ──────────────────────────────────────── */}
      <section id="results" className="scroll-mt-24 bg-white/60 px-4 py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <SectionTag>What students use next</SectionTag>
            <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-5xl">
              One mock
              <br />
              becomes a route.
            </h2>
            <p className="mt-4 max-w-sm text-base leading-7 text-slate-500">
              Question bank, writing AI, vocab and review all stay connected to the band you are chasing.
            </p>
            <div className="mt-7 inline-flex items-center gap-3 rounded-2xl border border-black/5 bg-white px-5 py-4 shadow-sm">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.round(ratingAvg) ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-slate-200'}`}
                  />
                ))}
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">{ratingAvg.toFixed(1)} / 5.0</p>
                <p className="text-[11px] text-slate-400">{reviews.length}+ student reviews</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-10% 0px' }}
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            className="divide-y divide-slate-200"
          >
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <motion.button
                  key={f.title}
                  variants={fadeUp}
                  onClick={() => navigate('/register')}
                  className="group flex w-full items-start gap-4 py-5 text-left"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 transition group-hover:bg-red-600 group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-red-600">{f.eyebrow}</p>
                    <p className="mt-0.5 text-lg font-black tracking-tight text-slate-900">{f.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{f.body}</p>
                  </div>
                  <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-red-500" />
                </motion.button>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* ── Route steps ─────────────────────────────────────────────── */}
      <section id="route" className="scroll-mt-24 px-4 py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          {/* floating skill cards */}
          <div className="relative order-2 h-[360px] lg:order-1">
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-red-200/40 to-rose-100/20 blur-3xl" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, ease: EASE }}
                className="flex h-24 w-24 flex-col items-center justify-center rounded-3xl bg-red-600 text-white shadow-[0_20px_44px_rgba(220,38,38,0.4)]"
              >
                <Target className="h-7 w-7" />
                <span className="mt-1 text-xs font-black">Band 8.0</span>
              </motion.div>
            </div>
            {SKILL_CARDS.map((c) => {
              const Icon = c.icon
              return (
                <motion.div
                  key={c.label}
                  className={`absolute ${c.pos}`}
                  initial={{ opacity: 0, scale: 0.6 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: EASE, delay: c.delay * 0.3 }}
                >
                  <motion.div
                    animate={reduce ? undefined : { y: [0, -12, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: c.delay }}
                    className="flex flex-col items-center gap-1.5 rounded-2xl border border-black/5 bg-white px-5 py-3.5 shadow-[0_16px_36px_rgba(15,23,42,0.12)]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-black text-slate-700">{c.label}</span>
                  </motion.div>
                </motion.div>
              )
            })}
          </div>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-10% 0px' }}
            variants={{ show: { transition: { staggerChildren: 0.1 } } }}
            className="order-1 lg:order-2"
          >
            <motion.div variants={fadeUp}>
              <SectionTag>Your route</SectionTag>
              <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-5xl">
                Know what
                <br />
                to practice.
              </h2>
              <p className="mt-4 max-w-md text-base leading-7 text-slate-500">
                ProfAI turns mock results, missed questions and vocab gaps into focused practice across all four
                skills.
              </p>
            </motion.div>

            <div className="mt-8 space-y-1">
              {STEPS.map((s) => (
                <motion.div
                  key={s.n}
                  variants={fadeUp}
                  className="flex gap-4 border-t border-slate-200 py-4"
                >
                  <span className="text-sm font-black text-red-600">{s.n}</span>
                  <div>
                    <p className="font-black text-slate-900">{s.title}</p>
                    <p className="mt-0.5 text-sm leading-6 text-slate-500">{s.body}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Reviews wall ────────────────────────────────────────────── */}
      <section id="reviews" className="scroll-mt-24 bg-white/60 px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <SectionTag>Student proof</SectionTag>
              <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-5xl">Bands moving up.</h2>
              <p className="mt-3 max-w-md text-base leading-7 text-slate-500">
                Real stories from students on the route. Add yours — it shows up here for everyone.
              </p>
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
                          {EXAM_OPTIONS.map((ex) => (
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
                          <label className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                            Band before
                          </label>
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
                          <label className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                            Band after
                          </label>
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
                        <label className="text-[11px] font-black uppercase tracking-wide text-slate-500">
                          Your story
                        </label>
                        <textarea
                          value={form.text}
                          onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
                          placeholder="What changed for you? How did the mocks and route help?"
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
      <section className="px-4 pb-20 sm:pb-28">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-slate-900 px-8 py-14 sm:px-14 sm:py-20"
        >
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-red-600/30 blur-3xl" />
          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-black leading-[1.1] tracking-tight text-white sm:text-5xl">
                Take one mock.
                <br />
                See what costs band points.
              </h2>
              <p className="mt-4 max-w-md text-base leading-7 text-slate-300">
                No guesswork. Just a clear route from your first baseline to your target band.
              </p>
              <button
                onClick={() => navigate('/register')}
                className="group mt-7 inline-flex items-center gap-2 rounded-2xl bg-red-600 px-6 py-3.5 text-sm font-bold text-white shadow-[0_14px_34px_rgba(220,38,38,0.4)] transition hover:-translate-y-0.5 hover:bg-red-700"
              >
                Start preparation
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            {/* route illustration */}
            <div className="relative hidden h-48 lg:block">
              <svg viewBox="0 0 400 180" className="h-full w-full" fill="none">
                <motion.path
                  d="M30 150 C 110 150, 110 60, 200 70 S 300 150, 370 40"
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeDasharray="6 8"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.6, ease: EASE }}
                />
                {[
                  { x: 30, y: 150, label: 'Mock' },
                  { x: 200, y: 70, label: 'Review' },
                  { x: 290, y: 120, label: 'Practice' },
                  { x: 370, y: 40, label: 'Band 8.0' },
                ].map((p, i) => (
                  <g key={p.label}>
                    <motion.circle
                      cx={p.x}
                      cy={p.y}
                      r="8"
                      fill="#0f172a"
                      stroke="#ef4444"
                      strokeWidth="3"
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.3, type: 'spring', stiffness: 300 }}
                    />
                    <text x={p.x + 12} y={p.y + 4} fill="#cbd5e1" fontSize="12" fontWeight="700">
                      {p.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-black/5 px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <BrandMark size={28} />
            <span className="font-black tracking-tight">
              Prof<span className="text-red-600">AI</span>
            </span>
          </div>
          <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Clock3 className="h-3.5 w-3.5" />
            Independent prep platform · {new Date().getFullYear()}
          </p>
          <button onClick={() => navigate('/register')} className="text-sm font-bold text-red-600 hover:text-red-700">
            Start preparation →
          </button>
        </div>
      </footer>
    </div>
  )
}
