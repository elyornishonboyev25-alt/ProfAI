import { ArrowLeft, ArrowRight, BookOpen, BrainCircuit, NotebookPen } from 'lucide-react'
import { Link } from 'react-router-dom'
import UiText from '@/components/common/UiText'

export default function ReviewMistakes() {
  return (
    <div className="workspace-page relative min-h-screen overflow-hidden px-4 py-7 sm:px-6 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,#fff1f2_0%,#fffafa_52%,#fff3f4_100%)]" />
      <div className="relative mx-auto max-w-6xl space-y-5">
        <section className="rounded-[2rem] border border-white/90 bg-white/75 p-6 shadow-[0_24px_60px_rgba(220,38,38,0.1)] backdrop-blur-2xl sm:p-8">
          <Link to="/profile" className="route-back-button"><ArrowLeft className="h-3.5 w-3.5" /><UiText text="My Results" /></Link>
          <div className="mt-5 flex items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-950"><UiText text="Review mistakes" /></h1>
              <p className="mt-2 text-sm leading-6 text-slate-600"><UiText text="Choose IELTS or SAT to review your saved attempts." /></p>
            </div>
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 text-white shadow-[0_14px_30px_rgba(220,38,38,.25)]"><BrainCircuit className="h-6 w-6" /></span>
          </div>
        </section>
        <div className="grid gap-5 sm:grid-cols-2">
          {[
            { title: 'IELTS Mistake Lab', path: '/analyze-mistakes', description: 'Review Listening, Reading, Writing and Speaking feedback.', icon: BookOpen },
            { title: 'SAT Mistake Lab', path: '/sat/mistakes', description: 'Review full mocks, Math and Reading & Writing attempts.', icon: NotebookPen },
          ].map(({ title, path, description, icon: Icon }) => (
            <Link key={path} to={path} className="group rounded-[2rem] border border-white/90 bg-white/75 p-6 shadow-[0_22px_55px_rgba(220,38,38,.08)] backdrop-blur-2xl transition hover:-translate-y-1 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-600 sm:p-8">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-red-600"><Icon className="h-6 w-6" /></span>
              <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950"><UiText text={title} /></h2>
              <p className="mt-2 text-sm leading-6 text-slate-600"><UiText text={description} /></p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-black text-red-600"><UiText text="Review" /><ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
