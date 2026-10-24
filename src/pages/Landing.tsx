import LandingPlans from '@/features/billing/LandingPlans'
import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react'
import { motion, useInView, useReducedMotion, useScroll, useSpring } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Flame, Menu, Send, ShieldCheck, Sparkles, Target, X } from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'
import LanguageSelector from '@/components/layout/LanguageSelector'
import GoogleOneTap from '@/components/auth/GoogleOneTap'
import Testimonials from '@/components/landing/Testimonials'
import { SilverIeltsObject, SilverSatObject } from '@/components/landing/SilverObjects'
import { tourFeatures, type Copy, type TourFeature } from '@/components/landing/productTour'
import { useCopy } from '@/i18n/interface'
import '@/styles/landing-arena.css'
import '@/styles/landing-showcase.css'

const SUPPORT_TELEGRAM = 'https://t.me/nishonboyev7'
const EASE = [0.22, 1, 0.36, 1] as const
const ZOOM = 1.18
const STEP_MS = 4200
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

/** One full-viewport chapter. The page pages between these on larger screens. */
function Screen({ id, label, className = '', children }: { id: string; label: string; className?: string; children: ReactNode }) {
  return <section id={id} data-lx-screen={label} className={`lx-screen ${className}`}>{children}</section>
}

function BrowserFrame({ src, alt, address, className = '', children, eager = false, style }: { src: string; alt: string; address: string; className?: string; children?: ReactNode; eager?: boolean; style?: CSSProperties }) {
  return <div className={`lx-browser ${className}`} style={style}>
    <div className="lx-browser-bar" aria-hidden="true"><span /><span /><span /><em>{address}</em></div>
    <div className="lx-browser-view">
      <img src={src} alt={alt} width={1800} height={1125} loading={eager ? 'eager' : 'lazy'} decoding="async" draggable={false} />
      {children}
    </div>
  </div>
}

