import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Bot,
  CalendarCheck2,
  Check,
  ChevronDown,
  ClipboardCheck,
  Globe2,
  GraduationCap,
  Languages,
  Mail,
  Menu,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  X,
} from 'lucide-react'
import { BrandMark } from '@/components/brand/BrandLogo'

const EASE = [0.22, 1, 0.36, 1] as const
const SUPPORT_EMAIL = 'elyornishonboyev000@gmail.com'

const NAV_LINKS = [
  { label: 'Platform', target: 'platform' },
  { label: 'Journey', target: 'journey' },
  { label: 'Pricing', target: 'pricing' },
  { label: 'FAQ', target: 'faq' },
] as const

type IconType = ComponentType<{ className?: string }>
type Tone = 'red' | 'blue' | 'ink'

type Pillar = {
  eyebrow: string
  title: string
  body: string
  icon: IconType
  route: string
  cta: string
  tone: Tone
  items: string[]
}

const PILLARS: Pillar[] = [
  {
    eyebrow: 'Test preparation',
    title: 'Build the scores your plan requires.',
    body: 'Prepare for IELTS Academic or General Training and the Digital SAT through focused practice, full simulations and review.',
    icon: Target,
    route: '/test-preparation',
    cta: 'Explore test preparation',
    tone: 'red',
    items: ['IELTS across all four skills', 'Digital SAT Math and Reading & Writing', 'Practice, mocks and progress review'],
  },
  {
    eyebrow: 'Academic skills',
    title: 'Study in English with confidence.',
    body: 'Strengthen the reading, listening, vocabulary, writing and speaking habits that support both exams and university study.',
    icon: Languages,
    route: '/academic-skills',
    cta: 'Explore academic skills',
    tone: 'blue',
    items: ['Vocabulary and reading studios', 'Listening and shadowing practice', 'Writing and speaking labs'],
  },
  {
    eyebrow: 'University journey',
    title: 'Turn preparation into an application plan.',
    body: 'Research universities, organize next steps and keep preparation connected to the applications you want to build.',
    icon: GraduationCap,
    route: '/admission',
    cta: 'Explore university planning',
    tone: 'ink',
    items: ['University research', 'Application guidance', 'A roadmap centered on your goals'],
  },
]

const JOURNEY_STEPS = [
  { number: '01', title: 'Set your direction', body: 'Capture your target degree, destinations, timeline, budget and current academic profile.', icon: Route },
  { number: '02', title: 'Build your readiness', body: 'Prepare for required exams while strengthening the English skills behind university study.', icon: BookOpenCheck },
  { number: '03', title: 'Research your options', body: 'Compare universities and keep promising choices together as your plans become clearer.', icon: Search },
  { number: '04', title: 'Plan every next step', body: 'Move from today’s study task toward future application work inside one journey view.', icon: CalendarCheck2 },
] as const

const PROOF_POINTS = [
  {
    title: 'Complete learning workflows',
    body: 'Practice, timed tests, results and review live in connected exam arenas instead of isolated question pages.',
    icon: ClipboardCheck,
    action: 'Open test preparation',
    route: '/test-preparation',
  },
  {
    title: 'Guidance grounded in your account',
    body: 'ProfAI Coach can use your learning context to explain priorities and turn a goal into clear study actions.',
    icon: Bot,
    action: 'Meet the AI Coach',
    route: '/register',
  },
  {
    title: 'Privacy choices built in',
    body: 'Your AI conversation stays account-private, and optional analytics only starts after your permission.',
    icon: ShieldCheck,
    action: 'Start with a private account',
    route: '/register',
  },
] as const

const FREE_FEATURES = [
  '4 full-test attempts each month',
  '3 AI exam feedback requests each month',
  '1 Essay or CV review each month',
  'Basic roadmap and matching',
  'Up to 10 universities in your shortlist',
] as const

const PRO_FEATURES = [
  'Unlimited non-AI practice',
  'Up to 50 AI exam evaluations each month',
  'Up to 10 Essay or CV analyses each month',
  'Full matching and unlimited shortlist',
  'Application tracking, reminders and version history',
] as const

