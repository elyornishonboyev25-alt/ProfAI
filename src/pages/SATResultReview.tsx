import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { testReturnLabel, testReturnPath } from '@/utils/testNavigation'
import SATReview from '@/components/sat/SATReview'
import { useAccountDataRevision } from '@/hooks/useAccountDataRevision'
import { loadSATAttemptHistory } from '@/features/sat/attemptStorage'
import { getSATReviewTests } from '@/features/sat/catalog'
import { useAuthStore } from '@/store/authStore'
import { saveSATBaseline } from '@/features/sat/baseline'
import UiText from '@/components/common/UiText'

export default function SATResultReview() {
  const { attemptId } = useParams<{ attemptId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore(state => state.user)
  const diagnostic = Boolean((location.state as { diagnostic?: boolean } | null)?.diagnostic)
  const [baselineStatus, setBaselineStatus] = useState<'saving' | 'saved' | 'error'>('saving')
  const [retry, setRetry] = useState(0)
  const backPath = testReturnPath(location.state, '/profile')
  useAccountDataRevision()
  const entry = loadSATAttemptHistory().find((saved) => saved.id === attemptId)
  const test = entry && getSATReviewTests().find((saved) => saved.id === entry.attempt.testId)

  useEffect(() => { window.scrollTo(0, 0) }, [attemptId])
  useEffect(() => {
    if (!diagnostic || !user || !entry || !test) return
    let active = true
    setBaselineStatus('saving')
    void saveSATBaseline(user.id, test, entry.attempt).then(() => { if (active) setBaselineStatus('saved') }).catch(() => { if (active) setBaselineStatus('error') })
    return () => { active = false }
  }, [diagnostic, user?.id, attemptId, retry])

  if (!entry || !test) return <Navigate to="/profile" replace />

  return (
    <>
    {diagnostic && <div role="status" className="mx-auto max-w-6xl px-6 pt-4 text-sm text-slate-600"><UiText text={baselineStatus === 'saving' ? 'Saving your starting SAT score...' : baselineStatus === 'saved' ? 'Your starting SAT score is saved. Review your mistakes below, then practise the skills you missed.' : 'Your mock is saved, but your profile score could not sync. Please retry.'} />{baselineStatus === 'error' && <button type="button" onClick={() => setRetry(value => value + 1)} className="ml-3 font-bold text-red-700"><UiText text="Try again" /></button>}</div>}
    <SATReview
      key={entry.id}
      attempt={entry.attempt}
      test={test}
      onBack={() => navigate(backPath)}
      backLabel={testReturnLabel(backPath, 'SAT test')}
      onStartAgain={(location.state as { justCompleted?: boolean } | null)?.justCompleted ? () => navigate(`/mock/sat/${test.mockId}${test.modules.every(module => module.section === test.modules[0].section) ? `?section=${test.modules[0].section}` : ''}`) : undefined}
      historyReview={!Boolean((location.state as { justCompleted?: boolean } | null)?.justCompleted)}
    />
    </>
  )
}
