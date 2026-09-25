import UiText from '@/components/common/UiText'
import { useDeferredValue, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Crown, Sparkles } from 'lucide-react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'

import CompactIeltsCatalog, { type CompactIeltsTestRow } from '@/components/catalog/CompactIeltsCatalog'
import { useFeatureTrial } from '@/hooks/useFeatureTrial'
import { getReadingAnalysisHistory } from '@/utils/readingAnalysisStorage'
import {
  getIeltsFullTestCatalog,
  getIeltsReadingUnifiedCatalog,
  isAvailableIeltsTrackTest,
  type IeltsTrackType,
} from '@/utils/ieltsTrackCatalog'
import { useAuthStore, type AuthState } from '@/store/authStore'

const CARD_EASE = [0.22, 1, 0.36, 1] as const

export default function IELTSSectionTests({ sectionOverride, embedded = false }: { sectionOverride?: 'reading' | 'listening'; embedded?: boolean } = {}) {
  const navigate = useNavigate()
  const location = useLocation()
  const { section } = useParams<{ section: string }>()
  const user = useAuthStore((state: AuthState) => state.user)
  const selectedSection = sectionOverride ?? section
  const validSection = selectedSection === 'reading' || selectedSection === 'listening'
  const track = (validSection ? selectedSection : 'reading') as IeltsTrackType
  const trial = useFeatureTrial(track)
  const [showTrialGate, setShowTrialGate] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const navigationState = location.state as { entry?: string; from?: string; catalogFilter?: string; catalogSkill?: string } | null
  const [activeFilter, setActiveFilter] = useState(navigationState?.catalogSkill === track ? navigationState.catalogFilter ?? 'full' : 'full')
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const fromMock = navigationState?.entry === 'mock-ielts'

  const completedTestIds = useMemo(() => {
    return new Set(
      getReadingAnalysisHistory(user?.id)
        .filter((entry) => entry.correctAnswers > 0 && entry.totalQuestions > 0)
        .filter((entry) => {
          const isListeningAttempt = `${entry.testId} ${entry.testTitle}`.toLowerCase().includes('listening')
          return track === 'listening' ? isListeningAttempt : !isListeningAttempt
        })
        .map((entry) => entry.testId),
    )
  }, [track, user?.id])

  const rows = useMemo<CompactIeltsTestRow[]>(() => {
    if (track === 'reading') {
      const liveRows = getIeltsReadingUnifiedCatalog().map((entry) => ({
        id: entry.testId,
        number: entry.index,
        title: entry.title,
        subtitle: entry.source === 'roadmap' ? 'Original passages combined' : 'Independent academic test',
        badge: 'Full test',
        durationMinutes: 60,
        detail: `3 passages · ${entry.index === 10 ? 41 : 40} questions`,
        available: isAvailableIeltsTrackTest('reading', entry.testId),
        completed: completedTestIds.has(entry.testId),
      }))

      const upcomingRows: CompactIeltsTestRow[] = Array.from({ length: 8 }, (_, index) => {
        const number = index + 23
        return {
          id: `reading-upcoming-${number}`,
          number,
          title: `Reading Full Test ${number}`,
          subtitle: 'New full test in preparation',
          badge: 'Full test',
          durationMinutes: 60,
          detail: '3 passages · 40 questions',
          available: false,
        }
      })

      return [...liveRows, ...upcomingRows]
    }

    return getIeltsFullTestCatalog('listening').map((entry) => ({
      id: entry.testId,
      number: entry.index,
      title: `Listening Full Test ${entry.index}`,
      subtitle: isAvailableIeltsTrackTest('listening', entry.testId) ? 'Complete academic listening simulation' : 'New full test in preparation',
      badge: 'Full test',
      durationMinutes: entry.testId === 'ielts-listening-19' ? 41 : entry.testId === 'ielts-listening-15' ? 32 : 30,
      detail: '4 parts · 40 questions',
      available: isAvailableIeltsTrackTest('listening', entry.testId),
      completed: completedTestIds.has(entry.testId),
    }))
  }, [completedTestIds, track])

  const visibleRows = useMemo(() => {
    const partNumber = activeFilter === 'full' ? null : Number(activeFilter.slice(5))
    const filteredByPart = partNumber
      ? rows.map((row) => ({
          ...row,
          title: `${track === 'listening' ? 'Listening' : 'Reading'} Part ${partNumber} · Test ${row.number}`,
          subtitle: row.available ? `Practice Part ${partNumber} from this test` : row.subtitle,
          badge: `Part ${partNumber}`,
          durationMinutes: track === 'reading' ? 20 : undefined,
          detail: `Part ${partNumber} · focused practice`,
        }))
      : rows
    const query = deferredSearchTerm.trim().toLowerCase()
    if (!query) return filteredByPart
    return filteredByPart.filter((row) => `${row.title} ${row.subtitle}`.toLowerCase().includes(query))
  }, [activeFilter, deferredSearchTerm, rows, track])

  if (!validSection) return <Navigate to="/ielts" replace />

  const handleLaunch = (row: CompactIeltsTestRow) => {
    if (!row.available) return
    if (trial.locked) {
      setShowTrialGate(true)
      return
    }
    trial.consume()
    const partNumber = activeFilter === 'full' ? null : Number(activeFilter.slice(5))
    const context = fromMock
      ? { entry: 'mock-ielts', from: navigationState?.from ?? 'tests', catalogFilter: activeFilter, catalogSkill: track }
      : { entry: 'ielts-catalog', catalogFilter: activeFilter, catalogSkill: track }
    navigate(`/test/${track}/${row.id}`, {
      state: partNumber
        ? { ...context, launchPreset: { mode: 'practice', partIndex: partNumber, ...(track === 'reading' ? { durationMinutes: 20 } : {}) } }
        : context,
    })
  }

  return (
    <>
      <AnimatePresence>
        {showTrialGate ? (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.button
              type="button"
              aria-label="Close"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
              onClick={() => setShowTrialGate(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.25, ease: CARD_EASE }}
              className="relative w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white p-7 text-center shadow-2xl"
            >
              <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-amber-700">
                <Crown className="h-3.5 w-3.5" /> Premium access
              </p>
              <h2 className="mt-4 text-2xl font-black text-slate-950">Free tests used</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Premium gives you unlimited IELTS tests.</p>
              <div className="mt-5 flex justify-center gap-2">
                <button type="button" onClick={() => setShowTrialGate(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700"> <UiText text={"Close"} /> </button>
                <button type="button" onClick={() => navigate('/premium')} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white"> <UiText text={"View Premium"} /> </button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <CompactIeltsCatalog
        embedded={embedded}
        section={track}
        rows={visibleRows}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={['full', 'part-1', 'part-2', 'part-3', ...(track === 'listening' ? ['part-4'] : [])].map((value) => ({ value, label: value === 'full' ? 'Full Test' : `Part ${value.slice(5)}` }))}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onBack={() => navigate(fromMock ? '/mock/ielts' : '/ielts', fromMock ? { state: { from: navigationState?.from } } : undefined)}
        onLaunch={handleLaunch}
        headerExtra={!trial.isPremium && Number.isFinite(trial.remaining) ? (
          <span className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-bold text-amber-700">
            <Sparkles className="h-3.5 w-3.5" />
            {Math.max(0, trial.remaining)} free
          </span>
        ) : undefined}
      />
    </>
  )
}
