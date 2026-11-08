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
  const originalGet = apiClient.get, originalPost = apiClient.post, originalPatch = apiClient.patch
  let fail = true, changed = 0
  const requests: any[] = []
  apiClient.get = (async (path: string) => {
    if (path.endsWith('/replies')) return { items: [{ id: 'reply1', kind: 'ADMIN_REPLY', authorName: 'Admin Alex', authorEmail: 'admin@example.test', title: 'Review fixed', message: 'Please open the review section again.', readAt: null, createdAt: reports[0].createdAt }, { id: 'followup', kind: 'USER_REPLY', authorName: 'Learner A', message: 'Can I review my earlier tests?', createdAt: reports[1].createdAt }], nextCursor: null }
    return { reports: { items: reports.map(report => ({ ...report, needsReply: true, messages: report.id === 'r2' ? [{ message: 'Can I also review my earlier tests?', createdAt: report.createdAt }] : [] })), total: 3, page: 1, pageSize: 20 } }
  }) as typeof apiClient.get
  apiClient.post = (async (_path: string, body: any) => { requests.push(body); if (fail) { fail = false; throw new Error('Offline') } return { recipientCount: 2 } }) as typeof apiClient.post
  const statusRequests: any[] = []
  apiClient.patch = (async (path: string, body: any) => { statusRequests.push({ path, body }); return {} }) as typeof apiClient.patch
  const root = createRoot(container)
  try {
    await act(async () => root.render(<OwnerReportInbox language="en" reload={0} onChanged={() => changed++} />))
    assert.equal(container.querySelectorAll('.owner-report-card').length, 3)
    assert.equal(container.querySelectorAll('.owner-report-card.needs-reply').length, 3)
    assert.equal(container.querySelectorAll('.owner-pending-label').length, 3)
    assert.match(container.querySelectorAll('.owner-report-card')[1].textContent!, /Latest user reply.*Can I also review my earlier tests/s)
    assert.equal([...container.querySelectorAll('button')].some(node => node.textContent === 'Mark resolved'), false, 'Unanswered reports need a reply or explicit ignore')
    await click(button('Ignore'))
    assert.deepEqual(statusRequests, [{ path: '/support/owner/reports/r1', body: { status: 'IGNORED' } }])
    assert.equal(changed, 1)
    changed = 0
    assert.equal(button('Send notification').disabled, true)
    assert.match(container.textContent!, /Choose a report to reply to\./)
    await click(button('Select this page'))
    assert.match(container.textContent!, /2 recipients/, 'Duplicate reports do not inflate the recipient count')
    assert.match(container.textContent!, /Write a reply to enable sending\./)
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
    assert.equal(document.activeElement, container.querySelector('textarea'))
    await click(button('Reply history'))
    assert.match(container.querySelector('.owner-report-card')!.textContent!, /Admin Alex.*Delivered.*admin@example.test.*Review fixed.*Please open the review section again.*Can I review my earlier tests/s)
    await fill(container.querySelector('textarea')!, '   ')
    assert.equal(button('Send notification').disabled, true, 'Whitespace-only replies cannot be sent')
    await fill(container.querySelector('textarea')!, 'Tuzatildi')
    assert.equal(button('Send notification').disabled, false, 'Short replies use the default title')
    assert.match(container.querySelector('.owner-preview')!.textContent!, /An update on your report/)
    const titleInput = container.querySelector<HTMLInputElement>('input[placeholder="An update on your report"]')!
    await fill(titleInput, 'Hi')
    assert.equal(button('Send notification').disabled, true)
    assert.match(container.textContent!, /Use at least 3 characters for the title/)
    await fill(titleInput, '  ')
    assert.equal(button('Send notification').disabled, false)
    await click(button('Send notification'))
    assert.equal(requests.length, 3)
    assert.equal(requests[2].title, 'An update on your report')
    assert.equal(requests[2].message, 'Tuzatildi')
    assert.deepEqual(requests[2].reportIds, ['r1'])
    assert.equal(changed, 2)
    for (const [language, choose, write, defaultTitle] of [
      ['uz', 'Javob yozish uchun murojaatni tanlang.', 'Yuborish uchun javob matnini yozing.', 'Murojaatingiz bo‘yicha yangilik'],
      ['ru', 'Выберите обращение для ответа.', 'Напишите ответ, чтобы отправить его.', 'Ответ на ваше обращение'],
    ] as const) {
      await act(async () => root.render(<OwnerReportInbox language={language} reload={0} onChanged={() => changed++} />))
      assert.ok(container.textContent!.includes(choose))
      await click(container.querySelector('.owner-report-card button')!)
      assert.ok(container.textContent!.includes(write))
      await fill(container.querySelector('textarea')!, 'OK')
      assert.ok(container.querySelector('.owner-preview')!.textContent!.includes(defaultTitle))
      assert.equal(container.querySelector<HTMLButtonElement>('.owner-composer button[type="submit"]')!.disabled, false)
      await click(container.querySelector('.owner-composer button[type="submit"]')!)
      assert.equal(requests.at(-1).title, defaultTitle)
    }
    console.log('PASS support UI: individual and batch replies, validation guidance, short replies, default titles, translations, failure recovery, idempotent retry, history and keyboard focus')
  } finally {
    await act(async () => root.unmount())
    apiClient.get = originalGet; apiClient.post = originalPost; apiClient.patch = originalPatch
  }
}
