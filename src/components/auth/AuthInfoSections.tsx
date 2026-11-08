import { useCopy } from '@/i18n/interface'
import UiText from '@/components/common/UiText'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, ChevronDown, ShieldCheck } from 'lucide-react'
import { BrandLogo } from '@/components/brand/BrandLogo'

const faqs = [
  { question: 'Can I prepare for both IELTS and SAT?', answer: 'Yes. Both exam arenas live in one account, with practice, full tests, results and review.' },
  { question: 'Is Ivygoo free to use?', answer: 'Yes. Free includes the first 5 tests in each IELTS skill, the first 5 IELTS full mocks and first 5 SAT mocks, plus their vocabulary. Articles, podcasts and shadowing are free. IvyGoo Pro is $5.99/month; IvyGoo Elite is $11.99/month. AI text balance renews monthly; Live AI requires a paid plan.' },
  { question: 'Does Ivygoo support IELTS General Training?', answer: 'Yes. IELTS Academic and General Training preparation are both available.' },
  { question: 'Does Ivygoo submit university applications?', answer: 'No. Ivygoo helps you prepare and organize your plan. You submit applications through each university’s official process.' },
]

export default function AuthInfoSections() {
  const { c: uiCopy } = useCopy()
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return <div className="auth-info">
    <section id="faq" className="auth-info-faq" aria-labelledby="auth-faq-title">
      <div className="auth-info-faq-intro">
        <span className="auth-info-eyebrow"><ShieldCheck size={14} /> <UiText text={"GOOD TO KNOW"} /></span>
        <h2 id="auth-faq-title"><UiText text={"Questions before"} /><br /><UiText text={"you begin?"} /></h2>
        <p><UiText text={"Get a clear picture of what Ivygoo offers, then take your first step."} /></p>
        <a href="mailto:elyornishonboyev000@gmail.com" className="auth-info-support"><UiText text={"Contact support"} /> <ArrowUpRight size={16} /></a>
      </div>
      <div className="auth-info-faq-list">
        {faqs.map(({ question, answer }, index) => <div className="auth-info-faq-item" key={question}>
          <h3><button type="button" aria-expanded={openFaq === index} aria-controls={`auth-faq-answer-${index}`} onClick={() => setOpenFaq(openFaq === index ? null : index)}><UiText text={question} /><ChevronDown size={19} className={openFaq === index ? 'is-open' : ''} /></button></h3>
          <div id={`auth-faq-answer-${index}`} hidden={openFaq !== index}><p><UiText text={answer} /></p></div>
        </div>)}
      </div>
    </section>

    <section className="auth-info-cta">
      <div>
        <span className="auth-info-eyebrow"><UiText text={"READY WHEN YOU ARE"} /></span>
        <h2><UiText text={"Your next chapter starts with one step."} /></h2>
        <p><UiText text={"Build momentum in IELTS, SAT and everything that comes after."} /></p>
      </div>
      <Link to="/register#sign-in" className="auth-info-button"><UiText text={"Get started free"} /> <ArrowRight size={19} /></Link>
    </section>

    <footer className="auth-info-footer">
      <div className="auth-info-footer-main">
        <div><div className="auth-info-footer-logo"><BrandLogo height={46} /></div><p><UiText text={"Preparation and planning for the journey ahead."} /></p></div>
        <nav aria-label={uiCopy("Footer navigation")}>
          <Link to="/ielts">IELTS</Link>
          <Link to="/sat">SAT</Link>
          <a href="#auth-showcase"><UiText text={"How it works"} /></a>
          <Link to="/#plans"><UiText text={"Free access"} /></Link>
          <a href="#faq"><UiText text={"FAQ"} /></a>
          <Link to="/login#sign-in"><UiText text={"Sign in"} /></Link>
        </nav>
      </div>
      <div className="auth-info-footer-bottom"><span>© {new Date().getFullYear()} <UiText text={"Ivygoo. All rights reserved."} /></span><span><UiText text={"Independent platform · Not affiliated with IELTS, College Board or any university."} /></span></div>
    </footer>
  </div>
}
