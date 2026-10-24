import LandingPlans from '@/features/billing/LandingPlans'
import { Fragment, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject, useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion, useScroll, useSpring, useTransform } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Flame, Menu, Play, Send, ShieldCheck, Sparkles, Target, X } from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'
import LanguageSelector from '@/components/layout/LanguageSelector'
import GoogleOneTap from '@/components/auth/GoogleOneTap'
import Testimonials from '@/components/landing/Testimonials'
import { SilverIeltsObject, SilverSatObject } from '@/components/landing/SilverObjects'
import { tourFeatures, type Copy, type TourFeature } from '@/components/landing/productTour'
import { DemoPlayer, type DemoClip, useDemoTimeline } from '@/components/landing/demo/DemoPlayer'
import { useCopy } from '@/i18n/interface'
import '@/styles/landing-arena.css'
import '@/styles/landing-showcase.css'
import '@/styles/landing-demo.css'

const SUPPORT_TELEGRAM = 'https://t.me/nishonboyev7'
const EASE = [0.22, 1, 0.36, 1] as const
const STEP_MS = 5200
const faqs = [
  { question: 'Can I prepare for both IELTS and SAT?', answer: 'Yes. Both exam arenas live in one account, with practice, full tests, results and review.' },
  { question: 'Is Ivygoo free to use?', answer: 'Yes. The Free plan is $0 forever, with monthly IELTS, SAT and AI allowances. Pro is $5.99/month and Max is $11.99/month for more tests, mocks and AI feedback. Classes require a paid plan. Saved results and vocabulary stay available.' },
  { question: 'Does Ivygoo support IELTS General Training?', answer: 'Yes. IELTS Academic and General Training preparation are both available.' },
  { question: 'Does Ivygoo submit university applications?', answer: 'No. Ivygoo helps you prepare and organize your plan. You submit applications through each university’s official process.' },
]
const insideStats: { value: number; suffix?: string; label: Copy }[] = [
  { value: 30, label: ['IELTS full mock exams', 'IELTS to‘liq mock imtihonlari', 'полных пробных IELTS'] },
  { value: 40, label: ['Digital SAT full mocks', 'Digital SAT to‘liq mocklari', 'полных пробных Digital SAT'] },
  { value: 5028, label: ['IELTS & SAT vocabulary terms', 'IELTS va SAT so‘zlari', 'слов IELTS и SAT'] },
  { value: 1506, label: ['universities to explore', 'o‘rganish uchun universitetlar', 'университетов в каталоге'] },
  { value: 300, label: ['English podcast episodes', 'inglizcha podkast epizodlari', 'эпизодов подкастов'] },
  { value: 30, label: ['study-abroad lessons', 'xorijda o‘qish darslari', 'уроков о поступлении'] },
]

function useLandingText() {
  const { i18n } = useTranslation()
  const language = (i18n.resolvedLanguage ?? i18n.language ?? 'en').slice(0, 2)
  const index = language === 'uz' ? 1 : language === 'ru' ? 2 : 0
  return (copy: Copy) => copy[index]
}

