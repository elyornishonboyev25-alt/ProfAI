import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import assert from 'node:assert/strict'
import i18n from '../../src/i18n/index'
import ShadowingLab from '../../src/pages/ShadowingLab'
import Podcast from '../../src/pages/Podcast'
import { apiClient } from '../../src/lib/apiClient'
import { SHADOWING_CATALOG, PODCAST_CATALOG } from '../../src/data/educationalMedia'

const container = document.getElementById('root')!
let root: ReturnType<typeof createRoot> | undefined
let currentTime = 0
let seeks: number[] = []
let playerOptions: any
const fakePlayer = {
  getCurrentTime: () => currentTime, getDuration: () => 307, getVideoLoadedFraction: () => 1,
  getVolume: () => 100, getPlayerState: () => 2, setPlaybackRate() {}, setVolume() {},
  loadModule() {}, unloadModule() {}, setOption() {}, mute() {}, unMute() {}, destroy() {},
  seekTo(value: number) { currentTime = value; seeks.push(value) },
  playVideo() { playerOptions.events.onStateChange({ data: 1, target: fakePlayer }) },
  pauseVideo() { playerOptions.events.onStateChange({ data: 2, target: fakePlayer }) },
}
async function render(node: React.ReactNode, path = '/') {
  if (root) await act(async () => root!.unmount())
  root = createRoot(container)
  await act(async () => root!.render(<MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{node}</MemoryRouter>))
}
function button(label: string) { return [...container.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent?.trim() === label) }
async function click(element: HTMLElement | undefined | null) { assert.ok(element); await act(async () => element.click()) }
async function select(element: HTMLSelectElement, value: string) { await act(async () => { element.value = value; element.dispatchEvent(new Event('change', { bubbles: true })) }) }
async function wait(ms: number) { await act(async () => { await new Promise(resolve => setTimeout(resolve, ms)) }) }

export async function run() {
  await i18n.changeLanguage('en')
  window.YT = { PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0, BUFFERING: 3, CUED: 5 }, Player: class {
    constructor(_element: any, options: any) { playerOptions = options; queueMicrotask(() => options.events.onReady({ target: fakePlayer })); return fakePlayer }
  } as any }
  const originalGet = apiClient.get
  apiClient.get = (async () => { throw new Error('Caption provider offline') }) as typeof apiClient.get
  try {
    await render(<ShadowingLab />)
    assert.equal(container.querySelectorAll('.learning-card').length, 12)
    assert.match(container.textContent!, /100 \/ 100 lessons/)
    assert.doesNotMatch(container.textContent!, /Elon Musk|WatchMojo|Steve Jobs/)
    assert.equal(container.querySelectorAll('form').length, 0, 'No unreviewed-link submission')
    await click(button('Next'))
    assert.match(container.querySelector('.learning-pagination')!.textContent!, /Page 2 \/ 9/)
    await click(button('Academic English'))
    assert.equal(container.querySelector('.learning-pagination'), null)
    assert.equal(container.querySelectorAll('.learning-card').length, SHADOWING_CATALOG.filter(item => item.category === 'Academic English').length)
    await select(container.querySelector('select')!, 'C1')
    assert.match(container.textContent!, /No matching lessons/)
    await click(button('Reset filters'))
    await click(container.querySelector<HTMLButtonElement>('.learning-card'))
    assert.match(container.textContent!, /Guided shadowing|timed practice intervals/)
    assert.ok(container.querySelector('button[aria-label="Play line"]'))
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Play line"]'))
    assert.equal(seeks.at(-1), 0)
    currentTime = 6.1
    await wait(210)
    assert.equal(seeks.at(-1), 0, 'First repeat loops the selected six-second section')
    currentTime = 6.1
    await wait(210)
    assert.equal(seeks.at(-1), 6, 'Second repeat advances to the next section')
    await select(container.querySelector('select')!, '4')
    assert.match(container.textContent!, /0:00 – 0:04/)
    assert.ok(button('Record yourself'), 'Recording remains available without captions')
    await act(async () => playerOptions.events.onError({ data: 150, target: fakePlayer }))
    assert.match(container.querySelector('[role="alert"]')!.textContent!, /Playback could not load/)
    assert.match(container.querySelector('[role="alert"] a')!.getAttribute('href')!, /youtube\.com\/watch/)

    await render(<Podcast />)
    assert.equal(container.querySelectorAll('.podcast-episode-card').length, 12)
    assert.match(container.textContent!, /100 episodes/)
    await click(button('Admissions'))
    assert.equal(container.querySelectorAll('.podcast-episode-card').length, 12)
    assert.match(container.querySelector('.learning-pagination')!.textContent!, /Page 1 \/ 2/)
    await click(button('Next'))
    assert.equal(container.querySelectorAll('.podcast-episode-card').length, 3)
    await select(container.querySelector('select')!, 'A2')
    assert.match(container.textContent!, /No matching episodes/)
    await click(button('All topics'))
    assert.equal(container.querySelectorAll('.podcast-episode-card').length, 12, 'Changing filters resets pagination')
    assert.match(container.textContent!, /Talking about school/)
    const intended = PODCAST_CATALOG.find(item => item.category === 'Admissions')!
    await render(<Podcast />, `/?video=${intended.youtubeId}`)
    assert.equal(playerOptions.videoId, intended.youtubeId, 'Study-plan links open the intended approved episode')
    await act(async () => { await i18n.changeLanguage('uz') })
    await render(<ShadowingLab />)
    assert.match(container.textContent!, /Inglizcha nutq ritmini toping/)
    console.log('PASS: 100-item libraries, pagination/filter reset, legacy exclusion, offline guided loops, recording control, playback errors, planned links and Uzbek UI')
  } finally {
    apiClient.get = originalGet
    if (root) await act(async () => root!.unmount())
    await i18n.changeLanguage('en')
  }
}
