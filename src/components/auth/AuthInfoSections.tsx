import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, ChevronDown, ShieldCheck } from 'lucide-react'
import { BrandMark } from '@/components/brand/BrandLogo'

const faqs = [
  { question: 'Can I prepare for both IELTS and SAT?', answer: 'Yes. Both exam arenas live in one account, with practice, full tests, results and review.' },
  { question: 'Is ProfAI free to use?', answer: 'Start for free with 7 days of AI, IELTS and SAT. After your one-time trial, Student is $3/month and Teacher is $5/month. Classes require a paid plan. Saved results and vocabulary stay available.' },
  { question: 'Does ProfAI support IELTS General Training?', answer: 'Yes. IELTS Academic and General Training preparation are both available.' },
  { question: 'Does ProfAI submit university applications?', answer: 'No. ProfAI helps you prepare and organize your plan. You submit applications through each university’s official process.' },
]

export default function AuthInfoSections() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return <div className="auth-info">
    <section id="faq" className="auth-info-faq" aria-labelledby="auth-faq-title">
      <div className="auth-info-faq-intro">
        <span className="auth-info-eyebrow"><ShieldCheck size={14} /> GOOD TO KNOW</span>
        <h2 id="auth-faq-title">Questions before<br />you begin?</h2>
        <p>Get a clear picture of what ProfAI offers, then take your first step.</p>
        <a href="mailto:support@profai.uz" className="auth-info-support">Contact support <ArrowUpRight size={16} /></a>
      </div>
      <div className="auth-info-faq-list">
        {faqs.map(({ question, answer }, index) => <div className="auth-info-faq-item" key={question}>
          <h3><button type="button" aria-expanded={openFaq === index} aria-controls={`auth-faq-answer-${index}`} onClick={() => setOpenFaq(openFaq === index ? null : index)}>{question}<ChevronDown size={19} className={openFaq === index ? 'is-open' : ''} /></button></h3>
          <div id={`auth-faq-answer-${index}`} hidden={openFaq !== index}><p>{answer}</p></div>
        </div>)}
      </div>
    </section>

    <section className="auth-info-cta">
      <div>
        <span className="auth-info-eyebrow">READY WHEN YOU ARE</span>
        <h2>Your next chapter starts with one step.</h2>
        <p>Build momentum in IELTS, SAT and everything that comes after.</p>
      </div>
      <Link to="/register#sign-in" className="auth-info-button">Get started free <ArrowRight size={19} /></Link>
    </section>

    <footer className="auth-info-footer">
      <div className="auth-info-footer-main">
        <div><div className="auth-info-footer-logo"><BrandMark size={35} /><strong>Prof<span>AI</span></strong></div><p>Preparation and planning for the journey ahead.</p></div>
        <nav aria-label="Footer navigation">
          <Link to="/test-preparation">IELTS &amp; SAT</Link>
          <a href="#auth-showcase">How it works</a>
          <Link to="/#plans">Free access</Link>
          <a href="#faq">FAQ</a>
          <Link to="/login#sign-in">Sign in</Link>
        </nav>
      </div>
      <div className="auth-info-footer-bottom"><span>© {new Date().getFullYear()} ProfAI. All rights reserved.</span><span>Independent platform · Not affiliated with IELTS, College Board or any university.</span></div>
    </footer>
  </div>
}
