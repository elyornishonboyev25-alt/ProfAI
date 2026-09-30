import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight, ArrowUpRight, BookOpen, Calculator, Check, ChevronDown,
  CirclePlay, GraduationCap, Headphones, Menu, Mic2, PenLine, ShieldCheck,
  Sparkles, Target, X, Gift, Star, Zap, TrendingUp, Crown,
} from 'lucide-react'
import { BrandMark } from '@/components/brand/BrandLogo'
import LanguageSelector from '@/components/layout/LanguageSelector'
import { StudyIllustration } from '@/components/visuals/ArenaVisuals'
import WelcomeGift from '@/components/landing/WelcomeGift'
import { useCopy } from '@/i18n/interface'
import { premiumLanguage } from '@/i18n/premium'
import { isPublicFeatureEnabled } from '@/config/featureFlags'
import '@/styles/landing-arena.css'

const guestDiagnosticEnabled = isPublicFeatureEnabled('guestDiagnostic')
const SUPPORT_EMAIL = 'support@profai.uz'
const navItems = [
  { label: 'IELTS & SAT', id: 'exams' },
  { label: 'How it works', id: 'how-it-works' },
  { label: 'Plans', id: 'plans' },
  { label: 'FAQ', id: 'faq' },
] as const

const ieltsSkills = [
  { label: 'Listening', icon: Headphones, variant: 'ielts-listening' as const },
  { label: 'Reading', icon: BookOpen, variant: 'ielts-reading' as const },
  { label: 'Writing', icon: PenLine, variant: 'ielts-writing' as const },
  { label: 'Speaking', icon: Mic2, variant: 'ielts-speaking' as const },
]

const faqs = [
  { question: 'Can I prepare for both IELTS and SAT?', answer: 'Yes. Both exam arenas live in one account, with practice, full tests, results and review.' },
  { question: 'Is there a free plan?', answer: 'Yes. Every new account receives one month of full Premium access for free. No card is required. After that, you can choose a plan.' },
  { question: 'What happens after the free month?', answer: 'Your welcome Premium access ends after one month. There is no automatic charge or renewal. Choose a plan whenever you want to continue.' },
  { question: 'Does ProfAI support IELTS General Training?', answer: 'Yes. IELTS Academic and General Training preparation are both available.' },
  { question: 'Does ProfAI submit university applications?', answer: 'No. ProfAI helps you prepare and organize your plan. You submit applications through each university’s official process.' },
]

