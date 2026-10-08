import { useAuthStore } from '@/store/authStore'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import App from './App.tsx'
import MotionRuntime from './components/MotionRuntime.tsx'
import AnalyticsRuntime from './components/analytics/AnalyticsRuntime.tsx'
import './i18n/index.ts'
import './index.css'
import './styles/liquid.css'
import './styles/liquid-completion.css'
import './styles/workspace-refinement.css'
import './styles/ielts-exam-workspace.css'
import { startBuildFreshnessMonitor } from './utils/buildFreshness.ts'
import { recoverFromStaleBuild } from './utils/staleBuildRecovery.ts'

if (typeof window !== 'undefined') {
  try { document.documentElement.dataset.effects = localStorage.getItem('profai-effects') === 'reduced' ? 'reduced' : 'full' } catch { /* Optional preference. */ }
  window.addEventListener('vite:preloadError', () => {
    void recoverFromStaleBuild(new Error('vite:preloadError'))
  })
  startBuildFreshnessMonitor()
}

function AccountNavigation({ owner, children }: { owner: string; children: React.ReactNode }) {
  const location = useLocation()
  const navigationType = useNavigationType()
  const navigate = useNavigate()
  let entryOwner: string | null = null
  try { entryOwner = window.sessionStorage.getItem(`profai:history-entry:${location.key}`) } catch { /* History payloads remain optional. */ }
  const foreign = !!location.state && (entryOwner ? entryOwner !== owner : navigationType === 'POP')
  React.useLayoutEffect(() => {
    if (foreign) {
      navigate(location.pathname + location.search + location.hash, { replace: true, state: null })
      return
    }
    try { window.sessionStorage.setItem(`profai:history-entry:${location.key}`, owner) } catch { /* Review can use the account cache. */ }
  }, [foreign, location, navigate, owner])
  return foreign ? null : children
}

function AccountApplication() {
  const owner = useAuthStore((state) => state.user?.id ?? 'guest')
  const [readyOwner, setReadyOwner] = React.useState<string>()
  React.useLayoutEffect(() => {
    const history = window.history.state
    let previousOwner: string | null = null
    try { previousOwner = window.sessionStorage.getItem('profai:history-owner') } catch { /* Optional history cache. */ }
    if (previousOwner !== owner) {
      window.history.replaceState({ ...history, usr: null, profaiOwner: owner }, '')
    }
    try { window.sessionStorage.setItem('profai:history-owner', owner) } catch { /* Optional history cache. */ }
    setReadyOwner(owner)
  }, [owner])
  if (readyOwner !== owner) return null
  return (
    <BrowserRouter key={owner}>
      <AccountNavigation owner={owner}>
        <AnalyticsRuntime />
        <MotionRuntime>
          <App />
        </MotionRuntime>
      </AccountNavigation>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AccountApplication />
  </React.StrictMode>,
)
