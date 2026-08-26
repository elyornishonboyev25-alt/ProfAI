import { useDeferredValue, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import CompactIeltsCatalog, { type CompactIeltsTestRow } from '@/components/catalog/CompactIeltsCatalog'
import { getWritingFullTestCatalog } from '@/data/writingTestData'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { getWritingAnalysisHistory } from '@/utils/writingAnalysisStorage'

export default function IELTSWritingTests() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state: AuthState) => state.user)
  const navigationState = location.state as { entry?: string } | null
  const fromMock = navigationState?.entry === 'mock-ielts'
  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const completedTaskIds = useMemo(
    () => new Set(getWritingAnalysisHistory(user?.id).map((entry) => entry.testId)),
    [user?.id],
  )

  const rows = useMemo<CompactIeltsTestRow[]>(
    () =>
      getWritingFullTestCatalog().map((test) => ({
        id: test.id,
        number: test.index,
        title: `Writing Full Test ${test.index}`,
        subtitle: test.available ? 'Complete academic writing simulation' : 'New full test in preparation',
        badge: 'Full test',
        durationMinutes: 60,
        detail: '2 tasks · 400+ words',
        available: test.available,
        completed: test.available && test.tasks.length > 0 && test.tasks.every((task) => completedTaskIds.has(task.id)),
      })),
    [completedTaskIds],
  )

  const visibleRows = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase()
    if (!query) return rows
    return rows.filter((row) => `${row.title} ${row.subtitle} ${row.badge}`.toLowerCase().includes(query))
  }, [deferredSearchTerm, rows])

  return (
    <CompactIeltsCatalog
      section="writing"
      rows={visibleRows}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onBack={() => navigate(fromMock ? '/mock/ielts' : '/ielts')}
      onLaunch={(row) => row.available && navigate(`/ielts/writing/test/${row.id}`)}
    />
  )
}
