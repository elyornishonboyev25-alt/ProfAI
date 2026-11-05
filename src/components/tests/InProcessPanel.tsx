import { useCopy } from '@/i18n/interface'
import UiText from '@/components/common/UiText'
import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { ArrowUpRight, FolderClock, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAccountDataRevision } from '@/hooks/useAccountDataRevision'
import { discardInProcessAttempt, getInProcessAttempts, type InProcessAttempt } from '@/utils/inProcessAttempts'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { useBillingText } from '@/features/billing/copy'
import '@/styles/exam-flow.css'

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
      {attempts.length ? <div className="in-process-grid">{attempts.map(attempt => <article className="in-process-card" key={attempt.id}>
        <div><span className="in-process-status">{text('Saved progress', 'Jarayon saqlangan', 'Прогресс сохранён')}</span><h3>{attempt.title}</h3><small>{attempt.detail}</small></div>
        <button type="button" className="in-process-delete" aria-label={uiCopy("Delete unfinished test: {{value1}}", { value1: String(attempt.title) })} onClick={() => setPending({ owner, attempt })}><Trash2 size={16} /></button>
        <div className="in-process-progress" aria-hidden="true"><i style={{ width: `${attempt.total ? Math.min(100, attempt.answered / attempt.total * 100) : 0}%` }} /></div>
        <div className="in-process-foot"><span>{attempt.total ? `${attempt.answered} / ${attempt.total} ${attempt.mockId ? 'sections' : 'answered'}` : text('Answers autosaved', 'Javoblar saqlangan', 'Ответы сохранены')}</span>
          <Link className="flow-button" to={{ pathname: attempt.pathname, search: attempt.search }} state={{ ...(attempt.state as object ?? {}), resumeIntent: true, returnTo: `${location.pathname}${location.search}${location.hash}` }}>{text('Continue', 'Davom ettirish', 'Продолжить')}<ArrowUpRight size={14} /></Link>
        </div>
      </article>)}</div> : <p className="in-process-empty">{text('Start a test. Save & exit to continue it here later.', 'Testni boshlang. Saqlash va chiqish orqali uni keyin shu yerdan davom ettiring.', 'Начните тест и выберите «Сохранить и выйти», чтобы продолжить позже.')}</p>}
    </section>
    <ConfirmDialog open={pending?.owner === owner} title={text('Delete saved progress?', 'Saqlangan jarayon o‘chirilsinmi?', 'Удалить сохранённый прогресс?')}
      description={`${pending?.attempt.title ?? ''}. ${text('This removes the answers and notes for this unfinished test. Completed results will stay in My Results.', 'Ushbu tugallanmagan testning javoblari va qaydlari o‘chadi. Tugallangan natijalar My Results bo‘limida qoladi.', 'Ответы и заметки незавершённого теста будут удалены. Завершённые результаты останутся в My Results.')}`}
      confirmLabel={text('Delete progress', 'Jarayonni o‘chirish', 'Удалить прогресс')} cancelLabel={text('Keep test', 'Testni saqlash', 'Оставить тест')} destructive onClose={() => setPending(null)}
      onConfirm={async () => { if (pending?.owner !== owner) return; await discardInProcessAttempt(owner, pending.attempt); setPending(null) }} />
  </div>
}
