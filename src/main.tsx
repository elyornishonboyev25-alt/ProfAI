import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import MotionRuntime from './components/MotionRuntime.tsx'
import './i18n/index.ts'
import './index.css'

if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault()

    const key = 'smarttest:preload-reload-once'
    const alreadyReloaded = window.sessionStorage.getItem(key) === '1'
    if (alreadyReloaded) return

    window.sessionStorage.setItem(key, '1')
    window.location.reload()
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <MotionRuntime>
        <App />
      </MotionRuntime>
    </BrowserRouter>
  </React.StrictMode>,
)

