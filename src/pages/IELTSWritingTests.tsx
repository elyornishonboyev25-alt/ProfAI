import { useDeferredValue, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import CompactIeltsCatalog, { type CompactIeltsTestRow } from '@/components/catalog/CompactIeltsCatalog'
import { getWritingFullTestCatalog } from '@/data/writingTestData'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { getWritingAnalysisHistory } from '@/utils/writingAnalysisStorage'

export default function IELTSWritingTests({ embedded = false }: { embedded?: boolean } = {}) {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state: AuthState) => state.user)
  const navigationState = location.state as { entry?: string; from?: string; catalogFilter?: string; catalogSkill?: string; mock?: { id: string; section: string } } | null
  const fromMock = navigationState?.entry === 'mock-ielts'
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState(navigationState?.catalogSkill === 'writing' ? navigationState.catalogFilter ?? 'full' : 'full')
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const completedTaskIds = useMemo(
    () => new Set(getWritingAnalysisHistory(user?.id).map((entry) => entry.testId)),
    [user?.id],
  )

  const rows = useMemo<CompactIeltsTestRow[]>(
    () => getWritingFullTestCatalog().flatMap((test) => {
      if (activeFilter !== 'full') {
        return test.tasks
          .filter((task) => task.taskType === activeFilter)
          .map((task) => ({
            id: task.id,
            number: test.index,
            title: `Writing Task ${activeFilter === 'task1' ? 1 : 2} · Test ${test.index}`,
            subtitle: task.subtitle,
            badge: activeFilter === 'task1' ? 'Task 1' : 'Task 2',
            durationMinutes: task.durationMinutes,
            detail: `${task.suggestedWordCount.min}+ words`,
            available: test.available && task.available,
            completed: completedTaskIds.has(task.id),
          }))
      }
      return [{
        id: test.id,
        number: test.index,
        title: `Writing Full Test ${test.index}`,
        subtitle: test.available ? 'Complete academic writing simulation' : 'New full test in preparation',
        badge: 'Full test',
        durationMinutes: 60,
        detail: '2 tasks · 400+ words',
        available: test.available,
        completed: test.available && test.tasks.length > 0 && test.tasks.every((task) => completedTaskIds.has(task.id)),
      }]
    }),
    [activeFilter, completedTaskIds],
  )

  const visibleRows = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase()
    if (!query) return rows
    return rows.filter((row) => `${row.title} ${row.subtitle} ${row.badge}`.toLowerCase().includes(query))
  }, [deferredSearchTerm, rows])

  return (
    <CompactIeltsCatalog
      embedded={embedded}
      section="writing"
      rows={visibleRows}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      filters={[{ value: 'full', label: 'Full Test' }, { value: 'task1', label: 'Task 1' }, { value: 'task2', label: 'Task 2' }]}
      activeFilter={activeFilter}
      onFilterChange={setActiveFilter}
      onBack={() => navigate(fromMock ? '/mock/ielts' : '/ielts', fromMock ? { state: { from: navigationState?.from } } : undefined)}
      onLaunch={(row) => row.available && navigate(`/ielts/writing/test/${row.id}`, { state: { ...navigationState, catalogFilter: activeFilter, catalogSkill: 'writing' } })}
    />
  )
}
