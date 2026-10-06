import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import assert from 'node:assert/strict'
import i18n from '../../src/i18n/index'
import SharedShadowing from '../../src/pages/SharedShadowing'
import ShadowingPlayer from '../../src/components/shadowing/ShadowingPlayer'
import { guidedShadowing } from '../../src/data/educationalMedia'
import { loadYouTubeApi } from '../../src/lib/youtube'
import { prepareShadowingLesson } from '../../backend/src/services/shadowingLesson'
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
    assert.match(container.textContent!, /22 \/ 22 lessons/)
    assert.match(container.querySelector('.learning-card')!.textContent!, /Morgan Freeman/)
    assert.doesNotMatch(container.textContent!, /Elon Musk|WatchMojo|Steve Jobs/)
    assert.equal(container.querySelectorAll('form').length, 0, 'No unreviewed-link submission')
    await click(button('Next'))
    assert.match(container.querySelector('.learning-pagination')!.textContent!, /Page 2 \/ 2/)
    await click(button('Actors'))
    assert.match(container.querySelector('.learning-pagination')!.textContent!, /Page 1 \/ 2/)
    assert.equal(container.querySelectorAll('.learning-card').length, Math.min(12, SHADOWING_CATALOG.filter(item => item.category === 'Actors').length))
    await select(container.querySelector('select')!, 'A2')
    assert.match(container.textContent!, /No matching lessons/)
    await click(button('Reset filters'))
    await click(container.querySelector<HTMLButtonElement>('.learning-card'))
    assert.match(container.textContent!, /Audio sections need timed English captions/)
    assert.equal(container.querySelector('button[aria-label="Play audio 1"]'), null, 'Never invent speech boundaries when captions are offline')
    assert.ok(button('Retry captions'))
    assert.equal(button('I am ready — start practice')!.disabled, false, 'Caption download failures do not block full-video recording practice')
    assert.ok(SHADOWING_CATALOG.every(item => item.durationSec <= 120))

    // Cached phrase boundaries need not admit a complete 12–18s partition.
    const irregularCaptions = [0, 10, 20, 30].map((startSec, index) => ({
      id: `irregular:${index}`, orderIndex: index, startSec, endSec: startSec + 10,
      text: `Whole cached phrase ${index + 1}.`,
    }))
    const irregular = prepareShadowingLesson(irregularCaptions, 40)
    assert.equal(irregular.segments.length, 4, 'Keep shorter real boundaries when strict grouping is impossible')
    assert.equal(irregular.segments.map(section => section.text).join(' '), irregularCaptions.map(cue => cue.text).join(' '))
    const rolling = prepareShadowingLesson([
      { startSec: 0, endSec: 14, text: 'First overlapping caption.' },
      { startSec: 10, endSec: 24, text: 'Second overlapping caption.' },
      { startSec: 24, endSec: 39, text: 'Next complete phrase.' },
    ], 39)
    assert.deepEqual(rolling.segments.map(({ startSec, endSec }) => [startSec, endSec]), [[0, 24], [24, 39]], 'Keep overlapping captions intact and preserve the following section')
    assert.equal(prepareShadowingLesson([], 40).segments.length, 0, 'Missing captions still never invent speech boundaries')
    await render(<ShadowingPlayer video={{ ...guidedShadowing(SHADOWING_CATALOG[0]), durationSec: 40, captions: irregularCaptions, segments: [] }} onBack={() => {}} />)
    assert.equal(container.querySelectorAll('button[aria-label^="Play audio "]').length, 4)
    assert.doesNotMatch(container.textContent!, /no safe 12–18 second boundaries|Choose another lesson/)
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Play audio 1"]'))
    assert.equal(currentTime, 0, 'Fallback sections use the original caption start')
    assert.ok(container.querySelector('button[aria-label="Pause audio 1"]'), 'Fallback section can play')

    // Independent players let full video continue across every audio boundary.
    const originalPlayer = window.YT.Player
    const players: any[] = []
    window.YT.Player = class {
      constructor(element: HTMLElement, options: any) {
        const iframe = document.createElement('iframe')
        element.replaceWith(iframe)
        const state = { time: 0, seeks: [] as number[], pauses: 0, rate: 0 }
        const player = { ...fakePlayer,
          state, options,
          getCurrentTime: () => state.time,
          setPlaybackRate: (rate: number) => { state.rate = rate },
          seekTo: (time: number) => { state.time = time; state.seeks.push(time) },
          playVideo: () => options.events.onStateChange({ data: 1 }),
          pauseVideo: () => { state.pauses++; options.events.onStateChange({ data: 2 }) },
          destroy: () => iframe.remove(),
        }
        players.push(player)
        queueMicrotask(() => options.events.onReady({ target: player }))
        return player
      }
    } as any
    const captions = Array.from({ length: 45 }, (_, index) => ({ id: `cue:${index}`, orderIndex: index, startSec: index * 3, endSec: (index + 1) * 3, text: `Complete sentence ${index + 1}.` }))
    const prepared = prepareShadowingLesson(captions, 135)
    assert.equal(prepared.durationSec, 120)
    assert.equal(prepared.captions.length, 40)
    assert.equal(prepared.segments.length, 8)
    assert.ok(prepared.segments.every(section => section.endSec - section.startSec >= 12 && section.endSec - section.startSec <= 18))
    assert.equal(prepared.segments.map(section => section.text).join(' '), captions.slice(0, 40).map(cue => cue.text).join(' '), 'No words lost or duplicated at joins')
    const longCue = { startSec: 0, endSec: 22, text: 'One long cue without safe word boundaries.' }
    assert.deepEqual(prepareShadowingLesson([longCue], 22).segments, [{ ...longCue, orderIndex: 0 }], 'Play a long cue intact without inventing word timestamps')
    await render(<ShadowingPlayer video={{ ...guidedShadowing(SHADOWING_CATALOG[0]), durationSec: 135, segments: captions }} onBack={() => {}} />)
    const [full, sectionPlayer] = players
    assert.equal(full.state.rate, 1)
    assert.equal(sectionPlayer.state.rate, 1)
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Play video"]'))
    const fullPauses = full.state.pauses
    full.state.time = 16
    await wait(180)
    assert.equal(full.state.pauses, fullPauses, 'Full video never stops at audio-section boundaries')
    assert.match(container.textContent!, /Complete sentence 6/)
    await wait(1550)
    assert.equal(container.querySelector('button[aria-label="Pause video"]')!.getAttribute('data-controls-visible'), 'false', 'Center pause control auto-hides during playback')
    await click(container.querySelector<HTMLElement>('[data-testid="shadowing-stage"]'))
    assert.equal(container.querySelector('button[aria-label="Pause video"]')!.getAttribute('data-controls-visible'), 'true', 'Tap reveals controls without pausing')
    await click(container.querySelector<HTMLElement>('[data-testid="shadowing-stage"]'))
    assert.equal(container.querySelector('button[aria-label="Pause video"]')!.getAttribute('data-controls-visible'), 'false', 'Another tap dismisses the pause icon')
    await click(container.querySelector<HTMLElement>('[data-testid="shadowing-stage"]'))
    assert.equal(full.state.pauses, fullPauses, 'Clicking video outside central control does not pause')
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Pause video"]'))
    assert.equal(full.state.pauses, fullPauses + 1)
    assert.ok(container.querySelector('[data-testid="shadowing-stage"] iframe'), 'Paused frame stays visible without an opaque cover')
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Play video"]'))
    assert.equal(full.state.time, 16, 'Pause/resume preserves full-video position')
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Play audio 1"]'))
    await wait(100)
    sectionPlayer.state.time = 15.01
    await wait(180)
    assert.deepEqual(sectionPlayer.state.seeks, [0], 'Section plays once without automatic repeats or auto-next')
    assert.ok(container.querySelector('[aria-label="Completed"]'))
    assert.equal(full.state.time, 16, 'Audio player never seeks the full video')
    await click(container.querySelector<HTMLButtonElement>('button[aria-label="Play audio 2"]'))
    sectionPlayer.state.time = 70
    const audioPauses = sectionPlayer.state.pauses
    await wait(180)
    assert.equal(sectionPlayer.state.pauses, audioPauses, 'Stale buffered time does not finish a newly selected section')
    sectionPlayer.state.time = 15.2
    await wait(100)
    sectionPlayer.state.time = 30.01
    await wait(180)
    assert.equal(sectionPlayer.state.pauses, audioPauses + 1)
    await click(button('I am ready — start practice'))
    assert.match(container.textContent!, /Full video practice/)
    assert.equal(full.state.seeks.at(-1), 0)
    full.state.time = 0.2
    await wait(100)
    // Upload happens only after an explicit share click; local playback remains local.
    const originalPost = apiClient.post
    const previousRecorder = (globalThis as any).MediaRecorder
    const previousDevices = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices')
    const previousClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
    const uploads: any[] = []
    let copied = ''
    let stoppedTracks = 0
    let failUpload = false
    const recordedBytes = new Uint8Array([0x1a,0x45,0xdf,0xa3, ...Array(40).fill(1)])
    class FakeRecorder {
      static isTypeSupported(type: string) { return type.startsWith('audio/webm') }
      state = 'inactive'; mimeType = 'audio/webm'; ondataavailable: any; onstop: any
      start() { this.state = 'recording' }
      stop() { this.state = 'inactive'; this.ondataavailable?.({data:new Blob([recordedBytes], {type:this.mimeType})}); this.onstop?.() }
    }
    Object.defineProperty(globalThis, 'MediaRecorder', {value:FakeRecorder, configurable:true, writable:true})
    Object.defineProperty(navigator, 'mediaDevices', {value:{getUserMedia:async()=>({getTracks:()=>[{stop:()=>{stoppedTracks++}}]})}, configurable:true})
    Object.defineProperty(navigator, 'clipboard', {value:{writeText:async(value:string)=>{copied=value}}, configurable:true})
    apiClient.post = (async (path: string, body: any) => {
      assert.equal(path, '/shadowing-recordings')
      uploads.push(body)
      if (failUpload) throw new Error('Network offline')
      return {path:'/shared/shadowing/c000000000000000000000000'}
    }) as typeof apiClient.post
    try {
      await click(button('Record yourself'))
      await click(button('Stop recording'))
      assert.ok(stoppedTracks > 0, 'Microphone closes after stopping')
      assert.equal(uploads.length, 0)
      assert.ok(button('Share recording'))
      await click(button('Share recording'))
      assert.equal(uploads.length, 1)
      assert.equal(uploads[0].mimeType, 'audio/webm')
      assert.equal(uploads[0].audioBase64, btoa(String.fromCharCode(...recordedBytes)))
      assert.ok(uploads[0].durationSec > 0 && uploads[0].durationSec <= 120)
      assert.match(copied, /localhost:5199\/shared\/shadowing\/c/)
      assert.match(container.textContent!, /Link copied/)
      await click(button('Share recording'))
      assert.equal(uploads.length, 1, 'Re-sharing an unchanged recording reuses its link')
      const firstKey = uploads[0].recordingKey
      await click(button('Record yourself'))
      await click(button('Stop recording'))
      failUpload = true
      await click(button('Share recording'))
      assert.match(container.textContent!, /Could not share the recording/)
      assert.notEqual(uploads[1].recordingKey, firstKey, 'A new take never shares the old audio')
      failUpload = false
      await click(button('Share recording'))
      assert.equal(uploads[2].recordingKey, uploads[1].recordingKey, 'Retry preserves upload idempotency')
    } finally {
      apiClient.post = originalPost
      if (previousRecorder === undefined) delete (globalThis as any).MediaRecorder
      else (globalThis as any).MediaRecorder = previousRecorder
      if (previousDevices) Object.defineProperty(navigator,'mediaDevices',previousDevices)
      else delete (navigator as any).mediaDevices
      if (previousClipboard) Object.defineProperty(navigator,'clipboard',previousClipboard)
      else delete (navigator as any).clipboard
    }
    full.state.time = 120.1
    const endPauses = full.state.pauses
    await wait(180)
    assert.equal(full.state.pauses, endPauses + 1, 'Full practice stops at the two-minute clip boundary')
    await act(async () => full.options.events.onError({ data: 150 }))
    assert.match(container.querySelector('[role="alert"]')!.textContent!, /Playback could not load/)
    assert.ok(button('Retry player'))
    window.YT.Player = originalPlayer
    const savedYouTube = window.YT
    window.YT = undefined
    const failedLoad = loadYouTubeApi()
    const rejection = assert.rejects(failedLoad, /could not load/)
    document.getElementById('youtube-iframe-api')!.dispatchEvent(new Event('error'))
    await rejection
    assert.equal(document.getElementById('youtube-iframe-api'), null)
    const retryLoad = loadYouTubeApi()
    assert.ok(document.getElementById('youtube-iframe-api'), 'Failed API script can be retried')
    window.YT = savedYouTube
    window.onYouTubeIframeAPIReady!()
    await retryLoad

    let publicRequest = false
    apiClient.get = (async (path: string, options: any) => {
      assert.equal(path, '/shadowing-recordings/c000000000000000000000000')
      publicRequest = options.auth === false
      return {recording:{id:'c000000000000000000000000',title:'Morgan Freeman — shadowing',youtubeId:SHADOWING_CATALOG[0].youtubeId,durationSec:30,createdAt:new Date().toISOString()}}
    }) as typeof apiClient.get
    await render(<Routes><Route path="/shared/shadowing/:shareId" element={<SharedShadowing />} /></Routes>, '/shared/shadowing/c000000000000000000000000')
    assert.equal(publicRequest, true)
    assert.ok(container.querySelector('audio[controls]'))
    assert.match(container.querySelector('audio')!.getAttribute('src')!, /shadowing-recordings\/c.*\/audio/)
    assert.doesNotMatch(container.textContent!, /Dashboard|Login|IELTS|SAT/)
    let recordingPauses = 0
    container.querySelector('audio')!.pause = () => { recordingPauses++ }
    await click(button('Watch original video'))
    assert.equal(recordingPauses, 1, 'Original video pauses the shared voice recording')
    assert.match(container.querySelector('iframe')!.getAttribute('src')!, /end=120/)
    await act(async () => container.querySelector('audio')!.dispatchEvent(new Event('play')))
    assert.equal(container.querySelector('iframe'), null, 'Listening to the voice recording stops the original video')
    await click(button('Watch original video'))
    await click(button('Hide original video'))
    assert.equal(container.querySelector('iframe'), null)
    apiClient.get = (async () => { throw new Error('No recording') }) as typeof apiClient.get
    await render(<Routes><Route path="/shared/shadowing/:shareId" element={<SharedShadowing />} /></Routes>, '/shared/shadowing/missing')
    assert.match(container.querySelector('[role="alert"]')!.textContent!, /recording is unavailable/)

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
    console.log('PASS: 22/300-item libraries, duration boundaries and combinations, player controls, episode replacement, preference/bookmark isolation, pagination/filter reset, legacy exclusion, independent shadowing playback, one-pass audio, caption boundaries, two-minute clips, playback errors, public recording sharing, disappearing controls, planned links and Uzbek UI')
  } finally {
    apiClient.get = originalGet
    if (root) await act(async () => root!.unmount())
    await i18n.changeLanguage('en')
  }
}