const FAQS = [
  {
    question: 'Is ProfAI only for IELTS preparation?',
    answer: 'No. IELTS and the Digital SAT are important parts of ProfAI, but the platform also connects academic English, university research and application planning in one student journey.',
  },
  {
    question: 'Who is the first version designed for?',
    answer: 'ProfAI v1 is designed for students aged 16 and above preparing for undergraduate study. The platform is English-only and built for applicants worldwide.',
  },
  {
    question: 'Does ProfAI submit applications for students?',
    answer: 'No. ProfAI helps you prepare, research and organize your work. You remain responsible for reviewing requirements and submitting every application through the university’s official process.',
  },
  {
    question: 'Does IELTS General Training remain available?',
    answer: 'Yes. ProfAI supports both IELTS Academic and IELTS General Training preparation alongside the Digital SAT.',
  },
  {
    question: 'Can I rely on university requirements without checking?',
    answer: 'No database should replace an official university page. Requirements and deadlines can change, so always confirm final details with the university.',
  },
  {
    question: 'Is Pro checkout available now?',
    answer: 'Not yet. Free access is available now. Pro checkout will open after private-beta and payment verification; the planned launch price is $9.99 monthly or $79.99 yearly.',
  },
] as const

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8% 0px' }}
      transition={{ duration: reduceMotion ? 0 : 0.62, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function SectionHeading({ eyebrow, title, body }: { eyebrow: string; title: string; body: string }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <span className="landing-kicker">{eyebrow}</span>
      <h2 className="mt-5 text-3xl font-black leading-[1.05] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-[3.5rem]">{title}</h2>
      <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">{body}</p>
    </div>
  )
}

function JourneyPreview() {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.78, delay: 0.16, ease: EASE }}
      className="relative mx-auto w-full max-w-[620px]"
    >
      <div className="landing-orbit landing-orbit-one" aria-hidden="true" />
      <div className="landing-orbit landing-orbit-two" aria-hidden="true" />
      <div className="landing-glass relative overflow-hidden rounded-[2rem] p-4 sm:p-6">
        <div className="relative flex items-center justify-between gap-4 border-b border-white/70 pb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-red-600">Your university journey</p>
            <p className="mt-1 text-lg font-black tracking-tight text-slate-950">One plan. Clear next steps.</p>
          </div>
          <span className="hidden items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700 sm:inline-flex">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Connected
          </span>
        </div>
        <div className="relative mt-4 grid gap-3 sm:grid-cols-2">
          <PreviewCard icon={Target} label="Prepare" title="Test readiness" body="IELTS and Digital SAT live inside their own complete arenas." tone="red" />
          <PreviewCard icon={Globe2} label="Research" title="University options" body="Keep destinations, university research and next questions in view." tone="blue" />
        </div>
        <div className="landing-glass-soft relative mt-3 flex flex-col gap-4 rounded-3xl p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white"><Sparkles className="h-5 w-5" /></span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">Today’s focus</p>
              <p className="mt-1 text-sm font-black text-slate-950">Move one priority forward</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">Preparation stays connected to your university journey.</p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-xs font-black text-white">View next step <ArrowRight className="h-3.5 w-3.5" /></span>
        </div>
      </div>
    </motion.div>
  )
}

function PreviewCard({ icon: Icon, label, title, body, tone }: { icon: IconType; label: string; title: string; body: string; tone: 'red' | 'blue' }) {
  return (
    <div className="landing-glass-soft rounded-3xl p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <span className={`flex h-10 w-10 items-center justify-center rounded-2xl text-white ${tone === 'red' ? 'bg-red-500 shadow-[0_12px_24px_rgba(239,68,68,0.28)]' : 'bg-blue-600 shadow-[0_12px_24px_rgba(37,99,235,0.25)]'}`}><Icon className="h-5 w-5" /></span>
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</span>
      </div>
      <p className="mt-5 text-base font-black text-slate-950">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  )
}

