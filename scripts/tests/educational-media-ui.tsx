import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import assert from 'node:assert/strict'
import i18n from '../../src/i18n/index'
import ShadowingLab from '../../src/pages/ShadowingLab'
import Podcast from '../../src/pages/Podcast'
import { apiClient } from '../../src/lib/apiClient'
import { SHADOWING_CATALOG, PODCAST_CATALOG, matchesMediaDuration } from '../../src/data/educationalMedia'

const container = document.getElementById('root')!
let root: ReturnType<typeof createRoot> | undefined
let currentTime = 0
let seeks: number[] = []
let playerOptions: any
let playerHost: HTMLElement | undefined
let rates: number[] = []
let volumes: number[] = []
let captionCalls: string[] = []
let muted = false
let fullscreenRequests = 0
const fakePlayer = {
  getCurrentTime: () => currentTime, getDuration: () => 307, getVideoLoadedFraction: () => 1,
  getVolume: () => 100, getPlayerState: () => 2, setPlaybackRate(value: number) { rates.push(value) }, setVolume(value: number) { volumes.push(value) },
  loadModule(name: string) { captionCalls.push(`load:${name}`) }, unloadModule(name: string) { captionCalls.push(`unload:${name}`) }, setOption() {}, mute() { muted = true }, unMute() { muted = false }, destroy() { playerHost?.remove() },
  seekTo(value: number) { currentTime = value; seeks.push(value) },
  playVideo() { playerOptions.events.onStateChange({ data: 1, target: fakePlayer }) },
  pauseVideo() { playerOptions.events.onStateChange({ data: 2, target: fakePlayer }) },
}
async function render(node: React.ReactNode, path = '/') {
  if (root) await act(async () => root!.unmount())
  root = createRoot(container)
  await act(async () => root!.render(<MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>{node}</MemoryRouter>))
}
function button(label: string) { return [...document.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent?.trim() === label) }
async function click(element: HTMLElement | undefined | null) { assert.ok(element); await act(async () => element.click()) }
async function select(element: HTMLSelectElement, value: string) { await act(async () => { element.value = value; element.dispatchEvent(new Event('change', { bubbles: true })) }) }
async function wait(ms: number) { await act(async () => { await new Promise(resolve => setTimeout(resolve, ms)) }) }