function SectionIntro({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  const { c } = useCopy()
  return <div className="landing-arena-section-intro">
    <span className="landing-arena-eyebrow"><Sparkles size={14} /> {c(eyebrow)}</span>
    <h2>{c(title)}</h2>
    <p>{c(description)}</p>
  </div>
}

function ArenaPreview() {
  const { c } = useCopy()
  const [track, setTrack] = useState<'ielts' | 'sat'>('ielts')
  const reducedMotion = useReducedMotion()
  const isIelts = track === 'ielts'

  return <div className="landing-arena-preview" aria-label={c('IELTS and SAT workspace preview')}>
    <div className="landing-arena-preview-top">
      <div className="landing-arena-preview-brand"><span className="landing-arena-preview-brand-icon"><BrandMark size={28} /></span><span>ProfAI <b>{c('workspace')}</b></span></div>
      <span className="landing-arena-preview-live"><i /> {c('YOUR PREPARATION SPACE')}</span>
    </div>
    <div className="landing-arena-preview-tabs" role="tablist" aria-label={c('Exam preview')}>
      <button type="button" role="tab" aria-selected={isIelts} className={isIelts ? 'is-active' : ''} onClick={() => setTrack('ielts')}>{c('IELTS Arena')}</button>
      <button type="button" role="tab" aria-selected={!isIelts} className={!isIelts ? 'is-active' : ''} onClick={() => setTrack('sat')}>Digital SAT</button>
    </div>
    <div className="landing-arena-preview-content" role="tabpanel">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div key={track} initial={reducedMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reducedMotion ? undefined : { opacity: 0, y: -8 }} transition={{ duration: reducedMotion ? 0 : 0.2 }}>
          <div className="landing-arena-preview-feature">
            <div>
              <span className="landing-arena-preview-kicker">{c(isIelts ? 'FOUR SKILLS. ONE PLACE.' : 'TWO SECTIONS. ONE GOAL.')}</span>
              <h3>{c(isIelts ? 'Your IELTS journey, clearly mapped.' : 'Build confidence for test day.')}</h3>
              <p>{c(isIelts ? 'Practice every skill, take full mocks and learn from each answer.' : 'Work through Math and Reading & Writing with focused review.')}</p>
            </div>
            <div className="landing-arena-preview-emblem" aria-hidden="true">{isIelts ? <Headphones size={38} /> : <Calculator size={38} />}</div>
          </div>
          <div className="landing-arena-preview-tiles">
            {(isIelts ? ieltsSkills : [
              { label: 'Math', icon: Calculator, variant: 'sat-math' as const },
              { label: 'Reading & Writing', icon: BookOpen, variant: 'sat-reading' as const },
            ]).map(({ label, icon: Icon, variant }) => <div className="landing-arena-preview-tile" key={label}>
              <div className="landing-arena-preview-tile-visual"><StudyIllustration variant={variant} compact /></div>
              <span><Icon size={15} /> {c(label)}</span>
            </div>)}
          </div>
          <div className="landing-arena-preview-foot"><span><Check size={14} /> {c('Focused practice')}</span><span><Check size={14} /> {c('Full tests')}</span><span><Check size={14} /> {c('Answer review')}</span></div>
        </motion.div>
      </AnimatePresence>
    </div>
  </div>
}

export default function Landing() {
  const { c, language } = useCopy()
  const uiLanguage = premiumLanguage(language)
  const navigate = useNavigate()
  const reducedMotion = useReducedMotion()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const start = () => navigate(guestDiagnosticEnabled ? '/diagnostic' : '/register')
  const scrollTo = (id: string) => {
    setMobileMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  return <div className="landing-arena-page">
    <div className="landing-arena-backdrop" aria-hidden="true" />
    <WelcomeGift onClaim={() => navigate('/register')} />
    <div className="landing-arena-announcement"><span><Sparkles size={14} /> {c('NEW HERE? YOUR FIRST MONTH OF PREMIUM IS FREE')}</span><button type="button" onClick={start}>{c('Claim your gift')} <ArrowRight size={14} /></button></div>
    <header className="landing-arena-header">
      <div className="landing-arena-nav">
        <button type="button" className="landing-arena-logo" aria-label={c('ProfAI home')} onClick={() => window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' })}><BrandMark size={39} /><span>Prof<span>AI</span></span></button>
        <nav className="landing-arena-nav-links" aria-label={c('Main navigation')}>{navItems.map(({ label, id }) => <button type="button" key={id} onClick={() => scrollTo(id)}>{c(label)}</button>)}</nav>
        <div className="landing-arena-nav-actions"><div className="landing-arena-language"><LanguageSelector /></div><button type="button" className="landing-arena-signin" onClick={() => navigate('/login')}>{c('Sign in')}</button><button type="button" className="landing-arena-button landing-arena-button-small" onClick={start}>{c('Start free')} <ArrowRight size={16} /></button><button type="button" className="landing-arena-menu-toggle" aria-label={c(mobileMenuOpen ? 'Close menu' : 'Open menu')} aria-expanded={mobileMenuOpen} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>{mobileMenuOpen ? <X size={21} /> : <Menu size={21} />}</button></div>
      </div>
      {mobileMenuOpen && <nav className="landing-arena-mobile-menu" aria-label={c('Mobile navigation')}>{navItems.map(({ label, id }) => <button type="button" key={id} onClick={() => scrollTo(id)}>{c(label)}</button>)}<button type="button" onClick={() => { setMobileMenuOpen(false); navigate('/login') }}>{c('Sign in')}</button><button type="button" onClick={start}>{c('Start free')} <ArrowRight size={16} /></button></nav>}
    </header>

    <main>
      <section className="landing-arena-hero">
        <div className="landing-arena-hero-copy">
          <motion.span initial={reducedMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="landing-arena-eyebrow"><span className="landing-arena-pulse" /> {c('YOUR NEXT SCORE STARTS HERE')}</motion.span>
          <motion.h1 initial={reducedMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>{c('The future you want')}<br />{c('starts with')} <span>{c('the work you do today.')}</span></motion.h1>
          <motion.p initial={reducedMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="landing-arena-hero-description">{c('One beautifully focused space for IELTS and Digital SAT. Learn with purpose, practice with confidence, and see every step of your progress.')}</motion.p>
          <motion.div initial={reducedMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }} className="landing-arena-hero-actions"><button type="button" className="landing-arena-button" onClick={start}>{c('Start with 1 month free')} <ArrowRight size={19} /></button><button type="button" className="landing-arena-button-outline" onClick={() => scrollTo('exams')}><CirclePlay size={19} /> {c('Explore the platform')}</button></motion.div>
          <div className="landing-arena-hero-offer"><span><Gift size={19} /></span><div><strong>{c('Full Premium, yours for the first month')}</strong><small>{c('Automatically unlocked when you create an account. No payment details.')}</small></div><ArrowUpRight size={18} /></div>
          <div className="landing-arena-hero-trust"><span><Check size={15} /> {c('IELTS Academic & General')}</span><span><Check size={15} /> Digital SAT</span><span><Check size={15} /> {c('Your progress in one place')}</span></div>
        </div>
        <ArenaPreview />
      </section>

      <div className="landing-arena-proof" aria-label={c('Platform highlights')}><div><Star size={21} /><span><strong>{c('One workspace')}</strong><small>{c('Everything in its place')}</small></span></div><div><Zap size={21} /><span><strong>{c('Practice with purpose')}</strong><small>{c('IELTS and Digital SAT')}</small></span></div><div><TrendingUp size={21} /><span><strong>{c('See your progress')}</strong><small>{c('From every attempt')}</small></span></div><div><Crown size={21} /><span><strong>{c('Premium from day one')}</strong><small>{c('Your first month is free')}</small></span></div></div>

      <section id="exams" className="landing-arena-section landing-arena-exams">
        <SectionIntro eyebrow="CHOOSE YOUR ARENA" title="Serious preparation, built around your exam." description="Focused spaces for the two exams that shape your next step. Each one brings practice, tests and review into a clear flow." />
        <div className="landing-arena-exam-grid">
          <article className="landing-arena-exam-card landing-arena-exam-card-red"><div className="landing-arena-exam-head"><span>{c('01 / ENGLISH PROFICIENCY')}</span><span className="landing-arena-exam-icon"><Headphones size={24} /></span></div><h3>IELTS <em>{c('Arena')}</em></h3><p>{c('One place for all four skills. Prepare with focused practice and full mock tests for Academic or General Training.')}</p><div className="landing-arena-exam-chips"><span>{c('Listening')}</span><span>{c('Reading')}</span><span>{c('Writing')}</span><span>{c('Speaking')}</span></div><div className="landing-arena-exam-visual"><StudyIllustration variant="ielts-listening" /><div><strong>{c('Four skills')}</strong><small>{c('Practice → test → review')}</small></div></div><button type="button" onClick={() => navigate('/ielts')} className="landing-arena-exam-link">{c('Explore IELTS')} <ArrowUpRight size={19} /></button></article>
          <article className="landing-arena-exam-card landing-arena-exam-card-blue"><div className="landing-arena-exam-head"><span>{c('02 / UNIVERSITY ADMISSIONS')}</span><span className="landing-arena-exam-icon"><Calculator size={24} /></span></div><h3>Digital SAT <em>{c('Arena')}</em></h3><p>{c('Sharpen Math and Reading & Writing, work through digital practice tests, and review where you can improve.')}</p><div className="landing-arena-exam-chips"><span>{c('Math')}</span><span>{c('Reading & Writing')}</span><span>{c('Full tests')}</span></div><div className="landing-arena-exam-visual"><StudyIllustration variant="sat-math" /><div><strong>{c('Two sections')}</strong><small>{c('Practice → test → review')}</small></div></div><button type="button" onClick={() => navigate('/sat')} className="landing-arena-exam-link">{c('Explore SAT')} <ArrowUpRight size={19} /></button></article>
        </div>
      </section>

      <section id="how-it-works" className="landing-arena-section landing-arena-workflow">
        <SectionIntro eyebrow="A BETTER WAY TO PREPARE" title="From practice to progress, without losing your way." description="A simple rhythm that helps you turn each study session into a clear next step." />
        <div className="landing-arena-steps">{[
          { number: '01', icon: Target, title: 'Find your focus', body: 'Choose an exam, skill or section that matters for your goal.' },
          { number: '02', icon: PenLine, title: 'Put in the work', body: 'Practice specific topics or sit a complete test when you are ready.' },
          { number: '03', icon: Sparkles, title: 'Review and improve', body: 'See your results, revisit answers and decide what to study next.' },
        ].map(({ number, icon: Icon, title, body }) => <article className="landing-arena-step" key={number}><div className="landing-arena-step-top"><span>{number}</span><Icon size={26} /></div><h3>{c(title)}</h3><p>{c(body)}</p></article>)}</div>
        <div className="landing-arena-beyond"><div className="landing-arena-beyond-icon"><GraduationCap size={29} /></div><div><span>{c('BEYOND TEST DAY')}</span><h3>{c('Keep your university plan connected.')}</h3><p>{c('Bring preparation, academic skills and university research together in one account.')}</p></div><button type="button" onClick={start}>{c('Build your journey')} <ArrowRight size={18} /></button></div>
      </section>

      <section id="plans" className="landing-arena-section landing-arena-plans"><div className="landing-arena-plans-panel"><div><span className="landing-arena-eyebrow"><Sparkles size={14} /> {c('YOUR FIRST MONTH IS ON US')}</span><h2>{c('Start with everything. Stay on your terms.')}</h2><p>{c('New members receive one month of full Premium access automatically. After your gift month, keep going with a plan that works for you. No automatic renewal.')}</p><div className="landing-arena-plans-actions"><button type="button" onClick={() => navigate('/register')} className="landing-arena-button">{c('Claim free month')} <ArrowRight size={18} /></button><button type="button" onClick={() => navigate('/premium')} className="landing-arena-button-outline">{c('Compare plans')}</button></div></div><div className="landing-arena-plans-list"><span>{c('ONE PREMIUM EXPERIENCE · THREE OPTIONS')}</span>{[{ name: '1 month', amount: '39 000' }, { name: '3 months', amount: '89 000' }, { name: '12 months', amount: '299 000' }].map((plan) => <div className="landing-arena-plan-line" key={plan.name}><span>{c(plan.name)}</span><strong>{new Intl.NumberFormat(uiLanguage === 'uz' ? 'uz-UZ' : uiLanguage === 'ru' ? 'ru-RU' : 'en-US').format(Number(plan.amount.replace(' ', '')))} <small>{c('UZS')}</small></strong></div>)}<p><Check size={17} /> {c('Full access in every plan')}</p></div></div></section>

      <section id="faq" className="landing-arena-section landing-arena-faq"><div><span className="landing-arena-eyebrow"><ShieldCheck size={14} /> {c('GOOD TO KNOW')}</span><h2>{c('Questions before you begin?')}</h2><p>{c('Get a clear picture of what ProfAI offers, then take your first step.')}</p><a href={`mailto:${SUPPORT_EMAIL}`} className="landing-arena-support">{c('Contact support')} <ArrowUpRight size={16} /></a></div><div className="landing-arena-faq-list">{faqs.map(({ question, answer }, index) => <div className="landing-arena-faq-item" key={question}><button type="button" aria-expanded={openFaq === index} onClick={() => setOpenFaq(openFaq === index ? null : index)}>{c(question)}<ChevronDown size={19} className={openFaq === index ? 'is-open' : ''} /></button>{openFaq === index && <p>{c(answer)}</p>}</div>)}</div></section>

      <section className="landing-arena-bottom-cta"><div><span className="landing-arena-eyebrow">{c('READY WHEN YOU ARE')}</span><h2>{c('Your next chapter starts with one step.')}</h2><p>{c('Build momentum in IELTS, SAT and everything that comes after.')}</p></div><button type="button" onClick={start} className="landing-arena-button">{c('Get started free')} <ArrowRight size={19} /></button></section>
    </main>

    <footer className="landing-arena-footer"><div className="landing-arena-footer-main"><div><div className="landing-arena-footer-logo"><BrandMark size={35} /><strong>Prof<span>AI</span></strong></div><p>{c('Preparation and planning for the journey ahead.')}</p></div><nav aria-label={c('Footer navigation')}>{navItems.map(({ label, id }) => <button type="button" key={id} onClick={() => scrollTo(id)}>{c(label)}</button>)}<button type="button" onClick={() => navigate('/login')}>{c('Sign in')}</button></nav></div><div className="landing-arena-footer-bottom"><span>© {new Date().getFullYear()} ProfAI. {c('All rights reserved.')}</span><span>{c('Independent platform · Not affiliated with IELTS, College Board or any university.')}</span></div></footer>
  </div>
}
