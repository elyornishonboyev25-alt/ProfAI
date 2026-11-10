import { useCopy } from '@/i18n/interface'
import UiText from '@/components/common/UiText'
import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { ArrowRight, FolderClock, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAccountDataRevision } from '@/hooks/useAccountDataRevision'
import { discardInProcessAttempt, getInProcessAttempts, type InProcessAttempt } from '@/utils/inProcessAttempts'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { useBillingText } from '@/features/billing/copy'
import '@/styles/exam-flow.css'
import '@/styles/exam-catalog.css'

export default function InProcessPanel({ exam, showEmpty = false }: { exam: 'IELTS' | 'SAT'; showEmpty?: boolean }) {
  const { c: uiCopy } = useCopy()
  const owner = useAuthStore(state => state.user?.id ?? 'guest')
  const location = useLocation()
  useAccountDataRevision()
  const text = useBillingText()
  const [pending, setPending] = useState<{ owner: string; attempt: InProcessAttempt } | null>(null)
  const attempts = getInProcessAttempts(exam, owner)
  if (!attempts.length && !showEmpty) return null
  return <div className="exam-flow">
    <section className="in-process" aria-label={uiCopy("Unfinished {{value1}} tests", { value1: String(exam) })}>
      <header className="in-process-head"><span><FolderClock size={22} /></span><div><h2><UiText text={"In process"} /></h2><p>{text('Your saved tests, ready to continue.', 'Saqlangan testlaringizni shu yerdan davom ettiring.', 'Продолжите сохранённые тесты.')}</p></div><b className="in-process-count">{attempts.length}</b></header>
      {attempts.length ? <div className="test-card-grid in-process-grid">{attempts.map(attempt => <article className="test-card in-process-card" key={attempt.id}>
        <div className="test-card-heading">
          <span className="test-card-icon"><FolderClock size={21} strokeWidth={1.7} aria-hidden="true" /></span>
          <h3 className="test-card-title">{attempt.title}</h3>
          <button type="button" className="in-process-delete" aria-label={uiCopy("Delete unfinished test: {{value1}}", { value1: String(attempt.title) })} onClick={() => setPending({ owner, attempt })}><Trash2 size={16} aria-hidden="true" /></button>
        </div>
        <p className="test-card-note"><UiText text={attempt.detail} /></p>
        {attempt.total ? <div className="test-card-progress">
          <span><UiText text="Saved progress" /></span><span>{attempt.answered}/{attempt.total}</span>
          <progress value={attempt.answered} max={attempt.total} aria-label={uiCopy('Saved progress')} />
        </div> : <p className="test-card-note">{text('Answers autosaved', 'Javoblar saqlangan', 'Ответы сохранены')}</p>}
        <Link className="test-card-action" to={{ pathname: attempt.pathname, search: attempt.search }} state={{ ...(attempt.state as object ?? {}), resumeIntent: true, returnTo: `${location.pathname}${location.search}${location.hash}` }}><UiText text="Continue" /><ArrowRight size={16} aria-hidden="true" /></Link>
      </article>)}</div> : <p className="in-process-empty">{text('Start a test. Save & exit to continue it here later.', 'Testni boshlang. Saqlash va chiqish orqali uni keyin shu yerdan davom ettiring.', 'Начните тест и выберите «Сохранить и выйти», чтобы продолжить позже.')}</p>}
    </section>
    <ConfirmDialog open={pending?.owner === owner} title={text('Delete saved progress?', 'Saqlangan jarayon o‘chirilsinmi?', 'Удалить сохранённый прогресс?')}
      description={`${pending?.attempt.title ?? ''}. ${text('This removes the answers and notes for this unfinished test. Completed results will stay in My Results.', 'Ushbu tugallanmagan testning javoblari va qaydlari o‘chadi. Tugallangan natijalar My Results bo‘limida qoladi.', 'Ответы и заметки незавершённого теста будут удалены. Завершённые результаты останутся в My Results.')}`}
      confirmLabel={text('Delete progress', 'Jarayonni o‘chirish', 'Удалить прогресс')} cancelLabel={text('Keep test', 'Testni saqlash', 'Оставить тест')} destructive onClose={() => setPending(null)}
      onConfirm={async () => { if (pending?.owner !== owner) return; await discardInProcessAttempt(owner, pending.attempt); setPending(null) }} />
  </div>
}