export async function run() {
  await i18n.changeLanguage('en')
  window.YT = { PlayerState: { PLAYING: 1, PAUSED: 2, ENDED: 0, BUFFERING: 3, CUED: 5 }, Player: class {
    constructor(element: any, options: any) { assert.ok(element.isConnected, 'YouTube target must remain attached after switching episodes'); const iframe = document.createElement('iframe'); element.replaceWith(iframe); playerHost = iframe; playerOptions = options; queueMicrotask(() => options.events.onReady({ target: fakePlayer })); return fakePlayer }
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

    localStorage.setItem(`smarttest-podcast:curated-${PODCAST_CATALOG[0].youtubeId}`, JSON.stringify({ position: 42, bookmarks: [12] }))
    await render(<Podcast />)
    assert.equal(seeks.at(-1), 42, 'Saved progress survives initial mount')
    assert.deepEqual(JSON.parse(localStorage.getItem(`smarttest-podcast:curated-${PODCAST_CATALOG[0].youtubeId}`)!).bookmarks, [12])
    await render(<ShadowingLab />)
    localStorage.removeItem(`smarttest-podcast:curated-${PODCAST_CATALOG[0].youtubeId}`)
    await render(<Podcast />)
    assert.equal(container.querySelectorAll('.podcast-episode-card').length, 12)
    assert.match(container.textContent!, /300 episodes/)
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
    // Duration boundaries, combined filters, pagination reset and empty states.
    assert.equal(matchesMediaDuration(59, '1-10'), false)
    assert.equal(matchesMediaDuration(60, '1-10'), true)
    assert.equal(matchesMediaDuration(600, '1-10'), true)
    assert.equal(matchesMediaDuration(600, '10-30'), false)
    assert.equal(matchesMediaDuration(601, '10-30'), true)
    assert.equal(matchesMediaDuration(1800, '10-30'), true)
    assert.equal(matchesMediaDuration(1801, '30-60'), true)
    assert.equal(matchesMediaDuration(3600, '60+'), false)
    assert.equal(matchesMediaDuration(3601, '60+'), true)
    await click(button('Reset filters'))
    await click(button('Next'))
    await click(button('Previous'))
    assert.match(container.querySelector('.learning-pagination')!.textContent!, /Page 1/)
    await click(button('Next'))
    await select(container.querySelector<HTMLSelectElement>('select[aria-label="Duration"]')!, '10-30')
    assert.match(container.querySelector('.learning-pagination')!.textContent!, /Page 1/)
    let matching = PODCAST_CATALOG.filter(item => matchesMediaDuration(item.durationSec, '10-30'))
    assert.ok(matching.length >= 73)
    assert.match(container.querySelector('.podcast-library-heading')!.textContent!, new RegExp(`${matching.length} episodes`))
    assert.deepEqual([...container.querySelectorAll('.podcast-episode-title')].map(item => item.textContent), matching.slice(0, 12).map(item => item.title))
    await select(container.querySelector('select')!, 'A2')
    assert.match(container.textContent!, /No matching episodes/)
    await click(button('Reset filters'))
    assert.equal(container.querySelector<HTMLSelectElement>('select[aria-label="Duration"]')!.value, 'All')
    await click(button('Podcast sources'))
    assert.equal(container.querySelectorAll('.podcast-sources a').length, 3)
    await click(button('Podcast sources'))
    assert.equal(container.querySelector('.podcast-sources'), null)

    // Every player tool and the saved state that survives episode changes.
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Play"]'))
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Pause"]'))
    currentTime = 30
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Back 10 seconds"]'))
    assert.equal(seeks.at(-1), 20)
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Forward 10 seconds"]'))
    assert.equal(seeks.at(-1), 30)
    currentTime = 304
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Forward 10 seconds"]'))
    assert.equal(seeks.at(-1), 307, 'Forward seek is clamped to episode duration')
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Mute"]'))
    assert.equal(muted, true)
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Unmute"]'))
    assert.equal(muted, false)
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Playback speed"]'))
    await click(button('1.5×'))
    assert.equal(rates.at(-1), 1.5)
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Captions"]'))
    assert.ok(captionCalls.includes('unload:captions'))
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Captions"]'))
    assert.ok(captionCalls.includes('load:captions'))
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Settings"]'))
    await click(button('Large'))
    assert.equal(JSON.parse(localStorage.getItem('smarttest-podcast-prefs')!).captionSize, 2)
    await click(button('Loop whole video'))
    await act(async () => playerOptions.events.onStateChange({ data: 0, target: fakePlayer }))
    assert.equal(seeks.at(-1), 0, 'Whole-video looping restarts playback')
    await click(button('Loop whole video'))
    await act(async () => window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'a', bubbles: true })))
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Forward 10 seconds"]'))
    await act(async () => window.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'b', bubbles: true })))
    assert.match(document.body.textContent!, /A 0:00/)
    assert.match(document.body.textContent!, /B 0:10/)
    currentTime = 11
    await wait(510)
    assert.equal(seeks.at(-1), 0, 'A–B looping seeks to its start')
    await click(button('Clear'))
    await click(button('5m'))
    assert.match(container.textContent!, /Sleep in 5 min/)
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Settings"]'))
    await click(button('Off'))
    assert.match(container.textContent!, /Sleep timer off/)
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Settings"]'))
    await click(button('Keyboard shortcuts'))
    assert.match(container.textContent!, /Space \/ K/)
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Close"]'))
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Mini player"]'))
    assert.ok(container.querySelector('.podcast-shell.is-mini'))
    await click(button('Return player here'))
    assert.equal(container.querySelector('.podcast-shell.is-mini'), null)
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Theater mode"]'))
    assert.equal(JSON.parse(localStorage.getItem('smarttest-podcast-prefs')!).theater, true)
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Theater mode"]'))
    container.querySelector<HTMLElement>('.podcast-shell')!.requestFullscreen = async () => { fullscreenRequests++ }
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Fullscreen"]'))
    assert.equal(fullscreenRequests, 1)
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Forward 10 seconds"]'))
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Add bookmark"]'))
    const firstId = PODCAST_CATALOG[0].youtubeId
    const firstKey = `smarttest-podcast:curated-${firstId}`
    const savedFirst = JSON.parse(localStorage.getItem(firstKey)!)
    assert.equal(savedFirst.bookmarks.length, 1)
    const nextKey = `smarttest-podcast:curated-${PODCAST_CATALOG[1].youtubeId}`
    localStorage.setItem(nextKey, JSON.stringify({ position: 55, bookmarks: [15, 55] }))
    await click(container.querySelectorAll<HTMLButtonElement>('.podcast-episode-card')[1])
    assert.equal(playerOptions.videoId, PODCAST_CATALOG[1].youtubeId)
    assert.equal(rates.at(-1), 1.5, 'Current speed survives episode changes')
    assert.equal(seeks.at(-1), 55, 'Switching resumes the second episode')
    assert.deepEqual(JSON.parse(localStorage.getItem(firstKey)!).bookmarks, savedFirst.bookmarks)
    assert.deepEqual(JSON.parse(localStorage.getItem(nextKey)!).bookmarks, [15, 55], 'Previous bookmarks never overwrite new episode progress')
    await click(button('Transcript, bookmarks & practice tools'))
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Remove bookmark"]'))
    assert.deepEqual(JSON.parse(localStorage.getItem(nextKey)!).bookmarks, [55])
    await act(async () => playerOptions.events.onError({ data: 150, target: fakePlayer }))
    assert.ok(container.querySelector('[role="alert"] a'))
    assert.doesNotMatch(container.textContent!, /Loading player/)
    const intended = PODCAST_CATALOG.find(item => item.category === 'Admissions')!
    await render(<Podcast />, `/?video=${intended.youtubeId}`)
    assert.equal(playerOptions.videoId, intended.youtubeId, 'Study-plan links open the intended approved episode')
    await act(async () => playerOptions.events.onStateChange({ data: 0, target: fakePlayer }))
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Replay"]'))
    assert.equal(seeks.at(-1), 0)
    assert.ok(container.querySelector('button[aria-label="Pause"]'))
    const keyboardSelect = container.querySelector<HTMLSelectElement>('select[aria-label="Duration"]')!
    const seekCount = seeks.length
    await act(async () => keyboardSelect.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })))
    assert.equal(seeks.length, seekCount, 'Selecting filters does not trigger playback shortcuts')
    await act(async () => { await i18n.changeLanguage('uz') })
    await render(<Podcast />)
    assert.ok(container.querySelector('select[aria-label="Davomiylik"]'))
    assert.match(container.textContent!, /1–10 daqiqa/)
    await render(<ShadowingLab />)
    assert.match(container.textContent!, /Inglizcha nutq ritmini toping/)
    console.log('PASS: 100/300-item libraries, duration boundaries and combinations, player controls, episode replacement, preference/bookmark isolation, pagination/filter reset, legacy exclusion, offline guided loops, recording control, playback errors, planned links and Uzbek UI')
  } finally {
    apiClient.get = originalGet
    if (root) await act(async () => root!.unmount())
    await i18n.changeLanguage('en')
  }
}
