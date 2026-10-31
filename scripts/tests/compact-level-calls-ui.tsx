import React, { act } from 'react'
import assert from 'node:assert/strict'
import { createRoot } from 'react-dom/client'
import LearnerLevel, { LevelBadge } from '../../src/components/profile/LearnerLevel'
import IncomingCall from '../../src/components/community/IncomingCall'
import type { SpeakingCommunity } from '../../src/hooks/useSpeakingCommunity'
import i18n from '../../src/i18n'

export async function run() {
  await i18n.changeLanguage('en')
  // jsdom does not implement native modal dialogs; real browser QA covers focus trapping.
  window.HTMLDialogElement.prototype.showModal = function () { this.open = true }
  window.HTMLDialogElement.prototype.close = function () { this.open = false }
  const container = document.getElementById('root')!
  const root = createRoot(container)
  const click = async (text: string) => {
    const button = [...document.querySelectorAll<HTMLButtonElement>('button')].find(button => button.textContent?.trim() === text)
    assert.ok(button, `Missing button ${text}`)
    await act(async () => button.click())
  }
  try {
    await act(async () => root.render(<><LearnerLevel xp={860} /><LevelBadge xp={20200} /></>))
    assert.equal(container.querySelector('dialog'), null, 'Level details stay hidden before interaction')
    assert.equal(container.querySelector('.learner-level-panel'), null)
    assert.equal(container.querySelector('.learner-level-badge text')?.textContent, '4', 'Only the number is drawn inside the star')
    assert.equal(container.querySelector('.is-max text')?.textContent, '10')
    const trigger = container.querySelector<HTMLButtonElement>('.learner-level-trigger')!
    assert.match(trigger.getAttribute('aria-label')!, /Level 4/)
    await act(async () => trigger.click())
    assert.equal(container.querySelector<HTMLDialogElement>('dialog')?.open, true)
    assert.match(container.querySelector('dialog')!.textContent!, /640 XP/)
    assert.equal(container.querySelector('.learner-level-steps'), null, 'There is no large 1–10 ladder')
    await act(async () => container.querySelector<HTMLButtonElement>('.learner-level-close')!.click())
    assert.equal(container.querySelector('dialog'), null)
    await act(async () => trigger.click())
    await act(async () => container.querySelector('dialog')!.dispatchEvent(new Event('cancel', { bubbles: false })))
    assert.equal(container.querySelector('dialog'), null, 'Escape cancellation dismisses level details')

    const replies: boolean[] = []
    let blocks = 0
    const hub = {
      connected: true, busy: false, blockBusy: false, room: null,
      invitation: { id: 'call-1', from: { name: 'Caller', avatarUrl: null }, expiresAt: Date.now() + 60_000 },
      reply: (accept: boolean) => replies.push(accept), blockCaller: () => { blocks++ },
    } as unknown as SpeakingCommunity
    await act(async () => root.render(<IncomingCall hub={hub} />))
    assert.match(container.textContent!, /You can decline or let the call expire/)
    assert.deepEqual(replies, [], 'An incoming call never answers itself')
    assert.equal(blocks, 0)
    await click('Decline')
    assert.deepEqual(replies, [false])
    await click('Block caller')
    assert.ok(document.querySelector('[role="alertdialog"]'))
    await click('Cancel')
    assert.equal(blocks, 0, 'Cancel keeps the caller unblocked')
    await click('Block caller')
    await act(async () => document.querySelector<HTMLButtonElement>('[role="alertdialog"] .is-danger')!.click())
    assert.equal(blocks, 1)
    await act(async () => root.render(<IncomingCall hub={{ ...hub, invitation: null }} />))
    assert.equal(container.querySelector('.hub-invitation'), null)
    assert.equal(document.querySelector('[role="alertdialog"]'), null, 'Caller cancellation also removes the block confirmation')
    console.log('PASS: compact numbered stars, click-only level dialog, no 1–10 ladder, close/Escape, no automatic call acceptance, decline and confirmed caller blocking.')
  } finally { await act(async () => root.unmount()) }
}
