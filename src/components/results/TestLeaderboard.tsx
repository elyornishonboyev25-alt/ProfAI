import { useCopy } from '@/i18n/interface'
import UiText from '@/components/common/UiText'
import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { apiClient } from '@/lib/apiClient'
import { SATLeaderboard, type StandingState } from '@/components/sat/SATResultSocial'
import type { SATStanding } from '@/features/sat/resultInsights'
import '@/components/sat/SATReview.css'
import '@/components/sat/SATResultsPro.css'
import '@/styles/ielts-results.css'

export default function TestLeaderboard({ testId, title, eligible = true }: { testId: string; title: string; eligible?: boolean }) {
  const { c: uiCopy } = useCopy()
  const owner = useAuthStore(state => state.user?.id)
  const [standing, setStanding] = useState<StandingState>({ status: 'loading' })
  const [reload, setReload] = useState(0)
  useEffect(() => {
    const refresh = () => setReload(value => value + 1)
    window.addEventListener('smarttest:attempt-submitted', refresh)
    return () => window.removeEventListener('smarttest:attempt-submitted', refresh)
  }, [])
  useEffect(() => {
    if (!owner) { setStanding({ status: 'guest' }); return }
    if (!eligible) { setStanding({ status: 'unavailable' }); return }
    let active = true
    setStanding({ status: 'loading' })
    void apiClient.get<SATStanding>(`/exam-results/ielts/${encodeURIComponent(testId)}/standing`).then(data => {
      if (active) setStanding({ status: 'ready', data })
    }).catch(() => { if (active) setStanding({ status: 'error' }) })
    return () => { active = false }
  }, [owner, testId, eligible, reload])
  return <section className="ielts-test-leaderboard sat-results" aria-label={uiCopy("Test leaderboard")}>
    <header className="ir-section-heading"><div><Trophy size={22} /><h2><UiText text={"Test leaderboard"} /></h2></div><button type="button" className="flow-button" onClick={() => setReload(value => value + 1)}><UiText text={"Refresh leaderboard"} /></button></header>
    <p className="mb-5 text-xs text-slate-500"><UiText text={title} /> <UiText text={"· First completed attempt per learner"} /></p>
    <SATLeaderboard standing={standing} onRetry={() => setReload(value => value + 1)} testTitle={title} sectioned={false} maximum={9} />
  </section>
}