function PillarCard({ pillar, index, onOpen }: { pillar: Pillar; index: number; onOpen: () => void }) {
  const Icon = pillar.icon
  const tones = {
    red: { icon: 'bg-red-500 shadow-red-200', eyebrow: 'text-red-600', button: 'bg-red-500 hover:bg-red-600', wash: 'from-red-100/70' },
    blue: { icon: 'bg-blue-600 shadow-blue-200', eyebrow: 'text-blue-700', button: 'bg-blue-600 hover:bg-blue-700', wash: 'from-blue-100/75' },
    ink: { icon: 'bg-slate-950 shadow-slate-200', eyebrow: 'text-slate-700', button: 'bg-slate-950 hover:bg-slate-800', wash: 'from-slate-200/75' },
  }
  const tone = tones[pillar.tone]
  return (
    <Reveal delay={index * 0.07} className="h-full">
      <article className="landing-glass group relative flex h-full flex-col overflow-hidden rounded-[2rem] p-6 sm:p-7">
        <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tone.wash} via-white/25 to-transparent`} />
        <div className="relative flex items-center justify-between">
          <span className={`flex h-13 w-13 items-center justify-center rounded-2xl p-3 text-white shadow-xl ${tone.icon}`}><Icon className="h-6 w-6" /></span>
          <span className="rounded-full border border-white/80 bg-white/55 px-3 py-1.5 text-[10px] font-black tracking-[0.16em] text-slate-500">0{index + 1}</span>
        </div>
        <p className={`relative mt-7 text-[11px] font-black uppercase tracking-[0.22em] ${tone.eyebrow}`}>{pillar.eyebrow}</p>
        <h3 className="relative mt-3 text-2xl font-black leading-tight tracking-[-0.03em] text-slate-950">{pillar.title}</h3>
        <p className="relative mt-3 text-sm leading-6 text-slate-600">{pillar.body}</p>
        <ul className="relative mt-6 space-y-3">
          {pillar.items.map((item) => <li key={item} className="flex items-start gap-2.5 text-sm font-semibold leading-5 text-slate-700"><CheckBadge />{item}</li>)}
        </ul>
        <button type="button" onClick={onOpen} className={`relative mt-7 inline-flex w-fit items-center gap-2 rounded-2xl px-4 py-3 text-sm font-black text-white transition-colors ${tone.button}`}>{pillar.cta} <ArrowRight className="h-4 w-4" /></button>
      </article>
    </Reveal>
  )
}

function CheckBadge({ dark = false }: { dark?: boolean }) {
  return <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${dark ? 'bg-blue-500 text-white' : 'border border-white bg-white/75 text-slate-900 shadow-sm'}`}><Check className="h-3 w-3" strokeWidth={3} /></span>
}

function PricingCard({ name, description, price, cadence, features, featured = false, action }: { name: string; description: string; price: string; cadence: string; features: readonly string[]; featured?: boolean; action: () => void }) {
  return (
    <article className={`relative flex h-full flex-col overflow-hidden rounded-[2rem] p-6 sm:p-8 ${featured ? 'border border-slate-800 bg-slate-950 text-white shadow-[0_30px_80px_rgba(15,23,42,0.22)]' : 'landing-glass text-slate-950'}`}>
      {featured ? <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_10%,rgba(37,99,235,0.42),transparent_36%),radial-gradient(circle_at_10%_90%,rgba(239,68,68,0.2),transparent_38%)]" /> : null}
      <div className="relative flex items-start justify-between gap-4">
        <div><p className={`text-sm font-black uppercase tracking-[0.18em] ${featured ? 'text-blue-300' : 'text-red-600'}`}>{name}</p><p className={`mt-2 text-sm leading-6 ${featured ? 'text-slate-300' : 'text-slate-600'}`}>{description}</p></div>
        {featured ? <span className="shrink-0 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em]">After beta</span> : null}
      </div>
      <div className="relative mt-7 flex flex-wrap items-end gap-2"><span className="text-5xl font-black tracking-[-0.05em]">{price}</span><span className={`pb-1.5 text-sm font-semibold ${featured ? 'text-slate-400' : 'text-slate-500'}`}>{cadence}</span></div>
      <ul className="relative mt-7 flex-1 space-y-3">
        {features.map((feature) => <li key={feature} className={`flex items-start gap-3 text-sm leading-6 ${featured ? 'text-slate-200' : 'text-slate-700'}`}><CheckBadge dark={featured} />{feature}</li>)}
      </ul>
      <button type="button" onClick={action} className={`relative mt-8 inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-black transition-colors ${featured ? 'bg-white text-slate-950 hover:bg-blue-50' : 'bg-red-500 text-white hover:bg-red-600'}`}>Start with Free <ArrowRight className="h-4 w-4" /></button>
    </article>
  )
}

