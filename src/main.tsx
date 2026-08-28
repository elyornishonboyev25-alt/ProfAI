import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import MotionRuntime from './components/MotionRuntime.tsx'
import AnalyticsRuntime from './components/analytics/AnalyticsRuntime.tsx'
import './i18n/index.ts'
import './index.css'
import { startBuildFreshnessMonitor } from './utils/buildFreshness.ts'
import { recoverFromStaleBuild } from './utils/staleBuildRecovery.ts'

if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', () => {
    void recoverFromStaleBuild(new Error('vite:preloadError'))
  })
  startBuildFreshnessMonitor()
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AnalyticsRuntime />
      <MotionRuntime>
        <App />
      </MotionRuntime>
    </BrowserRouter>
  </React.StrictMode>,
)
