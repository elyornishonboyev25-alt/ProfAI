import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './i18n/index.ts'
import './index.css'
import { recoverFromStaleBuild } from './utils/staleBuildRecovery.ts'

if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', () => {
    void recoverFromStaleBuild(new Error('vite:preloadError'))
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
