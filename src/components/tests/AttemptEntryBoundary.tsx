import { useLayoutEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, FolderClock, Play, RotateCcw } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { getInProcessAttempts, discardInProcessAttempt } from '@/utils/inProcessAttempts'
import { getIeltsAttemptResumes, discardIeltsAttempt } from '@/utils/ieltsAttemptResume'
import { resolveFullMockRouteState } from '@/utils/fullMockRouteState'
import ConfirmDialog from '@/components/common/ConfirmDialog'
import { useBillingText } from '@/features/billing/copy'

/** Decide before mounting a runner, so opening a catalog test never overwrites a draft. */
export default function AttemptEntryBoundary({ exam, children }: { exam: 'IELTS' | 'SAT'; children: ReactNode }) {
  const location = useLocation()
  const owner = useAuthStore(state => state.user?.id ?? 'guest')
  return <EntryDecision key={`${owner}:${location.pathname}:${location.search}`} exam={exam} owner={owner}>{children}</EntryDecision>
}
function EntryDecision({ exam, owner, children }: { exam: 'IELTS' | 'SAT'; owner: string; children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const text = useBillingText()
  const route = resolveFullMockRouteState(location) as { resumeIntent?: boolean; reviewPayload?: unknown; mock?: { id: string }; returnTo?: string } | null
  // Reload keeps this browser entry; a fresh catalog visit has another key.
  const entryKey = `exam:accepted-entry:${owner}:${location.key}`
  const entryValue = `${location.pathname}${location.search}`
  const [existing] = useState(() => {
    if (route?.reviewPayload || route?.resumeIntent) return null
    try { if (window.sessionStorage.getItem(entryKey) === entryValue) return null } catch { /* The saved-choice screen remains available. */ }
    if (exam === 'IELTS') {
      const mockId = location.pathname.match(/^\/mock\/ielts\/([^/]+)$/)?.[1]
      if (mockId) return getInProcessAttempts('IELTS', owner).find(attempt => attempt.mockId === mockId) ?? null
      return getIeltsAttemptResumes(owner).find(attempt => attempt.pathname === location.pathname &&
        ((attempt.state as { mock?: { id?: string } } | null)?.mock?.id ?? new URLSearchParams(attempt.search).get('mock') ?? undefined) === route?.mock?.id) ?? null
    }
    const search = new URLSearchParams(location.search)
    const section = search.get('section')
    const testId = search.get('testId')
    return getInProcessAttempts(exam, owner).find(attempt => attempt.pathname === location.pathname && new URLSearchParams(attempt.search).get('section') === section
      && (!testId || attempt.satId === testId)) ?? null
  })
  const [accepted, setAccepted] = useState(!existing)
  const [confirm, setConfirm] = useState(false)
  useLayoutEffect(() => {
    if (!accepted) return
    try { window.sessionStorage.setItem(entryKey, entryValue) } catch { /* Answers use the separate account checkpoint. */ }
  }, [accepted, entryKey, entryValue])
  if (accepted || !existing) return <>{children}</>
  return <main className="exam-flow attempt-entry"><section className="attempt-entry-card">
    <span className="attempt-entry-icon"><FolderClock size={30} strokeWidth={1.5} /></span><h1>{text('You have a test in progress', 'Bu test bo‘yicha saqlangan jarayon bor', 'У вас есть незавершённый тест')}</h1>
    <p className="attempt-entry-title">{existing.title}</p><p>{text('Continue with your saved answers, notes and timing. Starting again replaces the unfinished attempt.', 'Saqlangan javoblar, qaydlar va vaqt bilan davom eting. Yangidan boshlash tugallanmagan urinish o‘rnini almashtiradi.', 'Продолжите с сохранёнными ответами, заметками и временем. Новый тест заменит незавершённую попытку.')}</p>
    <div className="flow-dialog-actions"><button type="button" className="flow-button is-primary" onClick={() => {
      if ('mockId' in existing && existing.mockId) {
        navigate({ pathname: existing.pathname, search: existing.search }, { replace: true, state: { ...(existing.state as object ?? {}), resumeIntent: true, returnTo: location.pathname } })
      } else {
        setAccepted(true)
        navigate({ pathname: location.pathname, search: location.search, hash: location.hash }, { replace: true, state: { ...(location.state as object ?? {}), resumeIntent: true } })
      }
    }}><Play size={17} />{text('Continue saved test', 'Saqlangan testni davom ettirish', 'Продолжить тест')}</button>
      <button type="button" className="flow-button" onClick={() => setConfirm(true)}><RotateCcw size={17} />{text('Start a new attempt', 'Yangidan boshlash', 'Начать заново')}</button>
      <button type="button" className="flow-button" onClick={() => navigate(route?.returnTo ?? (exam === 'IELTS' ? '/ielts' : '/sat'))}><ArrowLeft size={17} />{text('Back', 'Orqaga', 'Назад')}</button></div>
    <ConfirmDialog open={confirm} title={text('Replace your unfinished test?', 'Tugallanmagan test almashtirilsinmi?', 'Заменить незавершённый тест?')}
      description={text('Your current answers and notes for this test will be deleted. This cannot be undone. Completed results are kept.', 'Ushbu testdagi hozirgi javoblar va qaydlar o‘chadi. Buni qaytarib bo‘lmaydi. Tugallangan natijalar saqlanadi.', 'Текущие ответы и заметки будут удалены без возможности восстановления. Завершённые результаты сохранятся.')}
      confirmLabel={text('Replace & start again', 'Almashtirish va boshlash', 'Заменить и начать')} cancelLabel={text('Keep saved test', 'Saqlangan testni qoldirish', 'Оставить сохранённый тест')} destructive onClose={() => setConfirm(false)} onConfirm={async () => {
        if ('sessionKey' in existing) await discardIeltsAttempt(owner, existing.sessionKey)
        else await discardInProcessAttempt(owner, existing)
        setConfirm(false)
        if (exam === 'SAT') navigate(existing.pathname.includes('question-bank') ? '/sat/question-bank' : location.pathname.replace('/sat/mock/', '/mock/sat/').replace('/run', '') + location.search, { replace: true })
        else setAccepted(true)
      }} />
  </section></main>
}
