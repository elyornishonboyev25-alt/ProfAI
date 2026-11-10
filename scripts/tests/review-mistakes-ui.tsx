import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import assert from 'node:assert/strict'
import IELTS from '@/pages/IELTS'
import SAT from '@/pages/SAT'
import IELTSTestLibrary from '@/pages/IELTSTestLibrary'
import SATSection from '@/pages/SATSection'
import i18n from '@/i18n'

export async function run() {
  await i18n.changeLanguage('en')
  const container = document.getElementById('root')!
  localStorage.clear()
  const root = createRoot(container)
  try {
    for (const [path, page] of [['/ielts', <IELTS />], ['/sat', <SAT />]] as const) {
      await act(async () => root.render(
        <MemoryRouter key={path} initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path={path} element={page} />
            <Route path="/ielts/tests" element={<IELTSTestLibrary />} />
            <Route path="/sat/:section" element={<SATSection />} />
            <Route path="/profile" element={<h1>My Results</h1>} />
          </Routes>
        </MemoryRouter>,
      ))
      assert.doesNotMatch(container.textContent ?? '', /Mistake lab/i, `${path}: retired lab is not offered`)
      const results = [...container.querySelectorAll<HTMLButtonElement | HTMLAnchorElement>('button, a')].find((button) => button.textContent?.includes('My Results'))
      assert.ok(results, `${path}: My Results button is available`)
      await act(async () => results.click())
      assert.equal(container.querySelector('h1')?.textContent, 'My Results', `${path}: button opens My Results directly`)
    }
    console.log('PASS: IELTS and SAT result buttons open My Results directly without offering Mistake Labs')
  } finally { await act(async () => root.unmount()) }
}