function useCountUp(target: number, active: boolean) {
  const reducedMotion = useReducedMotion()
  const [value, setValue] = useState(reducedMotion ? target : 0)
  useEffect(() => {
    if (!active || reducedMotion) { if (reducedMotion) setValue(target); return }
    let frame = 0
    const started = performance.now()
    const tick = (now: number) => {
      const progress = Math.min((now - started) / 1400, 1)
      setValue(Math.round(target * (1 - (1 - progress) ** 4)))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, reducedMotion, target])
  return value
}

/** One full-viewport chapter of the landing page. */
function Screen({ id, label, className = '', sectionRef, children }: { id: string; label: string; className?: string; sectionRef?: RefObject<HTMLElement>; children: ReactNode }) {
  return <section ref={sectionRef} id={id} data-lx-screen={label} className={`lx-screen ${className}`}>{children}</section>
}

/** Glass cards carry a soft light that follows the pointer. */
function spotlight(event: ReactPointerEvent<HTMLElement>) {
  const bounds = event.currentTarget.getBoundingClientRect()
  event.currentTarget.style.setProperty('--lx-mx', `${event.clientX - bounds.left}px`)
  event.currentTarget.style.setProperty('--lx-my', `${event.clientY - bounds.top}px`)
}

/** Headline words rise out of a mask one after another. */
function Words({ text, delay = 0 }: { text: string; delay?: number }) {
  const reducedMotion = useReducedMotion()
  return <>{text.split(' ').map((word, index) => <Fragment key={index}>{index > 0 && ' '}<span className="lx-word"><motion.span initial={reducedMotion ? false : { y: '108%', rotate: 4 }} animate={{ y: '0%', rotate: 0 }} transition={{ duration: .95, delay: delay + index * .07, ease: EASE }}>{word}</motion.span></span></Fragment>)}</>
}

// The hero reel cuts between the strongest moments of the product tour.
const HERO_MS = 4600
const heroReel: [id: string, step: number][] = [['dashboard', 0], ['reading', 2], ['listening', 2], ['sat', 2], ['speaking', 0], ['nova', 0]]

function useClips(entries: [id: string, step: number][]) {
  const t = useLandingText()
  return entries.map(([id, step]): DemoClip => {
    const feature = tourFeatures.find(item => item.id === id)!
    const point = feature.steps[step]
    return { scene: id, step, x: point.x, y: point.y, label: t(feature.label), title: t(point.title), body: t(point.body), address: feature.address }
  })
}

function Hero({ onStart, onExplore }: { onStart: () => void; onExplore: () => void }) {
  const t = useLandingText()
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const inView = useInView(stageRef, { amount: .2 })
  const clips = useClips(heroReel)
  const timeline = useDemoTimeline(clips.length, inView, HERO_MS)
  // Scrolling away tips the stage back and lifts it; the pointer tilts it gently.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  const lift = useTransform(scrollYProgress, [0, 1], [0, -90])
  const tip = useTransform(scrollYProgress, [0, 1], [0, 10])
  const pointerX = useSpring(0, { stiffness: 110, damping: 18, mass: .5 })
  const pointerY = useSpring(0, { stiffness: 110, damping: 18, mass: .5 })
  const rotateY = useTransform(pointerX, value => -6 + value * 7)
  const rotateX = useTransform([pointerY, tip], ([pointer, scroll]: number[]) => 3 - pointer * 5 + scroll)
  const tilt = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (reducedMotion || event.pointerType !== 'mouse') return
    const bounds = event.currentTarget.getBoundingClientRect()
    pointerX.set((event.clientX - bounds.left) / bounds.width - .5)
    pointerY.set((event.clientY - bounds.top) / bounds.height - .5)
  }
  const rest = () => { pointerX.set(0); pointerY.set(0) }
  const rise = (delay: number) => reducedMotion ? {} : { initial: { opacity: 0, y: 22 }, animate: { opacity: 1, y: 0 }, transition: { duration: .9, delay, ease: EASE } }
  const pop = (delay: number) => reducedMotion ? {} : { initial: { opacity: 0, scale: .7, y: 18 }, animate: { opacity: 1, scale: 1, y: 0 }, transition: { type: 'spring' as const, stiffness: 220, damping: 18, delay } }

  return <Screen id="top" label={t(['Home', 'Bosh sahifa', 'Главная'])} className="lx-hero" sectionRef={sectionRef}>
    <div className="lx-hero-grid">
      <div className="lx-hero-copy">
        <motion.span className="lx-kicker lx-kicker-spaced" {...rise(0)}>{t(['PREPARE WITH PURPOSE', 'MAQSAD BILAN TAYYORLANING', 'ГОТОВЬТЕСЬ С ЦЕЛЬЮ'])}</motion.span>
        <h1>
          <span className="lx-line"><Words text={t(['Your next score.', 'Keyingi balingiz.', 'Ваш следующий балл.'])} delay={.08} /></span>
          <span className="lx-line"><Words text={t(['Your next', 'Keyingi', 'Ваша следующая'])} delay={.3} /> <em><Words text={t(['chapter.', 'bosqichingiz.', 'глава.'])} delay={.48} /></em></span>
        </h1>
        <motion.p {...rise(.5)}>{t(['IELTS and SAT preparation, in one clear workspace.', 'IELTS va SATga tayyorgarlik — bitta qulay platformada.', 'Подготовка к IELTS и SAT — в одном понятном пространстве.'])}</motion.p>
        <motion.div className="lx-hero-actions" {...rise(.62)}>
          <button type="button" className="lx-btn lx-btn-red" onClick={onStart}>{t(['Start free', 'Bepul boshlash', 'Начать бесплатно'])} <ArrowRight size={19} /></button>
          <button type="button" className="lx-btn lx-btn-glass" onClick={onExplore}><span className="lx-btn-play"><Play size={11} fill="currentColor" /></span>{t(['Watch the tour', 'Turni ko‘rish', 'Смотреть обзор'])}</button>
        </motion.div>
        <motion.div className="lx-hero-trust" {...rise(.74)}>
          <span><Check size={15} /> {t(['IELTS Academic & General', 'IELTS Academic va General', 'IELTS Academic и General'])}</span>
          <span><Check size={15} /> Digital SAT</span>
          <span><Check size={15} /> {t(['Free plan · $0', 'Bepul tarif · $0', 'Бесплатный тариф · $0'])}</span>
        </motion.div>
      </div>
      <motion.div ref={stageRef} className="lx-hero-stage" style={reducedMotion ? undefined : { y: lift }} onPointerMove={tilt} onPointerLeave={rest}>
        <motion.div className="lx-hero-tilt" initial={reducedMotion ? false : { opacity: 0, y: 60, scale: .94 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 1.2, delay: .2, ease: EASE }} style={reducedMotion ? undefined : { rotateX, rotateY }}>
          <DemoPlayer clips={clips} index={timeline.index} nonce={timeline.nonce} playing={timeline.playing} onSeek={timeline.seek} onToggle={timeline.toggle} stepMs={HERO_MS} subtitles chapterLabels label={t(['Ivygoo product demo', 'Ivygoo platformasi namoyishi', 'Демонстрация Ivygoo'])} />
        </motion.div>
        <motion.div className="lx-float lx-float-a" {...pop(1.1)}><span className="lx-float-icon"><Target size={14} /></span><span><small>{t(['Target score', 'Maqsadli ball', 'Целевой балл'])}</small><strong>IELTS 8.5</strong></span></motion.div>
        <motion.div className="lx-float lx-float-b" {...pop(1.25)}><svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="18" /><circle cx="22" cy="22" r="18" pathLength="100" strokeDasharray="93 100" /></svg><span><strong>93%</strong><small>{t(['Toward target', 'Maqsad sari', 'К цели'])}</small></span></motion.div>
        <motion.div className="lx-float lx-float-c" {...pop(1.4)}><span className="lx-float-icon"><Flame size={14} /></span><span><strong>46</strong><small>{t(['day streak', 'kunlik seriya', 'дней подряд'])}</small></span></motion.div>
      </motion.div>
    </div>
    <div className="lx-exam-cards">
      {[
        { key: 'ielts', kicker: ['GLOBAL OPPORTUNITIES', 'GLOBAL IMKONIYATLAR', 'ГЛОБАЛЬНЫЕ ВОЗМОЖНОСТИ'] as Copy, title: 'IELTS', body: ['Build the skills, strategy and confidence for a higher IELTS score.', 'Yuqori IELTS bali uchun ko‘nikma, strategiya va ishonch hosil qiling.', 'Навыки, стратегия и уверенность для высокого балла IELTS.'] as Copy, cta: ['Explore IELTS', 'IELTSni ko‘rish', 'Смотреть IELTS'] as Copy, path: '/ielts', visual: <SilverIeltsObject /> },
        { key: 'sat', kicker: ['TOP UNIVERSITY PATHWAYS', 'NUFUZLI UNIVERSITETLARGA YO‘L', 'ПУТЬ В ТОП-УНИВЕРСИТЕТЫ'] as Copy, title: 'Digital SAT', body: ['Practice smarter. Build the reasoning skills for what’s next.', 'Aqlli mashq qiling. Kelajak uchun mantiqiy fikrlashni kuchaytiring.', 'Тренируйтесь умнее. Развивайте мышление для следующего шага.'] as Copy, cta: ['Explore Digital SAT', 'Digital SATni ko‘rish', 'Смотреть Digital SAT'] as Copy, path: '/sat', visual: <SilverSatObject /> },
      ].map((card, index) => <motion.article key={card.key} className="lx-glass lx-exam-card lx-spot" onPointerMove={spotlight} initial={reducedMotion ? false : { opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .9, delay: .8 + index * .12, ease: EASE }}>
        <div className="lx-exam-card-copy">
          <span className="lx-kicker lx-kicker-line">{t(card.kicker)}</span>
          <h2>{card.title}</h2>
          <p>{t(card.body)}</p>
          <button type="button" className="lx-btn lx-btn-red lx-btn-compact" onClick={() => navigate(card.path)}>{t(card.cta)} <ArrowRight size={17} /></button>
        </div>
        <div className="lx-exam-card-visual">{card.visual}</div>
      </motion.article>)}
    </div>
    <button type="button" className="lx-scroll-cue" onClick={onExplore} aria-label={t(['Scroll to the product tour', 'Platforma bo‘ylab sayohatga o‘tish', 'Перейти к обзору платформы'])}><span /></button>
  </Screen>
}

