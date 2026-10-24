import assert from 'node:assert/strict'
import { StrictMode, act, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import FullMockSectionGate from '@/components/ielts/FullMockSectionGate'
import MockIELTS from '@/pages/MockIELTS'
import { accountStorageFor } from '@/utils/accountStorage'
import { fullMockLaunchState, getFullMockById, getFullMockOverallBand, saveFullMockSectionResult } from '@/utils/ieltsMockCatalog'

export async function run() {
  const element = document.getElementById('root')!
  const mock = getFullMockById('full-mock-1')!
  let root: ReturnType<typeof createRoot> | undefined
  let mounts = 0
  let fullscreenCalls = 0
  let path = ''
  const oldFullscreen = document.documentElement.requestFullscreen
  document.documentElement.requestFullscreen = async () => { fullscreenCalls++ }
  function Runner() { useEffect(() => { mounts++ }, []); path = useLocation().pathname; return <div data-runner>Actual exam runner</div> }
  const unmount = async () => { if (root) await act(async () => root!.unmount()); root = undefined }
  const mount = async (path: string, state?: unknown, strict = false) => {
    await unmount()
    root = createRoot(element)
    const tree = <MemoryRouter initialEntries={[{ pathname: path.split('?')[0], search: path.includes('?') ? '?' + path.split('?')[1] : '', state }]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes>
      <Route path="/test/:type/:id" element={<FullMockSectionGate><Runner /></FullMockSectionGate>} />
      <Route path="/ielts/:section/test/:id" element={<FullMockSectionGate><Runner /></FullMockSectionGate>} />
      <Route path="/mock/ielts" element={<MockIELTS embedded />} />
      <Route path="/mock/ielts/:mockId" element={<div>Exam overview</div>} />
    </Routes></MemoryRouter>
    await act(async () => root!.render(strict ? <StrictMode>{tree}</StrictMode> : tree))
  }
  try {
    localStorage.clear()
    for (const section of mock.sections) {
      mounts = 0
      await mount(section.launchPath!, fullMockLaunchState(mock.id, section.key), true)
      assert.ok(mounts > 0, 'Every runner starts immediately, including StrictMode')
      assert.ok(element.querySelector('[data-runner]'))
      assert.equal(element.querySelector('video'), null)
      assert.equal(element.querySelector('.full-mock-intro'), null)
      await mount(section.launchPath! + '?mock=' + mock.id)
      assert.equal(path, section.launchPath, 'Reload without history state restores the same mock section')
      assert.ok(element.querySelector('[data-runner]'))
      saveFullMockSectionResult(mock.id, section.key, { band: 7, testId: section.key, completedAt: '2026-10-12' })
    }
    await mount(mock.sections[3].launchPath!, fullMockLaunchState(mock.id, 'speaking'))
    assert.ok(element.textContent?.includes('Exam overview'), 'Completed mocks open results rather than another test')
    await mount('/test/listening/listening-full-1')
    assert.ok(element.querySelector('[data-runner]'), 'Standalone practice still opens normally')
    await mount(mock.sections[0].launchPath!, { ...fullMockLaunchState(mock.id, 'listening'), reviewPayload: { result: {} } })
    assert.ok(element.querySelector('[data-runner]'), 'Saved review bypasses exam order redirects')
    const second = getFullMockById('full-mock-2')!
    await mount(second.sections[3].launchPath!, fullMockLaunchState(second.id, 'speaking'))
    assert.equal(path, second.sections[0].launchPath, 'Stale later route goes directly to the first unfinished runner')
    await mount('/mock/ielts')
    await act(async () => element.querySelector<HTMLButtonElement>('[aria-label="Retake Full Mock 1"]')!.click())
    assert.ok(element.querySelector('[data-runner]'), 'Retake opens Listening immediately')
    assert.equal(element.querySelector('video'), null)
    assert.equal(fullscreenCalls, 1)
    localStorage.clear()
    await mount('/mock/ielts')
    await act(async () => element.querySelector<HTMLButtonElement>('button.mock-ielts-card-open')!.click())
    assert.ok(element.querySelector('[data-runner]'), 'Start opens Listening without an intermediate screen')
    assert.equal(element.querySelector('video'), null)
    assert.equal(fullscreenCalls, 2)
    // https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail
    for (const [bands, expected] of [
      [[6.5, 6.5, 5, 7], 6.5], [[4, 3.5, 4, 4], 4], [[6.5, 6.5, 5.5, 6], 6],
      [[6.5, 6.5, 7, 7], 7], [[0, 0, 0, 0], 0], [[9, 9, 9, 9], 9],
    ] as [number[], number][]) {
      mock.sections.forEach((section, n) => saveFullMockSectionResult('full-mock-3', section.key, { band: bands[n], testId: 'qa', completedAt: '2026-10-12' }))
      assert.equal(getFullMockOverallBand('full-mock-3'), expected)
    }
    assert.equal(getFullMockOverallBand('full-mock-4'), null, 'All four grades are required')
    await unmount()
    localStorage.clear()
    accountStorageFor('guest').setItem('ielts_test_session_listening-full-1:mock:full-mock-1', JSON.stringify({ isTestActive: true, deadline: Date.now() - 1 }))
    await mount(mock.sections[0].launchPath!, fullMockLaunchState(mock.id, 'listening'))
    assert.ok(element.querySelector('[data-runner]'), 'Expired saved sessions still reach the runner to submit')
    console.log('PASS: all four sections start without video; reload, StrictMode, stale routes, review, fullscreen, retake and official IELTS rounding')
  } finally {
    await unmount()
    document.documentElement.requestFullscreen = oldFullscreen
    localStorage.clear()
  }
}
