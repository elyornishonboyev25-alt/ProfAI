import { useDeferredValue, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import CompactIeltsCatalog, { type CompactIeltsTestRow } from '@/components/catalog/CompactIeltsCatalog'
import { getWritingDayCatalog } from '@/data/writingTestData'

export default function IELTSWritingTests() {
  const navigate = useNavigate()
  const location = useLocation()
  const navigationState = location.state as { entry?: string } | null
  const fromMock = navigationState?.entry === 'mock-ielts'
  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearchTerm = useDeferredValue(searchTerm)

  const rows = useMemo<CompactIeltsTestRow[]>(
    () =>
      getWritingDayCatalog().map((task, index) => ({
        id: task.id,
        number: index + 1,
        title: `Writing Full Test ${index + 1}`,
        subtitle: task.subtitle,
        badge: task.taskType === 'task1' ? 'Task 1' : 'Task 2',
        durationMinutes: task.durationMinutes,
        detail: task.taskType === 'task1' ? '150+ words' : '250+ words',
        available: task.available,
      })),
    [],
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