function StatCard({ value, label, index, active }: { value: number; label: string; index: number; active: boolean }) {
  const current = useCountUp(value, active)
  return <motion.div className="lx-glass lx-stat lx-spot" onPointerMove={spotlight} initial={{ opacity: 0, y: 30, scale: .96 }} animate={active ? { opacity: 1, y: 0, scale: 1 } : undefined} transition={{ duration: .7, delay: index * .08, ease: EASE }}>
    <strong>{current.toLocaleString('en-US')}</strong><span>{label}</span>
  </motion.div>
}

function Inside() {
  const t = useLandingText()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: .35, once: true })
  return <Screen id="inside" label={t(['Inside Ivygoo', 'Ivygoo ichida', 'Внутри Ivygoo'])} className="lx-inside">
    <div ref={ref} className="lx-inside-inner">
      <motion.div className="lx-section-head" initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : undefined} transition={{ duration: .8, ease: EASE }}>
        <span className="lx-kicker"><Sparkles size={15} /> {t(['INSIDE IVYGOO', 'IVYGOO ICHIDA', 'ВНУТРИ IVYGOO'])}</span>
        <h2>{t(['Everything you need.', 'Kerakli hamma narsa.', 'Всё, что нужно.'])} <em>{t(['Nothing you don’t.', 'Ortiqcha hech narsa yo‘q.', 'Ничего лишнего.'])}</em></h2>
        <p>{t(['Watch the real product in motion. Every chapter below plays a live demo of exactly what you will use.', 'Haqiqiy platformani harakatda ko‘ring. Quyidagi har bir bo‘lim aynan siz foydalanadigan imkoniyatning jonli namoyishini ko‘rsatadi.', 'Смотрите настоящий продукт в движении. Каждая глава ниже показывает живую демонстрацию того, чем вы будете пользоваться.'])}</p>
      </motion.div>
      <div className="lx-stat-grid">{insideStats.map((stat, index) => <StatCard key={index} value={stat.value} label={t(stat.label)} index={index} active={inView} />)}</div>
      <motion.div className="lx-chapter-chips" initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : undefined} transition={{ delay: .6, duration: .8 }}>
        {tourFeatures.map((feature, index) => <a key={feature.id} href={`#tour-${feature.id}`}><b>{String(index + 1).padStart(2, '0')}</b>{t(feature.label)}</a>)}
      </motion.div>
    </div>
  </Screen>
}

