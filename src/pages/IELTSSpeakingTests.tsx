import { useDeferredValue, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Crown, Sparkles } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

import CompactIeltsCatalog, { type CompactIeltsTestRow } from '@/components/catalog/CompactIeltsCatalog'
import { useFeatureTrial } from '@/hooks/useFeatureTrial'
import { getCompletedSpeakingTestIds, getIeltsSpeakingDayCatalog } from '@/utils/ieltsSpeakingCatalog'
import { useAuthStore, type AuthState } from '@/store/authStore'

export default function IELTSSpeakingTests() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state: AuthState) => state.user)
  const navigationState = location.state as { entry?: string; from?: string } | null
  const fromMock = navigationState?.entry === 'mock-ielts'
  const speakingTrial = useFeatureTrial('speakingDaily')
  const [showTrialGate, setShowTrialGate] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const completedTestIds = useMemo(() => getCompletedSpeakingTestIds(user?.id), [user?.id])

  const rows = useMemo<CompactIeltsTestRow[]>(
    () =>
      getIeltsSpeakingDayCatalog().map((test, index) => ({
        id: test.id,
        number: index + 1,
        title: `Speaking Full Test ${index + 1}`,
        subtitle: test.subtitle,
        badge: `Part ${test.part}`,
        durationMinutes: test.durationMinutes,
        detail: 'AI feedback',
        available: test.available,
        completed: completedTestIds.has(test.id),
      })),
    [completedTestIds],
  )

  const visibleRows = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase()
    if (!query) return rows
    return rows.filter((row) => `${row.title} ${row.subtitle} ${row.badge}`.toLowerCase().includes(query))
  }, [deferredSearchTerm, rows])

  const handleLaunch = (row: CompactIeltsTestRow) => {
    if (speakingTrial.locked) {
      setShowTrialGate(true)
      return
    }
    speakingTrial.consume()
    navigate(`/ielts/speaking/test/${row.id}`, {
      state: fromMock
        ? { entry: 'mock-ielts', from: navigationState?.from ?? 'tests' }
        : { entry: 'ielts-speaking' },
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
              className="relative w-full max-w-md rounded-[1.75rem] bg-white p-7 text-center shadow-2xl"
            >
              <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-amber-700">
                <Crown className="h-3.5 w-3.5" /> Premium access
              </p>
              <h2 className="mt-4 text-2xl font-black text-slate-950">Free sessions used</h2>
              <p className="mt-2 text-sm text-slate-600">Premium gives you unlimited AI speaking feedback.</p>
              <div className="mt-5 flex justify-center gap-2">
                <button type="button" onClick={() => setShowTrialGate(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700">Close</button>
                <button type="button" onClick={() => navigate('/premium')} className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white">View Premium</button>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <CompactIeltsCatalog
        section="speaking"
        rows={visibleRows}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onBack={() => navigate(fromMock ? '/mock/ielts' : '/ielts')}
        onLaunch={handleLaunch}
        headerExtra={!speakingTrial.isPremium && Number.isFinite(speakingTrial.remaining) ? (
          <span className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-bold text-amber-700">
            <Sparkles className="h-3.5 w-3.5" />
            {Math.max(0, speakingTrial.remaining)} free
          </span>
        ) : undefined}
      />
    </>
  )
}