function FaqItem({ question, answer, open, onToggle }: { question: string; answer: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="landing-glass overflow-hidden rounded-2xl">
      <button type="button" onClick={onToggle} aria-expanded={open} className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"><span className="text-sm font-black text-slate-950 sm:text-base">{question}</span><ChevronDown className={`h-5 w-5 shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} /></button>
      <AnimatePresence initial={false}>{open ? <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: EASE }} className="overflow-hidden"><p className="border-t border-white/70 px-5 py-5 text-sm leading-7 text-slate-600 sm:px-6">{answer}</p></motion.div> : null}</AnimatePresence>
    </div>
  )
}

export default function Landing() {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const [scrolled, setScrolled] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState(0)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const goTo = (target: string) => {
    setMobileNavOpen(false)
    scrollToSection(target)
  }

  return (
    <div className="landing-page relative min-h-screen overflow-x-clip text-slate-950">
      <div className="landing-backdrop" aria-hidden="true"><div className="landing-ambient landing-ambient-red" /><div className="landing-ambient landing-ambient-blue" /><div className="landing-ambient landing-ambient-center" /></div>

      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-5">
        <div className={`landing-nav mx-auto flex max-w-7xl items-center justify-between rounded-[1.6rem] px-3.5 py-3 transition-shadow sm:px-5 ${scrolled ? 'shadow-[0_18px_50px_rgba(15,23,42,0.13)]' : ''}`}>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' })} className="relative flex items-center gap-2.5 rounded-2xl px-1.5 py-1" aria-label="ProfAI home"><BrandMark size={42} /><span className="text-xl font-black tracking-[-0.04em] sm:text-2xl">Prof<span className="text-red-500">AI</span></span></button>
          <nav className="relative hidden items-center gap-1 lg:flex" aria-label="Landing navigation">
            {NAV_LINKS.map((item) => <button key={item.target} type="button" onClick={() => goTo(item.target)} className="rounded-full px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-white/60 hover:text-slate-950">{item.label}</button>)}
            <a href={`mailto:${SUPPORT_EMAIL}?subject=ProfAI%20support`} className="rounded-full px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-white/60 hover:text-slate-950">Support</a>
          </nav>
          <div className="relative flex items-center gap-2">
            <button type="button" onClick={() => navigate('/login')} className="hidden rounded-full px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-white/70 sm:inline-flex">Sign in</button>
            <button type="button" onClick={() => navigate('/register')} className="hidden items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white shadow-[0_12px_28px_rgba(15,23,42,0.22)] hover:bg-slate-800 sm:inline-flex">Start free <ArrowRight className="h-4 w-4" /></button>
            <button type="button" onClick={() => setMobileNavOpen((value) => !value)} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/65 text-slate-800 lg:hidden" aria-label="Toggle navigation" aria-expanded={mobileNavOpen}>{mobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
          </div>
        </div>
        <AnimatePresence initial={false}>{mobileNavOpen ? <motion.nav initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.2, ease: EASE }} className="landing-nav mx-auto mt-2 max-w-7xl rounded-3xl p-3 lg:hidden" aria-label="Mobile landing navigation">
          {NAV_LINKS.map((item) => <button key={item.target} type="button" onClick={() => goTo(item.target)} className="block w-full rounded-2xl px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-white/70">{item.label}</button>)}
          <a href={`mailto:${SUPPORT_EMAIL}?subject=ProfAI%20support`} className="block rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 hover:bg-white/70">Support</a>
          <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/70 pt-3"><button type="button" onClick={() => navigate('/login')} className="rounded-2xl border border-white bg-white/65 px-4 py-3 text-sm font-black">Sign in</button><button type="button" onClick={() => navigate('/register')} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">Start free</button></div>
        </motion.nav> : null}</AnimatePresence>
      </header>

      <main className="relative z-10">
        <section className="px-4 pb-16 pt-32 sm:px-6 sm:pb-24 sm:pt-40 lg:pt-44">
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12">
            <div className="text-center lg:text-left">
              <motion.div initial={reduceMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.58, ease: EASE }} className="inline-flex max-w-full items-center gap-2 overflow-hidden rounded-full border border-white/90 bg-white/55 px-4 py-2 text-[9px] font-black uppercase tracking-[0.16em] text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:text-[10px] sm:tracking-[0.2em]"><Globe2 className="h-3.5 w-3.5 shrink-0 text-blue-600" /><span className="sm:hidden">Global undergraduate journeys</span><span className="hidden sm:inline">Built for undergraduate applicants worldwide</span></motion.div>
              <motion.h1 initial={reduceMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.7, delay: 0.06, ease: EASE }} className="mx-auto mt-7 max-w-3xl text-[2.75rem] font-black leading-[0.96] tracking-[-0.06em] sm:text-[4.6rem] lg:mx-0 lg:text-[5.25rem]">Your path to university, <span className="block text-red-500 sm:inline">connected.</span></motion.h1>
              <motion.p initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.68, delay: 0.14, ease: EASE }} className="mx-auto mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg lg:mx-0 lg:max-w-xl">ProfAI brings test preparation, academic English, university research and application planning into one personal journey—so you always know what to work on next.</motion.p>
              <motion.div initial={reduceMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.68, delay: 0.22, ease: EASE }} className="mt-8 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <button type="button" onClick={() => navigate('/register')} className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-red-500 px-6 py-4 text-sm font-black text-white shadow-[0_18px_38px_rgba(239,68,68,0.28)] transition-all hover:-translate-y-0.5 hover:bg-red-600">Build my journey <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></button>
                <button type="button" onClick={() => goTo('journey')} className="inline-flex items-center justify-center rounded-2xl border border-white bg-white/60 px-6 py-4 text-sm font-black text-slate-800 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl hover:bg-white/85">See how it works</button>
              </motion.div>
              <motion.div initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduceMotion ? 0 : 0.6, delay: 0.34 }} className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-bold text-slate-600 lg:justify-start">{['English-only v1', 'IELTS + Digital SAT', 'No card required'].map((item) => <span key={item} className="inline-flex items-center gap-1.5"><BadgeCheck className="h-4 w-4 text-blue-600" /> {item}</span>)}</motion.div>
            </div>
            <JourneyPreview />
          </div>
        </section>

        <section id="platform" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24"><div className="mx-auto max-w-7xl"><Reveal><SectionHeading eyebrow="One connected platform" title="Prepare for the whole journey—not one isolated score." body="Every part of ProfAI has a clear role: build readiness, strengthen academic skills and organize the path toward your applications." /></Reveal><div className="mt-12 grid gap-5 lg:grid-cols-3">{PILLARS.map((pillar, index) => <PillarCard key={pillar.title} pillar={pillar} index={index} onOpen={() => navigate(pillar.route)} />)}</div></div></section>

        <section id="journey" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24"><div className="mx-auto max-w-7xl"><Reveal><SectionHeading eyebrow="Your journey" title="From today’s priorities to tomorrow’s applications." body="ProfAI organizes preparation around a simple sequence, so progress in one area supports the decisions that follow." /></Reveal><div className="relative mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4"><div className="pointer-events-none absolute left-[12%] right-[12%] top-8 hidden h-px bg-gradient-to-r from-red-200 via-slate-300 to-blue-200 lg:block" />{JOURNEY_STEPS.map((step, index) => { const Icon = step.icon; return <Reveal key={step.number} delay={index * 0.08} className="relative h-full"><article className="landing-glass h-full rounded-[1.75rem] p-6"><div className="flex items-center justify-between"><span className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl text-white ${index % 2 === 0 ? 'bg-red-500' : 'bg-blue-600'}`}><Icon className="h-5 w-5" /></span><span className="text-2xl font-black text-slate-300">{step.number}</span></div><h3 className="mt-6 text-lg font-black tracking-tight">{step.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p></article></Reveal>})}</div></div></section>

        <section className="px-4 py-16 sm:px-6 sm:py-24"><Reveal className="mx-auto max-w-7xl"><div className="relative overflow-hidden rounded-[2.5rem] bg-slate-950 px-6 py-12 text-white shadow-[0_34px_90px_rgba(15,23,42,0.24)] sm:px-10 lg:px-14 lg:py-16"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_84%_20%,rgba(37,99,235,0.45),transparent_34%),radial-gradient(circle_at_12%_90%,rgba(239,68,68,0.24),transparent_38%)]" /><div className="relative grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div><span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-blue-200"><Sparkles className="h-3.5 w-3.5" /> ProfAI Coach</span><h2 className="mt-6 text-3xl font-black leading-[1.05] tracking-[-0.04em] sm:text-5xl">Guidance that turns a big goal into the next clear action.</h2><p className="mt-5 max-w-xl text-base leading-7 text-slate-300">Choose a focused coaching mode, ask with text, voice or a screenshot, and receive structured guidance without leaving your journey workspace.</p><button type="button" onClick={() => navigate('/register')} className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-sm font-black text-slate-950 hover:bg-blue-50">Start a private journey <ArrowRight className="h-4 w-4" /></button></div>
          <div className="rounded-[2rem] border border-white/15 bg-white/[0.08] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-2xl sm:p-5"><div className="flex items-center justify-between border-b border-white/10 pb-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500"><Bot className="h-5 w-5" /></span><div><p className="text-sm font-black">ProfAI Coach</p><p className="text-[11px] text-emerald-300">Account-private guidance</p></div></div><span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-slate-300 sm:block">Journey context</span></div><div className="mt-4 space-y-3"><div className="ml-auto max-w-[84%] rounded-2xl rounded-tr-md bg-blue-500 px-4 py-3 text-sm leading-6">Help me decide what to focus on this week for my university plan.</div><div className="max-w-[92%] rounded-2xl rounded-tl-md bg-white/10 px-4 py-4 text-sm leading-6 text-slate-200"><p className="font-black text-white">Your next three priorities</p><ol className="mt-3 space-y-2"><li><b className="mr-2 text-red-300">1.</b>Protect your closest deadline.</li><li><b className="mr-2 text-blue-300">2.</b>Complete one focused test-prep session.</li><li><b className="mr-2 text-emerald-300">3.</b>Record the university questions you still need to verify.</li></ol></div></div></div>
        </div></div></Reveal></section>

        <section className="px-4 py-16 sm:px-6 sm:py-24"><div className="mx-auto max-w-7xl"><Reveal><SectionHeading eyebrow="Product proof" title="Useful evidence, without inflated promises." body="ProfAI does not guarantee admission or publish invented success stories. Inspect the workflows that are available and decide whether they help your journey." /></Reveal><div className="mt-12 grid gap-5 lg:grid-cols-3">{PROOF_POINTS.map((point, index) => { const Icon = point.icon; return <Reveal key={point.title} delay={index * 0.07} className="h-full"><article className="landing-glass flex h-full flex-col rounded-[1.75rem] p-6"><span className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white ${index === 0 ? 'bg-red-500' : index === 1 ? 'bg-blue-600' : 'bg-slate-950'}`}><Icon className="h-5 w-5" /></span><h3 className="mt-6 text-xl font-black tracking-tight">{point.title}</h3><p className="mt-3 flex-1 text-sm leading-6 text-slate-600">{point.body}</p><button type="button" onClick={() => navigate(point.route)} className="mt-6 inline-flex items-center gap-2 text-sm font-black hover:text-blue-700">{point.action} <ArrowRight className="h-4 w-4" /></button></article></Reveal>})}</div></div></section>

        <section id="pricing" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24"><div className="mx-auto max-w-5xl"><Reveal><SectionHeading eyebrow="Simple pricing" title="Start free. Upgrade when the journey needs more depth." body="Free access is available now. Pro billing remains closed until private-beta and payment verification are complete." /></Reveal><div className="mt-12 grid gap-5 lg:grid-cols-2"><Reveal className="h-full"><PricingCard name="Free" description="A practical starting point for building readiness and exploring your university journey." price="$0" cadence="forever" features={FREE_FEATURES} action={() => navigate('/register')} /></Reveal><Reveal className="h-full" delay={0.08}><PricingCard name="Pro" description="Higher AI limits and the complete planning workspace for active applicants." price="$9.99" cadence="monthly · $79.99 yearly" features={PRO_FEATURES} featured action={() => navigate('/register')} /></Reveal></div><p className="mx-auto mt-5 max-w-3xl text-center text-xs leading-5 text-slate-500">Pro limits are fair-use defaults and may be adjusted before public billing opens. You will see final terms before any purchase.</p></div></section>

        <section id="faq" className="scroll-mt-28 px-4 py-16 sm:px-6 sm:py-24"><div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.75fr_1.25fr]"><Reveal><span className="landing-kicker">Clear answers</span><h2 className="mt-5 text-3xl font-black leading-[1.05] tracking-[-0.04em] sm:text-5xl">Know what ProfAI does—and what it does not do.</h2><p className="mt-5 max-w-lg text-base leading-7 text-slate-600">Still unsure? Contact support and tell us where you are in your journey.</p><a href={`mailto:${SUPPORT_EMAIL}?subject=Question%20about%20ProfAI`} className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3.5 text-sm font-black text-white hover:bg-slate-800"><Mail className="h-4 w-4" /> Email support</a></Reveal><Reveal className="space-y-3" delay={0.06}>{FAQS.map((item, index) => <FaqItem key={item.question} question={item.question} answer={item.answer} open={openFaq === index} onToggle={() => setOpenFaq((current) => current === index ? -1 : index)} />)}</Reveal></div></section>

        <section className="px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-20"><Reveal className="mx-auto max-w-7xl"><div className="landing-glass relative overflow-hidden rounded-[2.5rem] px-6 py-14 text-center sm:px-10 sm:py-20"><div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(248,113,113,0.2),transparent_32%),radial-gradient(circle_at_88%_74%,rgba(59,130,246,0.22),transparent_36%)]" /><div className="relative mx-auto max-w-3xl"><span className="landing-kicker"><Sparkles className="h-3.5 w-3.5" /> Your next step</span><h2 className="mt-6 text-3xl font-black leading-[1.03] tracking-[-0.045em] sm:text-5xl lg:text-6xl">Build a university journey you can actually follow.</h2><p className="mx-auto mt-5 max-w-xl text-base leading-7 text-slate-600">Create your free account, set your direction and let ProfAI organize the next useful action.</p><div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><button type="button" onClick={() => navigate('/register')} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-500 px-6 py-4 text-sm font-black text-white shadow-[0_18px_38px_rgba(239,68,68,0.28)] hover:bg-red-600">Start free <ArrowRight className="h-4 w-4" /></button><button type="button" onClick={() => navigate('/login')} className="inline-flex items-center justify-center rounded-2xl border border-white bg-white/65 px-6 py-4 text-sm font-black text-slate-800 hover:bg-white/90">I already have an account</button></div></div></div></Reveal></section>
      </main>

      <footer className="relative z-10 border-t border-white/70 bg-white/35 px-4 py-10 backdrop-blur-xl sm:px-6"><div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.8fr_0.8fr]"><div><div className="flex items-center gap-2.5"><BrandMark size={38} /><span className="text-xl font-black tracking-[-0.04em]">Prof<span className="text-red-500">AI</span></span></div><p className="mt-4 max-w-md text-sm leading-6 text-slate-600">A connected preparation and planning platform for undergraduate applicants worldwide.</p><p className="mt-4 text-xs font-semibold text-slate-500">Independent platform · Not affiliated with IELTS, College Board or any university.</p></div><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Explore</p><div className="mt-4 space-y-3">{NAV_LINKS.map((item) => <button key={item.target} type="button" onClick={() => goTo(item.target)} className="block text-sm font-bold text-slate-700 hover:text-blue-700">{item.label}</button>)}</div></div><div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Account & support</p><div className="mt-4 space-y-3"><button type="button" onClick={() => navigate('/register')} className="block text-sm font-bold text-slate-700 hover:text-blue-700">Create account</button><button type="button" onClick={() => navigate('/login')} className="block text-sm font-bold text-slate-700 hover:text-blue-700">Sign in</button><a href={`mailto:${SUPPORT_EMAIL}?subject=ProfAI%20support`} className="block break-all text-sm font-bold text-slate-700 hover:text-blue-700">{SUPPORT_EMAIL}</a></div></div></div><div className="mx-auto mt-9 flex max-w-7xl flex-col gap-2 border-t border-white/70 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} ProfAI. All rights reserved.</p><p>English-only undergraduate v1</p></div></footer>
    </div>
  )
}
