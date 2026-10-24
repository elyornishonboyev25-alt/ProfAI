import { ArrowLeft, ArrowRight, BookOpen, BrainCircuit, NotebookPen } from 'lucide-react'
import { Link } from 'react-router-dom'
import UiText from '@/components/common/UiText'
import '@/styles/mistake-labs.css'

export default function ReviewMistakes() {
  return (
    <div className="workspace-page mlab">
      <div className="mlab-shell">
        <section className="mlab-card mlab-hero">
          <div className="mlab-hero-top">
            <Link to="/profile" className="mlab-back"><ArrowLeft aria-hidden="true" /><UiText text="My Results" /></Link>
          </div>
          <div className="mlab-hero-body">
            <div>
              <h1><UiText text="Review mistakes" /></h1>
              <p><UiText text="Choose IELTS or SAT to review your saved attempts." /></p>
            </div>
            <span className="mlab-hero-mark" aria-hidden="true"><BrainCircuit /></span>
          </div>
        </section>
        <div className="mlab-lab-grid">
          {[
            { exam: 'IELTS', title: 'IELTS Mistake Lab', path: '/analyze-mistakes', description: 'Review Listening, Reading, Writing and Speaking feedback.', icon: BookOpen },
            { exam: 'SAT', title: 'SAT Mistake Lab', path: '/sat/mistakes', description: 'Review full mocks, Math and Reading & Writing attempts.', icon: NotebookPen },
          ].map(({ exam, title, path, description, icon: Icon }) => (
            <Link key={path} to={path} className="mlab-card mlab-lab-card">
              <div className="mlab-lab-head">
                <span className="mlab-lab-icon"><Icon aria-hidden="true" /></span>
                <span className="mlab-chip" aria-hidden="true">{exam}</span>
              </div>
              <h2><UiText text={title} /></h2>
              <p><UiText text={description} /></p>
              <div className="mlab-lab-foot">
                <span className="mlab-lab-cta"><UiText text="Review" /><ArrowRight aria-hidden="true" /></span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
