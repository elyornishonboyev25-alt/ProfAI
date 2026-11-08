import assert from 'node:assert/strict'
import { act, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import { resolveTextQuote } from '@/utils/textRanges'
import { useReadingAnnotations } from '@/hooks/useReadingAnnotations'
import { accountStorageFor } from '@/utils/accountStorage'

function Paper() {
  const ref = useRef<HTMLDivElement>(null)
  useReadingAnnotations(ref, 'annotation-upgrade-fixture', 'annotation-owner', true)
  return <div ref={ref}><div data-reading-markable="1"><span>7</span> A clue with evidence for the answer.</div></div>
}
export async function run() {
  localStorage.clear()
  const host = document.createElement('div')
  host.textContent = 'one evidence A; two evidence B'
  const first = host.textContent.indexOf('evidence')
  const quote = resolveTextQuote(host, { start:first, end:first+8, text:'evidence', prefix:'two ', suffix:' B' })
  assert.equal(quote?.toString(), 'evidence')
  assert.equal(quote?.startOffset, host.textContent.lastIndexOf('evidence'), 'Context disambiguates repeated words after a layout update')
  const storage = accountStorageFor('annotation-owner')
  storage.setItem('annotation-upgrade-fixture', JSON.stringify([[{ start:21, end:29, text:'evidence', type:'note', group:'saved-note', note:'Original saved note' }]]))
  const root = createRoot(document.getElementById('root')!)
  try {
    await act(async () => root.render(<Paper />))
    const note = document.querySelector<HTMLElement>('.ielts-note')
    assert.equal(note?.textContent, 'evidence', 'Older offsets recover by exact quote after question labels change')
    assert.equal(note?.dataset.note, 'Original saved note')
    await act(async () => window.dispatchEvent(new Event('pagehide')))
    const saved = JSON.parse(storage.getItem('annotation-upgrade-fixture')!)[0][0]
    assert.ok(saved.prefix.includes('clue'))
    assert.ok(saved.suffix.includes('answer'))
    assert.equal(saved.note, 'Original saved note')
    console.log('PASS: annotation quote recovery preserves notes through label/layout updates and repeated words')
  } finally { await act(async () => root.unmount()) }
}
