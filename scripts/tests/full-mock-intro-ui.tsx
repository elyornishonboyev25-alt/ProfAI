import assert from 'node:assert/strict'
import { StrictMode, act, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import FullMockSectionGate from '@/components/ielts/FullMockSectionGate'
import MockIELTS from '@/pages/MockIELTS'
import { accountStorageFor } from '@/utils/accountStorage'
import { useAuthStore } from '@/store/authStore'
import { fullMockLaunchState, getFullMockById, getFullMockOverallBand, saveFullMockSectionResult } from '@/utils/ieltsMockCatalog'

export async function run() {
  const element = document.getElementById('root')!
  const mock = getFullMockById('full-mock-1')!
  let root: ReturnType<typeof createRoot> | undefined
  let mounts = 0
  let fullscreenCalls = 0
  const oldFullscreen = document.documentElement.requestFullscreen
  document.documentElement.requestFullscreen = async () => { fullscreenCalls++ }
  function Runner() { useEffect(() => { mounts++ }, []); return <div data-runner>Actual exam runner</div> }
  const unmount = async () => { if (root) await act(async () => root!.unmount()); root = undefined }
  const mount = async (path: string, state: unknown, strict = false) => {
    await unmount()
    root = createRoot(element)
    const tree = <MemoryRouter initialEntries={[{ pathname: path, state }]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Routes>
      <Route path="/test/:type/:id" element={<FullMockSectionGate><Runner /></FullMockSectionGate>} />
      <Route path="/ielts/:section/test/:id" element={<FullMockSectionGate><Runner /></FullMockSectionGate>} />
      <Route path="/mock/ielts" element={<MockIELTS embedded />} />
      <Route path="/mock/ielts/:mockId" element={<div>Exam overview</div>} />
    </Routes></MemoryRouter>
    await act(async () => root!.render(strict ? <StrictMode>{tree}</StrictMode> : tree))
  }
  const click = async (text: string) => {
    const button = [...element.querySelectorAll<HTMLButtonElement>('button')].find(node => node.textContent?.trim() === text || node.getAttribute('aria-label') === text)
    assert.ok(button, `Missing ${text}`)
    await act(async () => button.click())
  }
  try {
    localStorage.clear()
    for (const section of mock.sections) {
      mounts = 0
      const state = fullMockLaunchState(mock.id, section.key)
      await mount(section.launchPath!, state, true)
      assert.equal(mounts, 0, 'Intro must not mount any exam code, microphone, audio or timer')
      assert.equal(element.querySelector('video')?.getAttribute('src'), `/media/ielts-intros/${section.key}.webm?v=3`)
      assert.equal(element.querySelectorAll('.full-mock-intro-journey li').length, 4)
      assert.equal(element.querySelector('.full-mock-intro-journey [aria-current="step"]')?.textContent?.includes(section.title), true)
      await mount(section.launchPath!, state)
      assert.equal(mounts, 0, 'Reload before starting still shows instructions')
      const video = element.querySelector('video')!
      await act(async () => video.dispatchEvent(new window.Event('ended')))
      assert.equal(mounts, 0, 'Video end is not permission to start a timed test')
      assert.ok(element.querySelector('.full-mock-intro-start')?.textContent?.includes('Start Test'))
      await click('Replay video')
      assert.equal(video.currentTime, 0)
      const chapters = [...element.querySelectorAll<HTMLButtonElement>('.full-mock-intro-chapters button')]
      assert.ok(chapters.length >= 5, 'Complete instructions have individually navigable chapters')
      const highlight = chapters.find(button => button.textContent?.includes('Highlighting text'))
      if (highlight) {
        await act(async () => highlight.click())
        assert.ok(video.currentTime > 24, 'Instruction chapters follow natural audio timing')
        assert.ok(element.querySelector('.full-mock-intro-caption strong')?.textContent?.includes('Highlighting text'))
        assert.equal(mounts, 0, 'Instruction chapter selection never starts the exam')
      }
      if (section.key === 'writing') {
        await act(async () => video.dispatchEvent(new window.Event('error')))
        assert.ok(element.textContent?.includes('Video unavailable'))
        assert.ok(element.textContent?.includes('Read all instructions'))
        await click('Start Writing')
      } else await click('Skip video & start')
      assert.equal(mounts, 1)
      assert.ok(element.querySelector('[data-runner]'))
      await mount(section.launchPath!, state)
      assert.ok(element.querySelector('[data-runner]'), 'Reload of a started section bypasses the intro to preserve deadlines')
      assert.equal(element.querySelector('video'), null)
      saveFullMockSectionResult(mock.id, section.key, { band: 7, testId: section.key, completedAt: new Date().toISOString() })
      console.log(`PASS: ${section.title}: no runner during intro, end, replay, skip/start, refresh`)
    }
    assert.equal(fullscreenCalls, 4, 'Every section start requests fullscreen in a user gesture')
    await mount('/test/listening/listening-full-1', null)
    assert.ok(element.querySelector('[data-runner]'), 'Standalone practice has no introduction')
    await mount('/test/listening/listening-full-1', { ...fullMockLaunchState(mock.id, 'listening'), reviewPayload: { result: {} } })
    assert.ok(element.querySelector('[data-runner]'), 'Saved attempt review has no introduction')
    const second = getFullMockById('full-mock-2')!
    await mount(second.sections[3].launchPath!, fullMockLaunchState(second.id, 'speaking'))
    assert.equal(element.querySelector('video')?.getAttribute('src'), '/media/ielts-intros/listening.webm?v=3', 'Stale later section redirects to first unfinished intro')
    await mount('/mock/ielts', null)
    const open = element.querySelector<HTMLButtonElement>('button.mock-ielts-card-open')!
    assert.ok(open)
    await act(async () => open.click())
    assert.equal(fullscreenCalls, 4, 'Review opens results without forcing fullscreen')
    assert.ok(element.textContent?.includes('Exam overview'), 'Completed mock Open shows results')
    await unmount()
    localStorage.clear()
    await mount('/mock/ielts', null)
    await act(async () => element.querySelector<HTMLButtonElement>('button.mock-ielts-card-open')!.click())
    assert.equal(element.querySelector('video')?.getAttribute('src'), '/media/ielts-intros/listening.webm?v=3', 'Fresh mock Open goes directly to Listening instructions')
    // Official IELTS examples, including upward .25 and .75 boundaries.
    for (const [bands, expected] of [
      [[6.5, 6.5, 5, 7], 6.5], [[4, 3.5, 4, 4], 4], [[6.5, 6.5, 5.5, 6], 6],
      [[6.5, 6.5, 7, 7], 7], [[0, 0, 0, 0], 0], [[9, 9, 9, 9], 9],
    ] as [number[], number][]) {
      mock.sections.forEach((section, n) => saveFullMockSectionResult('full-mock-3', section.key, { band: bands[n], testId: 'qa', completedAt: '2026-10-12' }))
      assert.equal(getFullMockOverallBand('full-mock-3'), expected)
    }
    assert.equal(getFullMockOverallBand('full-mock-4'), null, 'All four scores are required')
    await unmount()
    localStorage.clear()
    const legacyState = fullMockLaunchState(mock.id, 'listening')
    accountStorageFor('guest').setItem(`ielts_test_session_${mock.sections[0].launchPath!.split('/').pop()}:mock:${mock.id}`, JSON.stringify({ isTestActive: true, deadline: Date.now() - 1 }))
    await mount(mock.sections[0].launchPath!, legacyState)
    assert.ok(element.querySelector('[data-runner]'), 'Legacy active sessions bypass video so expired deadlines are still handled by the runner')
    await unmount()
    localStorage.clear()
    const originalPlay = window.HTMLMediaElement.prototype.play
    let calls = 0
    window.HTMLMediaElement.prototype.play = function () { calls++; return calls === 1 ? Promise.reject(new Error('Autoplay blocked')) : Promise.resolve() }
    await mount(mock.sections[0].launchPath!, fullMockLaunchState(mock.id, 'listening'))
    assert.ok(element.textContent?.includes('Enable sound'), 'Blocked sound autoplay has a visible recovery button')
    assert.equal(element.querySelector('video')?.muted, true)
    await click('Enable narration')
    assert.equal(element.querySelector('video')?.muted, false)
    window.HTMLMediaElement.prototype.play = originalPlay
    await unmount()
    accountStorageFor('guest').setItem('profai:full-mock:intro:v1:full-mock-1:listening', 'started')
    useAuthStore.getState().setSession({ user: { id: 'intro-qa', fullName: 'QA', email: 'intro@example.test', role: 'USER', premium: true, xp: 0, level: 1, currentStreak: 0 }, accessToken: 'local-qa', refreshToken: 'local-qa' })
    await mount(mock.sections[0].launchPath!, fullMockLaunchState(mock.id, 'listening'))
    assert.ok(element.querySelector('video'), 'A different account sees its own instructions')
    console.log('PASS: fullscreen Open/start, standalone and review bypass, stale route correction, autoplay recovery, account isolation, official overall band examples')
  } finally {
    await unmount()
    document.documentElement.requestFullscreen = oldFullscreen
    useAuthStore.getState().clearSession()
    localStorage.clear()
  }
}
