import { useDeferredValue, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Crown, Sparkles } from 'lucide-react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'

import CompactIeltsCatalog, { type CompactIeltsTestRow } from '@/components/catalog/CompactIeltsCatalog'
import { useFeatureTrial } from '@/hooks/useFeatureTrial'
import { getReadingAnalysisHistory } from '@/utils/readingAnalysisStorage'
import {
  getIeltsPassageCatalog,
  getIeltsReadingUnifiedCatalog,
  isAvailableIeltsTrackTest,
  type IeltsTrackType,
} from '@/utils/ieltsTrackCatalog'
import { useAuthStore, type AuthState } from '@/store/authStore'

const CARD_EASE = [0.22, 1, 0.36, 1] as const

export default function IELTSSectionTests() {
  const navigate = useNavigate()
  const location = useLocation()
  const { section } = useParams<{ section: string }>()
  const user = useAuthStore((state: AuthState) => state.user)
  const validSection = section === 'reading' || section === 'listening'
  const track = (validSection ? section : 'reading') as IeltsTrackType
  const trial = useFeatureTrial(track)
  const [showTrialGate, setShowTrialGate] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const navigationState = location.state as { entry?: string; from?: string } | null
  const fromMock = navigationState?.entry === 'mock-ielts'

  const completedTestIds = useMemo(() => {
    if (track !== 'reading') return new Set<string>()
    return new Set(
      getReadingAnalysisHistory(user?.id)
        .filter((entry) => entry.correctAnswers > 0 && entry.totalQuestions > 0)
        .map((entry) => entry.testId),
    )
  }, [track, user?.id])

  const rows = useMemo<CompactIeltsTestRow[]>(() => {
    if (track === 'reading') {
      return getIeltsReadingUnifiedCatalog().map((entry) => ({
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
    }

    return getIeltsPassageCatalog('listening').map((entry) => ({
      id: entry.testId,
      number: entry.day,
      title: `Listening Full Test ${entry.day}`,
      subtitle: 'Focused listening practice',
      badge: 'Listening',
      durationMinutes: 20,
      detail: 'Audio questions',
      available: true,
    }))
  }, [completedTestIds, track])

  const visibleRows = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase()
    if (!query) return rows
    return rows.filter((row) => `${row.title} ${row.subtitle}`.toLowerCase().includes(query))
  }, [deferredSearchTerm, rows])

  if (!validSection) return <Navigate to="/ielts" replace />

  const handleLaunch = (row: CompactIeltsTestRow) => {
    if (!row.available) return
    if (trial.locked) {
      setShowTrialGate(true)
      return
    }
    trial.consume()
    navigate(`/test/${track}/${row.id}`, {
      state: fromMock
        ? { entry: 'mock-ielts', from: navigationState?.from ?? 'tests' }
        : { entry: 'ielts-catalog' },
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
              <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
                <Crown className="h-7 w-7" />
              </span>
              <h2 className="mt-4 text-2xl font-black text-slate-950">Free tests used</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">Premium gives you unlimited IELTS tests.</p>
              <div className="mt-5 flex justify-center gap-2">
                <button type="button" onClick={() => setShowTrialGate(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700">Close</button>
                <button type="button" onClick={() => navigate('/premium')} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white">View Premium</button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <CompactIeltsCatalog
        section={track}
        rows={visibleRows}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onBack={() => navigate(fromMock ? '/mock/ielts' : '/ielts')}
        onLaunch={handleLaunch}
        headerExtra={!trial.isPremium && Number.isFinite(trial.remaining) ? (
          <span className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 text-xs font-bold text-amber-200">
            <Sparkles className="h-3.5 w-3.5" />
            {Math.max(0, trial.remaining)} free
          </span>
        ) : undefined}
      />
    </>
  )
}
