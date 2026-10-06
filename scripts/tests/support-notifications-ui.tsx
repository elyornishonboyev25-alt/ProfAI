import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import assert from 'node:assert/strict'
import OwnerReportInbox from '../../src/components/support/OwnerReportInbox'
import { apiClient } from '../../src/lib/apiClient'

const reports = [
  { id: 'r1', userId: 'a', name: 'Learner A', email: 'a@example.test', category: 'BUG', description: 'Cannot review my SAT mistakes', pagePath: '/sat/question-bank', status: 'OPEN', createdAt: '2026-10-05T12:00:00Z' },
  { id: 'r2', userId: 'a', name: 'Learner A', email: 'a@example.test', category: 'BUG', description: 'The review page is not opening', pagePath: '/sat/question-bank', status: 'OPEN', createdAt: '2026-10-05T13:00:00Z' },
  { id: 'r3', userId: 'b', name: 'Learner B', email: 'b@example.test', category: 'BUG', description: 'Cannot review my SAT mistakes', pagePath: '/sat/question-bank', status: 'OPEN', createdAt: '2026-10-05T14:00:00Z' },
]
const container = document.getElementById('root')!
function button(label: string) { const item = [...container.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent?.trim() === label); assert.ok(item, label); return item }
async function click(element: HTMLElement) { await act(async () => element.click()) }
async function fill(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  await act(async () => {
    const prototype = element.tagName === 'TEXTAREA' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(prototype, 'value')!.set!.call(element, value)
    element.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
export async function run() {
  const originalGet = apiClient.get, originalPost = apiClient.post
  let fail = true, changed = 0
  const requests: any[] = []
  apiClient.get = (async (path: string) => {
    if (path.endsWith('/replies')) return { items: [{ id: 'reply1', title: 'Review fixed', message: 'Please open the review section again.', readAt: null, createdAt: reports[0].createdAt }] }
    return { reports: { items: reports, total: 3, page: 1, pageSize: 20 } }
  }) as typeof apiClient.get
  apiClient.post = (async (_path: string, body: any) => { requests.push(body); if (fail) { fail = false; throw new Error('Offline') } return { recipientCount: 2 } }) as typeof apiClient.post
  const root = createRoot(container)
  try {
    await act(async () => root.render(<OwnerReportInbox language="en" reload={0} onChanged={() => changed++} />))
    assert.equal(container.querySelectorAll('.owner-report-card').length, 3)
    assert.equal(button('Send notification').disabled, true)
    await click(button('Select this page'))
    assert.match(container.textContent!, /2 recipients/, 'Duplicate reports do not inflate the recipient count')
    await fill(container.querySelector<HTMLInputElement>('input[placeholder="An update on your report"]')!, 'Review fixed')
    await fill(container.querySelector('textarea')!, 'Your review page is fixed. Please try it again.')
    assert.equal(button('Send notification').disabled, false)
    assert.match(container.querySelector('.owner-preview')!.textContent!, /Review fixed/)
    await click(button('Send notification'))
    assert.match(container.querySelector('[role="alert"]')!.textContent!, /draft is saved/)
    assert.equal(container.querySelector('textarea')!.value, 'Your review page is fixed. Please try it again.')
    assert.equal(container.querySelectorAll('.owner-report-card').length, 3, 'A send failure must preserve the report list')
    await click(button('Send notification'))
    assert.equal(requests.length, 2)
    assert.equal(requests[0].requestId, requests[1].requestId, 'Retries use the same delivery ID')
    assert.deepEqual(requests[1].reportIds, ['r1', 'r2', 'r3'])
    assert.equal(changed, 1)
    assert.match(container.querySelector('[role="status"]')!.textContent!, /delivered to 2 users/)
    assert.equal(container.querySelector('textarea')!.value, '')
    assert.equal(button('Send notification').disabled, true)
    await click(button('Reply to user'))
    assert.match(container.textContent!, /1 recipients/)
    assert.equal(document.activeElement, container.querySelector('input[placeholder="An update on your report"]'))
    await click(button('Reply history'))
    assert.match(container.querySelector('.owner-report-card')!.textContent!, /Review fixed.*Delivered.*Please open the review section again/s)
    console.log('PASS support UI: individual and batch selection, unique recipients, preview, failure recovery, idempotent retry, history and keyboard focus')
  } finally {
    await act(async () => root.unmount())
    apiClient.get = originalGet; apiClient.post = originalPost
  }
}
