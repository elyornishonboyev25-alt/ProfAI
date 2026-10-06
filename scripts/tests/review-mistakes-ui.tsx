import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import assert from 'node:assert/strict'
import ReviewMistakes from '../../src/pages/ReviewMistakes'
import AnalyzeMistakes from '../../src/pages/AnalyzeMistakes'
import SATMistakes from '../../src/pages/SATMistakes'

export async function run() {
  const container = document.getElementById('root')!
  localStorage.clear()
  const root = createRoot(container)
  const render = async () => {
    await act(async () => root.render(
      <MemoryRouter initialEntries={['/review-mistakes']} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/review-mistakes" element={<ReviewMistakes />} />
          <Route path="/analyze-mistakes" element={<AnalyzeMistakes />} />
          <Route path="/sat/mistakes" element={<SATMistakes />} />
          <Route path="/profile" element={<output>My Results</output>} />
        </Routes>
      </MemoryRouter>,
    ))
  }
  await render()
  const ielts = container.querySelector<HTMLAnchorElement>('a[href="/analyze-mistakes"]')!
  const sat = container.querySelector<HTMLAnchorElement>('a[href="/sat/mistakes"]')!
  assert.ok(ielts, 'IELTS must be offered separately')
  assert.ok(sat, 'SAT must be offered separately')
  await act(async () => sat.click())
  assert.equal(container.querySelector('h1')?.textContent, 'SAT Mistake Lab')
  assert.equal(container.querySelector('a[aria-current="page"]')?.textContent, 'SAT')
  await act(async () => container.querySelector<HTMLAnchorElement>('a[href="/analyze-mistakes"]')!.click())
  assert.equal(container.querySelector('h1')?.textContent, 'IELTS Mistake Lab')
  assert.equal(container.querySelector('a[aria-current="page"]')?.textContent, 'IELTS')
  await act(async () => container.querySelector<HTMLAnchorElement>('a[href="/sat/mistakes"]')!.click())
  assert.equal(container.querySelector('h1')?.textContent, 'SAT Mistake Lab')
  await act(async () => root.unmount())
  console.log('Review Mistakes exam selection and switching passed.')
}
