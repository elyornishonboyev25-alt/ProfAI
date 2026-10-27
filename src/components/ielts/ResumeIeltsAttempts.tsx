import { Link } from 'react-router-dom'
import { useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Trash2, X } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAccountDataRevision } from '@/hooks/useAccountDataRevision'
import { discardIeltsAttempt, getIeltsAttemptResumes, type IeltsAttemptResume } from '@/utils/ieltsAttemptResume'
import { useBillingText } from '@/features/billing/copy'

export default function ResumeIeltsAttempts() {
  const owner = useAuthStore(state => state.user?.id ?? 'guest')
  useAccountDataRevision()
  const text = useBillingText()
  const titleId = useId()
  const descriptionId = useId()
  const [pending, setPending] = useState<{ owner: string; attempt: IeltsAttemptResume } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const trigger = useRef<HTMLButtonElement | null>(null)
  const attempts = getIeltsAttemptResumes(owner)
  const close = () => { if (deleting) return; setPending(null); trigger.current?.focus() }
  return <>
    {attempts.length > 0 && <aside aria-label="Unfinished IELTS tests" className="mb-4 flex flex-wrap gap-2">
      {attempts.map(attempt => <div key={attempt.sessionKey} className="inline-flex max-w-full items-center rounded-xl border border-amber-200 bg-amber-50 text-sm font-bold text-amber-900">
        <Link to={{ pathname: attempt.pathname, search: attempt.search }} state={attempt.state}
          className="min-w-0 rounded-l-xl py-2 pl-4 pr-2 hover:text-amber-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500">
          Resume · {attempt.title}
        </Link>
        <button type="button" aria-label={`${text('Delete unfinished test', 'Tugallanmagan testni o‘chirish', 'Удалить незавершённый тест')}: ${attempt.title}`}
          className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-amber-700 transition-colors hover:bg-amber-100 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
          onClick={event => { trigger.current = event.currentTarget; setPending({ owner, attempt }) }}><X size={14} strokeWidth={2} /></button>
      </div>)}
    </aside>}
    {pending?.owner === owner && createPortal(<div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-950/50 p-4" onClick={event => { if (event.target === event.currentTarget) close() }}>
      <section role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId}
        className="w-full max-w-md rounded-3xl border border-amber-100 bg-white p-6 shadow-2xl" onKeyDown={event => {
          if (event.key === 'Escape') close()
          if (event.key === 'Tab') {
            const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')
            const first = buttons[0], last = buttons[buttons.length - 1]
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
          }
        }}>
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-50 text-amber-700"><Trash2 size={21} /></span>
        <h2 id={titleId} className="mt-4 text-xl font-bold text-slate-950">{text('Delete this unfinished test?', 'Tugallanmagan test o‘chirilsinmi?', 'Удалить незавершённый тест?')}</h2>
        <p className="mt-2 text-sm font-semibold text-amber-900">{pending.attempt.title}</p>
        <p id={descriptionId} className="mt-3 text-sm leading-6 text-slate-600">{text('All answers, notes and saved progress for this unfinished test will be permanently deleted. You will need to start it again.', 'Ushbu tugallanmagan testdagi barcha javoblaringiz, qaydlaringiz va saqlangan jarayon butunlay o‘chadi. Testni boshidan boshlashingiz kerak bo‘ladi.', 'Все ответы, заметки и сохранённый прогресс этого незавершённого теста будут удалены без возможности восстановления. Тест придётся начать заново.')}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button autoFocus type="button" disabled={deleting} onClick={close} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700">{text('Cancel', 'Bekor qilish', 'Отмена')}</button>
          <button type="button" disabled={deleting} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50" onClick={async () => {
            setDeleting(true)
            try { await discardIeltsAttempt(pending.owner, pending.attempt.sessionKey); setPending(null) }
            finally { setDeleting(false) }
          }}>{deleting ? text('Deleting…', 'O‘chirilmoqda…', 'Удаление…') : text('Delete test', 'Testni o‘chirish', 'Удалить тест')}</button>
        </div>
      </section>
    </div>, document.body)}
  </>
}
