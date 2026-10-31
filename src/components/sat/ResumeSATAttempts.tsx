import { Link } from 'react-router-dom'
import { X } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAccountDataRevision } from '@/hooks/useAccountDataRevision'
import { clearSATAttempt, loadSATAttempt } from '@/features/sat/attemptStorage'
import { getSATSectionTest, SAT_TEST_CATALOG } from '@/features/sat/catalog'

const tests = Object.values(SAT_TEST_CATALOG).flatMap(test => [
  { test, section: null },
  { test: getSATSectionTest(test.mockId, 'reading-writing'), section: 'reading-writing' },
  { test: getSATSectionTest(test.mockId, 'math'), section: 'math' },
])

export default function ResumeSATAttempts() {
  useAuthStore(state => state.user?.id)
  useAccountDataRevision()
  const attempts = tests.flatMap(({ test, section }) => {
    const attempt = loadSATAttempt(test.id)
    return attempt?.status === 'active' ? [{ test, section, attempt }] : []
  }).sort((a, b) => (b.attempt.updatedAt ?? b.attempt.startedAt) - (a.attempt.updatedAt ?? a.attempt.startedAt))

  if (!attempts.length) return null

  return <aside aria-label="Unfinished SAT tests" className="mb-4 flex flex-wrap gap-2">
    {attempts.map(({ test, section }) => {
      const title = `SAT ${section === 'math' ? 'Math' : section === 'reading-writing' ? 'Reading & Writing' : 'Full Mock'} ${test.mockId}`
      return <div key={test.id} className="inline-flex max-w-full items-center rounded-xl border border-amber-200 bg-amber-50 text-sm font-bold text-amber-900">
        <Link to={`/sat/mock/${test.mockId}/run${section ? `?section=${section}` : ''}`}
          className="min-w-0 rounded-l-xl py-2 pl-4 pr-2 hover:text-amber-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500">
          Resume · {title}
        </Link>
        <button type="button" aria-label={`Delete unfinished test: ${title}`}
          className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-amber-700 transition-colors hover:bg-amber-100 hover:text-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500"
          onClick={() => {
            if (window.confirm(`Delete saved progress for ${title}? You will need to start this unfinished test again.`)) clearSATAttempt(test.id)
          }}><X size={14} strokeWidth={2} aria-hidden="true" /></button>
      </div>
    })}
  </aside>
}
