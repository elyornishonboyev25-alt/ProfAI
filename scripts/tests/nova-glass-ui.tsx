import assert from 'node:assert/strict'
import { mapWritingAnchors } from '@/lib/novaWritingMapping'
import { writingVersion } from '@/lib/novaStudy'
import { acquireNovaAudio, interruptNovaAudio, novaAudioOwner } from '@/lib/novaAudioOwnership'

export async function run() {
  const text = '\u{1f60a} I has a plan. She has a plan.'
  const start = text.indexOf('has')
  const anchors = [{ id: 'verb', version: writingVersion(text), start, end: start + 3, quote: 'has', kind: 'grammar' as const, message: 'Check agreement.', hint: 'Try have.' }]
  let next = mapWritingAnchors(text, 'Today: ' + text, anchors)
  assert.equal(next[0].start, start + 7)
  next = mapWritingAnchors('Today: ' + text, 'Today: ' + text + ' More.', next)
  assert.equal(next[0].start, start + 7)
  assert.equal(mapWritingAnchors(text, text.replace('has', 'have'), anchors).length, 0, 'Editing the quote invalidates rather than marking the repeated verb')
  assert.equal(mapWritingAnchors(text, text.slice(0, start) + 'hXas' + text.slice(start + 3), anchors).length, 0)
  assert.equal(mapWritingAnchors(text, text.slice(3), anchors)[0].start, start - 3, 'Emoji offsets use native UTF-16 indices')
  assert.equal(mapWritingAnchors(text, text, [{ ...anchors[0], version: 'stale' }]).length, 0)
  const repeated = 'has has'
  const repeatedAnchor = [{ ...anchors[0], start: 0, end: 3, version: writingVersion(repeated) }]
  assert.equal(mapWritingAnchors(repeated, 'has has has', repeatedAnchor, { start: 0, end: 0 })[0].start, 4, 'Native edit ranges distinguish an inserted duplicate from the original quote')
  let stopCoach = 0, stopOriginal = 0
  const old = acquireNovaAudio('coach', () => { stopCoach++ })
  const current = acquireNovaAudio('original', () => { stopOriginal++ })
  old(); assert.equal(novaAudioOwner(), 'original'); assert.equal(stopCoach, 1)
  interruptNovaAudio(); current(); assert.equal(stopOriginal, 1); assert.equal(novaAudioOwner(), null)
  let releaseNested = () => {}
  acquireNovaAudio('coach', () => { releaseNested = acquireNovaAudio('pronunciation', () => {}) })
  const overtaken = acquireNovaAudio('original', () => {})
  assert.equal(novaAudioOwner(), 'pronunciation', 'Reentrant cancellation cannot overwrite the newer lease')
  overtaken(); assert.equal(novaAudioOwner(), 'pronunciation'); releaseNested(); assert.equal(novaAudioOwner(), null)
  console.log('PASS: Unicode and duplicate-quote span mapping; overlap invalidation; exclusive audio, stale release and reentrant cancellation')
}
