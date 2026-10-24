import { Link } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useAccountDataRevision } from '@/hooks/useAccountDataRevision'
import { getIeltsAttemptResumes } from '@/utils/ieltsAttemptResume'

export default function ResumeIeltsAttempts() {
  const owner = useAuthStore(state => state.user?.id ?? 'guest')
  useAccountDataRevision()
  const attempts = getIeltsAttemptResumes(owner)
  if (!attempts.length) return null
  return <aside aria-label="Unfinished IELTS tests" className="mb-4 flex flex-wrap gap-2">
    {attempts.map(attempt => <Link key={attempt.sessionKey} to={{ pathname: attempt.pathname, search: attempt.search }} state={attempt.state}
      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-bold text-amber-900">
      Resume · {attempt.title}
    </Link>)}
  </aside>
}