function Hero({ onStart, onExplore }: { onStart: () => void; onExplore: () => void }) {
  const t = useLandingText()
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const rise = (delay: number) => reducedMotion ? {} : { initial: { opacity: 0, y: 26 }, animate: { opacity: 1, y: 0 }, transition: { duration: .8, delay, ease: EASE } }
  return <Screen id="top" label={t(['Home', 'Bosh sahifa', 'Главная'])} className="lx-hero">
    <div className="lx-hero-grid">
      <div className="lx-hero-copy">
        <motion.span className="lx-kicker lx-kicker-spaced" {...rise(0)}>{t(['PREPARE WITH PURPOSE', 'MAQSAD BILAN TAYYORLANING', 'ГОТОВЬТЕСЬ С ЦЕЛЬЮ'])}</motion.span>
        <motion.h1 {...rise(.08)}>{t(['Your next score.', 'Keyingi balingiz.', 'Ваш следующий балл.'])}<br />{t(['Your next', 'Keyingi', 'Ваша следующая'])} <em>{t(['chapter.', 'bosqichingiz.', 'глава.'])}</em></motion.h1>
        <motion.p {...rise(.16)}>{t(['IELTS and SAT preparation, in one clear workspace.', 'IELTS va SATga tayyorgarlik — bitta qulay platformada.', 'Подготовка к IELTS и SAT — в одном понятном пространстве.'])}</motion.p>
        <motion.div className="lx-hero-actions" {...rise(.24)}>
          <button type="button" className="lx-btn lx-btn-red" onClick={onStart}>{t(['Start free', 'Bepul boshlash', 'Начать бесплатно'])} <ArrowRight size={19} /></button>
          <button type="button" className="lx-btn lx-btn-glass" onClick={onExplore}>{t(['Explore IELTS & SAT', 'IELTS va SATni ko‘rish', 'Смотреть IELTS и SAT'])} <ArrowRight size={19} /></button>
        </motion.div>
        <motion.div className="lx-hero-trust" {...rise(.32)}>
          <span><Check size={15} /> {t(['IELTS Academic & General', 'IELTS Academic va General', 'IELTS Academic и General'])}</span>
          <span><Check size={15} /> Digital SAT</span>
          <span><Check size={15} /> {t(['7 days free · $0', '7 kun bepul · $0', '7 дней бесплатно · $0'])}</span>
        </motion.div>
      </div>
      <motion.div className="lx-hero-stage" initial={reducedMotion ? false : { opacity: 0, rotateY: -18, rotateX: 8, y: 50 }} animate={{ opacity: 1, rotateY: -6, rotateX: 3, y: 0 }} transition={{ duration: 1.1, delay: .15, ease: EASE }}>
        <BrowserFrame src="/assets/landing/dashboard-ivygoo-v2.jpg" alt={t(['Ivygoo learning dashboard', 'Ivygoo boshqaruv paneli', 'Панель Ivygoo'])} address="ivygoo.com/dashboard" eager />
        <div className="lx-float lx-float-a"><Target size={17} /><span><small>{t(['Target score', 'Maqsadli ball', 'Целевой балл'])}</small><strong>IELTS 8.5</strong></span></div>
        <div className="lx-float lx-float-b"><svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="18" /><circle cx="22" cy="22" r="18" pathLength="100" strokeDasharray="93 100" /></svg><span><strong>93%</strong><small>{t(['Toward target', 'Maqsad sari', 'К цели'])}</small></span></div>
        <div className="lx-float lx-float-c"><Flame size={17} /><span><strong>46</strong><small>{t(['day streak', 'kunlik seriya', 'дней подряд'])}</small></span></div>
      </motion.div>
    </div>
    <div className="lx-exam-cards">
      {[
        { key: 'ielts', kicker: ['GLOBAL OPPORTUNITIES', 'GLOBAL IMKONIYATLAR', 'ГЛОБАЛЬНЫЕ ВОЗМОЖНОСТИ'] as Copy, title: 'IELTS', body: ['Build the skills, strategy and confidence for a higher IELTS score.', 'Yuqori IELTS bali uchun ko‘nikma, strategiya va ishonch hosil qiling.', 'Навыки, стратегия и уверенность для высокого балла IELTS.'] as Copy, cta: ['Explore IELTS', 'IELTSni ko‘rish', 'Смотреть IELTS'] as Copy, path: '/ielts', visual: <SilverIeltsObject /> },
        { key: 'sat', kicker: ['TOP UNIVERSITY PATHWAYS', 'NUFUZLI UNIVERSITETLARGA YO‘L', 'ПУТЬ В ТОП-УНИВЕРСИТЕТЫ'] as Copy, title: 'Digital SAT', body: ['Practice smarter. Build the reasoning skills for what’s next.', 'Aqlli mashq qiling. Kelajak uchun mantiqiy fikrlashni kuchaytiring.', 'Тренируйтесь умнее. Развивайте мышление для следующего шага.'] as Copy, cta: ['Explore Digital SAT', 'Digital SATni ko‘rish', 'Смотреть Digital SAT'] as Copy, path: '/sat', visual: <SilverSatObject /> },
      ].map((card, index) => <motion.article key={card.key} className="lx-glass lx-exam-card" initial={reducedMotion ? false : { opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .8, delay: .42 + index * .1, ease: EASE }}>
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
  return <motion.div className="lx-glass lx-stat" initial={{ opacity: 0, y: 30, scale: .96 }} animate={active ? { opacity: 1, y: 0, scale: 1 } : undefined} transition={{ duration: .7, delay: index * .08, ease: EASE }}>
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
        <p>{t(['Scroll through the real product. Each screen below is taken from Ivygoo and shows exactly what you will use.', 'Haqiqiy platforma bo‘ylab aylaning. Quyidagi har bir ekran Ivygoo’dan olingan va aynan nimadan foydalanishingizni ko‘rsatadi.', 'Пролистайте настоящий продукт. Каждый экран ниже взят из Ivygoo и показывает то, чем вы будете пользоваться.'])}</p>
      </motion.div>
      <div className="lx-stat-grid">{insideStats.map((stat, index) => <StatCard key={index} value={stat.value} label={t(stat.label)} index={index} active={inView} />)}</div>
      <motion.div className="lx-chapter-chips" initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : undefined} transition={{ delay: .6, duration: .8 }}>
        {tourFeatures.map((feature, index) => <a key={feature.id} href={`#tour-${feature.id}`}><b>{String(index + 1).padStart(2, '0')}</b>{t(feature.label)}</a>)}
      </motion.div>
    </div>
  </Screen>
}

function TourStep({ title, body, state, timed, onSelect }: { title: string; body: string; state: 'done' | 'active' | 'next'; timed: boolean; onSelect: () => void }) {
  // The active rail segment fills over STEP_MS while the tour plays; passed steps stay softly lit.
  return <li className={`is-${state} ${state === 'active' && timed ? 'is-timed' : ''}`} style={{ '--lx-step-ms': `${STEP_MS}ms` } as CSSProperties}>
    <button type="button" aria-current={state === 'active' ? 'step' : undefined} onClick={onSelect}>
      <i className="lx-step-fill" aria-hidden="true" />
      <strong>{title}</strong>
      <span className="lx-step-body"><span><small>{body}</small></span></span>
    </button>
  </li>
}

/** One full-screen chapter. Its steps play on their own, so one scroll always moves to the next chapter. */
function FeatureScreen({ feature, index, onStart }: { feature: TourFeature; index: number; onStart: () => void }) {
  const t = useLandingText()
  const reducedMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: .5 })
  const count = feature.steps.length
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const timed = inView && !paused && !reducedMotion
  useEffect(() => {
    if (!timed) return
    const timer = window.setTimeout(() => setActive(value => (value + 1) % count), STEP_MS)
    return () => window.clearTimeout(timer)
  }, [active, count, timed])
  useEffect(() => { if (!inView) setActive(0) }, [inView])
  const flipped = index % 2 === 1
  const step = feature.steps[active]
  const number = String(index + 1).padStart(2, '0')
  const total = String(tourFeatures.length).padStart(2, '0')
  // The screenshot magnifies around the active hotspot; other markers follow the same transform.
  const scale = reducedMotion ? 1 : ZOOM
  const zoomed = (point: number, origin: number) => origin + (point - origin) * scale
  const zoom = { '--lx-zoom-x': `${step.x}%`, '--lx-zoom-y': `${step.y}%`, '--lx-zoom': scale } as CSSProperties

  return <Screen id={`tour-${feature.id}`} label={t(feature.label)} className={`lx-feature ${flipped ? 'is-flipped' : ''}`}>
    <div className="lx-feature-inner">
      <span className="lx-feature-number" aria-hidden="true">{number}</span>
      <div ref={ref} className="lx-feature-grid" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocusCapture={() => setPaused(true)} onBlurCapture={() => setPaused(false)}>
        <motion.div className="lx-feature-copy" initial={reducedMotion ? false : { opacity: 0, x: flipped ? 50 : -50 }} animate={inView || reducedMotion ? { opacity: 1, x: 0 } : undefined} transition={{ duration: .85, ease: EASE }}>
          <span className="lx-kicker"><i>{number} / {total}</i> {t(feature.kicker)}</span>
          <h2>{t(feature.title)}</h2>
          <p>{t(feature.body)}</p>
          <ol className="lx-steps">
            {feature.steps.map((item, stepIndex) => <TourStep key={stepIndex} title={t(item.title)} body={t(item.body)} state={stepIndex < active ? 'done' : stepIndex === active ? 'active' : 'next'} timed={timed} onSelect={() => setActive(stepIndex)} />)}
          </ol>
          <button type="button" className="lx-text-link" onClick={onStart}>{t(['Try it free', 'Bepul sinab ko‘ring', 'Попробовать бесплатно'])} <ArrowRight size={17} /></button>
        </motion.div>
        <motion.div className="lx-feature-stage" initial={reducedMotion ? false : { opacity: 0, y: 70, rotateY: flipped ? 16 : -16, rotateX: 6, scale: .92 }} animate={inView || reducedMotion ? { opacity: 1, y: 0, rotateY: 0, rotateX: 0, scale: 1 } : undefined} transition={{ duration: 1.05, ease: EASE }}>
          <BrowserFrame src={feature.image} alt={t(feature.alt)} address={feature.address} className="lx-tour-frame" style={zoom}>
            <div className="lx-hotspots" aria-hidden="true">
              {feature.steps.map((item, stepIndex) => <button key={stepIndex} type="button" tabIndex={-1} className={`lx-hotspot ${stepIndex === active ? 'is-active' : ''}`} style={{ left: `${zoomed(item.x, step.x)}%`, top: `${zoomed(item.y, step.y)}%` }} onClick={() => setActive(stepIndex)}>
                <i />
              </button>)}
              <div className={`lx-hotspot-anchor ${step.x > 58 ? 'is-left' : ''} ${step.y > 62 ? 'is-up' : ''}`} style={{ left: `${step.x}%`, top: `${step.y}%` }}>
                <motion.div key={active} className="lx-hotspot-card" initial={reducedMotion ? false : { opacity: 0, y: 8, scale: .94 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .4, delay: reducedMotion ? 0 : .25, ease: EASE }}>
                  <strong>{t(step.title)}</strong><small>{t(step.body)}</small>
                </motion.div>
              </div>
            </div>
          </BrowserFrame>
          {feature.float && <motion.figure className="lx-float-shot" initial={reducedMotion ? false : { opacity: 0, y: 40, x: flipped ? -30 : 30 }} animate={inView || reducedMotion ? { opacity: 1, y: 0, x: 0 } : undefined} transition={{ duration: .9, delay: .35, ease: EASE }}>
            <img src={feature.float.image} alt={t(feature.float.alt)} width={1800} height={1125} loading="lazy" decoding="async" />
          </motion.figure>}
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
