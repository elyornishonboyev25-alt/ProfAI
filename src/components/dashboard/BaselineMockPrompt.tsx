import { ArrowRight, Target } from 'lucide-react'
import UiText from '@/components/common/UiText'

export const SAT_BASELINE_PATH = '/mock/sat/1?diagnostic=1'
export const IELTS_BASELINE_PATH = '/ielts/tests#mocks'

export default function BaselineMockPrompt({ sat, ielts, onStart, disabled = false }: {
  sat: boolean
  ielts: boolean
  onStart: (exam: 'SAT' | 'IELTS') => void
  disabled?: boolean
}) {
  if (!sat && !ielts) return null
  return <section aria-label="Find your starting score" className="mb-5 rounded-2xl border border-blue-100 bg-blue-50/80 p-4 sm:p-5">
    <div className="flex items-start gap-3">
      <Target className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
      <div className="min-w-0">
        <h2 className="text-base font-black text-slate-900"><UiText text="Not sure of your current score?" /></h2>
        <p className="mt-1 text-sm leading-6 text-slate-600"><UiText text="Take a full mock to estimate your level, review explanations and focus on the questions you missed. You can also start later." /></p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(['SAT', 'IELTS'] as const).filter(exam => exam === 'SAT' ? sat : ielts).map(exam =>
            <button key={exam} type="button" disabled={disabled} onClick={() => onStart(exam)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-800 disabled:opacity-50">
              <UiText text={exam === 'SAT' ? 'Take a full SAT mock' : 'Take a full IELTS mock'} /><ArrowRight className="h-4 w-4" />
            </button>,
          )}
        </div>
      </div>
    </div>
  </section>
}
