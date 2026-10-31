import { useEffect } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { testReturnLabel, testReturnPath } from '@/utils/testNavigation'
import SATReview from '@/components/sat/SATReview'
import { useAccountDataRevision } from '@/hooks/useAccountDataRevision'
import { loadSATAttemptHistory } from '@/features/sat/attemptStorage'
import { getSATReviewTests } from '@/features/sat/catalog'

export default function SATResultReview() {
  const { attemptId } = useParams<{ attemptId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const backPath = testReturnPath(location.state, '/profile')
  useAccountDataRevision()
  const entry = loadSATAttemptHistory().find((saved) => saved.id === attemptId)
  const test = entry && getSATReviewTests().find((saved) => saved.id === entry.attempt.testId)

  useEffect(() => { window.scrollTo(0, 0) }, [attemptId])

  if (!entry || !test) return <Navigate to="/profile" replace />

  return (
    <SATReview
      key={entry.id}
      attempt={entry.attempt}
      test={test}
      onBack={() => navigate(backPath)}
      backLabel={testReturnLabel(backPath, 'SAT test')}
      historyReview
    />
  )
}