function TourStep({ title, body, state, timed, replay, onSelect }: { title: string; body: string; state: 'done' | 'active' | 'next'; timed: boolean; replay: number; onSelect: () => void }) {
  // The active rail segment fills over STEP_MS while the demo plays; passed steps stay softly lit.
  return <li className={`is-${state} ${state === 'active' && timed ? 'is-timed' : ''}`} style={{ '--lx-step-ms': `${STEP_MS}ms` } as CSSProperties}>
    <button type="button" aria-current={state === 'active' ? 'step' : undefined} onClick={onSelect}>
      <i key={state === 'active' ? replay : 'idle'} className="lx-step-fill" aria-hidden="true" />
      <strong>{title}</strong>
      <span className="lx-step-body"><span><small>{body}</small></span></span>
    </button>
  </li>
}

/** One full-screen chapter: the copy on one side and a live demo of the feature on the other. */
function FeatureScreen({ feature, index, onStart }: { feature: TourFeature; index: number; onStart: () => void }) {
  const t = useLandingText()
  const reducedMotion = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const inView = useInView(gridRef, { amount: .45 })
  const clips = useClips(feature.steps.map((_, stepIndex): [string, number] => [feature.id, stepIndex]))
  const timeline = useDemoTimeline(clips.length, inView, STEP_MS)
  const flipped = index % 2 === 1
  const number = String(index + 1).padStart(2, '0')
  const total = String(tourFeatures.length).padStart(2, '0')
  // The stage settles from a tilted, lowered pose as its chapter scrolls into place.
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'start .18'] })
  const settle = useSpring(scrollYProgress, { stiffness: 160, damping: 32, mass: .4 })
  const stageScale = useTransform(settle, [0, 1], [.86, 1])
  const stageRotateX = useTransform(settle, [0, 1], [16, 0])
  const stageRotateY = useTransform(settle, [0, 1], [flipped ? 10 : -10, 0])
  const stageY = useTransform(settle, [0, 1], [90, 0])
  const stageOpacity = useTransform(settle, [0, .45], [.25, 1])
  const { scrollYProgress: pass } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] })
  const numberY = useTransform(pass, [0, 1], [120, -120])

  return <Screen id={`tour-${feature.id}`} label={t(feature.label)} className={`lx-feature ${flipped ? 'is-flipped' : ''}`} sectionRef={sectionRef}>
    <div className="lx-feature-inner">
      <motion.span className="lx-feature-number" aria-hidden="true" style={reducedMotion ? undefined : { y: numberY }}>{number}</motion.span>
      <div ref={gridRef} className="lx-feature-grid">
        <motion.div className="lx-feature-copy" initial={reducedMotion ? false : { opacity: 0, y: 34 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .4 }} transition={{ duration: .9, ease: EASE }}>
          <span className="lx-kicker"><i>{number} / {total}</i> {t(feature.kicker)}</span>
          <h2>{t(feature.title)}</h2>
          <p>{t(feature.body)}</p>
          <ol className="lx-steps">
            {feature.steps.map((item, stepIndex) => <TourStep key={stepIndex} title={t(item.title)} body={t(item.body)} state={stepIndex < timeline.index ? 'done' : stepIndex === timeline.index ? 'active' : 'next'} timed={timeline.playing} replay={timeline.nonce} onSelect={() => timeline.seek(stepIndex)} />)}
          </ol>
          <button type="button" className="lx-text-link" onClick={onStart}>{t(['Try it free', 'Bepul sinab ko‘ring', 'Попробовать бесплатно'])} <ArrowRight size={17} /></button>
        </motion.div>
        <motion.div className="lx-feature-stage" style={reducedMotion ? undefined : { scale: stageScale, rotateX: stageRotateX, rotateY: stageRotateY, y: stageY, opacity: stageOpacity }}>
          <DemoPlayer clips={clips} index={timeline.index} nonce={timeline.nonce} playing={timeline.playing} onSeek={timeline.seek} onToggle={timeline.toggle} stepMs={STEP_MS} className="lx-tour-frame" label={t(feature.label)} />
        </motion.div>
      </div>
    </div>
  </Screen>
}

function ScrollRail({ label }: { label: string }) {
  const [screens, setScreens] = useState<{ id: string; label: string }[]>([])
  const [active, setActive] = useState('top')
  useEffect(() => {
    const elements = [...document.querySelectorAll<HTMLElement>('[data-lx-screen]')]
    setScreens(elements.map(element => ({ id: element.id, label: element.dataset.lxScreen ?? '' })))
    // The chapter crossing a thin band at 45% of the viewport is the current one.
    const observer = new IntersectionObserver(entries => {
      const crossing = entries.find(entry => entry.isIntersecting)
      if (crossing) setActive(crossing.target.id)
    }, { rootMargin: '-45% 0px -54% 0px' })
    elements.forEach(element => observer.observe(element))
    return () => observer.disconnect()
  }, [label])
  return <nav className="lx-rail" aria-label={label}>
    {screens.map(screen => <a key={screen.id} href={`#${screen.id}`} className={active === screen.id ? 'is-active' : ''} aria-current={active === screen.id ? 'true' : undefined}><span>{screen.label}</span><i /></a>)}
  </nav>
}

export default function Landing() {
  const { c } = useCopy()
  const t = useLandingText()
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [scrolled, setScrolled] = useState(false)
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: .3 })

  useEffect(() => {
    let frame = 0
    const update = () => { frame = 0; setScrolled(window.scrollY > 16) }
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); window.cancelAnimationFrame(frame) }
  }, [])
  const start = () => navigate('/register')
  const scrollTo = (id: string) => {
    setMobileMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })
  }
  const navItems: { label: string; id: string }[] = [
    { label: c('IELTS & SAT'), id: 'inside' },
    { label: t(['Features', 'Imkoniyatlar', 'Возможности']), id: `tour-${tourFeatures[0].id}` },
    { label: c('Comments'), id: 'comments' },
    { label: c('Plans'), id: 'plans' },
    { label: c('FAQ'), id: 'faq' },
  ]

  return <div className="landing-arena-page lx-page">
    <GoogleOneTap />
    <motion.div className="lx-progress" style={{ scaleX: progress }} aria-hidden="true" />
    <div className="lx-backdrop" aria-hidden="true"><i /><i /><i /></div>
    <header className={`lx-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="lx-nav">
        <button type="button" className="lx-logo" aria-label={c('Ivygoo home')} onClick={() => scrollTo('top')}><BrandLogo height={44} /></button>
        <nav className="lx-nav-links" aria-label={c('Main navigation')}>{navItems.map(({ label, id }) => <button type="button" key={id} onClick={() => scrollTo(id)}>{label}</button>)}</nav>
        <div className="lx-nav-actions">
          <div className="lx-language"><LanguageSelector /></div>
          <button type="button" className="lx-signin" onClick={() => navigate('/login')}>{c('Sign in')}</button>
          <button type="button" className="lx-btn lx-btn-red lx-btn-small" onClick={start}>{c('Start free')}</button>
          <button type="button" className="lx-menu-toggle" aria-label={c(mobileMenuOpen ? 'Close menu' : 'Open menu')} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(value => !value)}>{mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}</button>
        </div>
      </div>
      {mobileMenuOpen && <nav className="lx-mobile-menu" aria-label={c('Mobile navigation')}>{navItems.map(({ label, id }) => <button type="button" key={id} onClick={() => scrollTo(id)}>{label}</button>)}<div className="lx-mobile-language"><LanguageSelector /></div><button type="button" onClick={() => { setMobileMenuOpen(false); navigate('/login') }}>{c('Sign in')}</button><button type="button" className="is-primary" onClick={start}>{c('Start free')} <ArrowRight size={17} /></button></nav>}
    </header>
    <ScrollRail label={t(["Page sections", "Sahifa bo‘limlari", "Разделы страницы"])} />

    <main>
      <Hero onStart={start} onExplore={() => scrollTo('inside')} />
      <Inside />
      {tourFeatures.map((feature, index) => <FeatureScreen key={feature.id} feature={feature} index={index} onStart={start} />)}

      <Screen id="voices" label={c('Comments')} className="lx-voices"><Testimonials /></Screen>
      <Screen id="plans" label={c('Plans')} className="lx-plans"><div className="lx-plans-inner"><LandingPlans /></div></Screen>

      <Screen id="faq" label={c('FAQ')} className="lx-final">
        <div className="lx-faq lx-glass">
          <div className="lx-faq-intro">
            <span className="lx-kicker"><ShieldCheck size={15} /> {c('GOOD TO KNOW')}</span>
            <h2>{c('Questions before you begin?')}</h2>
            <p>{c('Get a clear picture of what Ivygoo offers, then take your first step.')}</p>
            <a href={SUPPORT_TELEGRAM} target="_blank" rel="noopener noreferrer" className="lx-support"><Send size={16} /> {c('Contact support')} <ArrowUpRight size={16} /></a>
          </div>
          <div className="lx-faq-list">{faqs.map(({ question, answer }, index) => <div className={`lx-faq-item${openFaq === index ? ' is-open' : ''}`} key={question}>
            <h3><button id={`landing-faq-question-${index}`} type="button" aria-expanded={openFaq === index} aria-controls={`landing-faq-${index}`} onClick={() => setOpenFaq(openFaq === index ? null : index)}><span>{c(question)}</span><ChevronDown size={19} /></button></h3>
            <motion.div id={`landing-faq-${index}`} role="region" aria-labelledby={`landing-faq-question-${index}`} aria-hidden={openFaq !== index} initial={false} animate={{ height: openFaq === index ? 'auto' : 0, opacity: openFaq === index ? 1 : 0 }} transition={{ duration: reducedMotion ? 0 : .3, ease: EASE }} className="lx-faq-answer"><p>{c(answer)}</p></motion.div>
          </div>)}</div>
        </div>
        <div className="lx-cta">
          <div><span className="lx-kicker">{c('READY WHEN YOU ARE')}</span><h2>{c('Your next chapter starts with one step.')}</h2><p>{c('Build momentum in IELTS, SAT and everything that comes after.')}</p></div>
          <button type="button" onClick={start} className="lx-btn lx-btn-light">{c('Get started free')} <ArrowRight size={19} /></button>
        </div>
        <footer className="lx-footer">
          <div className="lx-footer-brand"><BrandLogo height={42} /><small>{c('Preparation and planning for the journey ahead.')}</small></div>
          <nav aria-label={c('Footer navigation')}>{navItems.map(({ label, id }) => <button type="button" key={id} onClick={() => scrollTo(id)}>{label}</button>)}<a href={SUPPORT_TELEGRAM} target="_blank" rel="noopener noreferrer">Telegram</a></nav>
          <p>© {new Date().getFullYear()} Ivygoo. {c('All rights reserved.')} · {c('Independent platform · Not affiliated with IELTS, College Board or any university.')}</p>
        </footer>
      </Screen>
    </main>
  </div>
}
