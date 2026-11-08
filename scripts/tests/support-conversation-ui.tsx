import React, { act } from 'react'
import assert from 'node:assert/strict'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import i18n from 'i18next'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import NotificationsBell from '../../src/components/layout/NotificationsBell'
import ReportConversation from '../../src/components/support/ReportConversation'
import { apiClient } from '../../src/lib/apiClient'
import { useAuthStore } from '../../src/store/authStore'

const container = document.getElementById('root')!
const now = '2026-11-08T05:00:00.000Z'
const adminReply = { id: 'answer', kind: 'ADMIN_REPLY', authorName: 'Admin Alex', title: 'Review fixed', message: 'Please review your results again.', createdAt: now }
function button(label: string) { const node = [...document.querySelectorAll<HTMLButtonElement>('button')].find(node => node.textContent?.trim() === label || node.getAttribute('aria-label') === label); assert.ok(node, label); return node }
const click = async (node: HTMLElement) => { await act(async () => node.click()) }
const settle = async () => { await act(async () => { await new Promise(resolve => setTimeout(resolve, 100)) }) }
async function fill(value: string) {
  await act(async () => {
    const node = document.querySelector('textarea')!
    Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')!.set!.call(node, value)
    node.dispatchEvent(new Event('input', { bubbles: true }))
  })
}
export async function run() {
  await i18n.use(initReactI18next).init({ lng: 'en', fallbackLng: 'en', resources: { en: { translation: {} }, uz: { translation: {} }, ru: { translation: {} } } })
  const original = { get: apiClient.get, post: apiClient.post, patch: apiClient.patch }
  const session = useAuthStore.getState()
  let failSend = true, failLoad = false, includeFollowUp = false, olderLoads = 0
  const posts: Array<{ path: string; body: any }> = []
  apiClient.get = (async (path: string) => {
    if (path === '/dashboard/notifications') return { notifications: useAuthStore.getState().user?.id === 'learner' ? [{ id: 'notification', title: adminReply.title, message: adminReply.message, metadata: { kind: 'ISSUE_REPORT_REPLY', reportIds: ['r1', 'r2'] }, readAt: null, createdAt: now, type: 'SYSTEM' }] : [], unreadCount: 1 }
    if (path === '/profile/badges') return { badges: [] }
    if (path.startsWith('/support/notifications/')) return { items: [{ id: 'r1', description: 'I cannot review my results.' }, { id: 'r2', description: 'My second issue.' }] }
    if (path.includes('/thread')) {
      if (failLoad) throw new Error('Offline')
      if (path.includes('before=')) { olderLoads++; return { items: [{ ...adminReply, id: 'older', message: 'Previous support response', createdAt: '2026-11-07T05:00:00.000Z' }], nextCursor: null } }
      return { report: { description: path.includes('/r2/') ? 'My second issue.' : 'I cannot review my results.', status: includeFollowUp ? 'OPEN' : 'RESOLVED', needsReply: includeFollowUp, createdAt: now }, items: [adminReply, ...(includeFollowUp ? [{ id: 'follow-up', kind: 'USER_REPLY', authorName: 'Learner', message: posts.at(-1)!.body.message, createdAt: '2026-11-08T05:01:00.000Z' }] : [])], nextCursor: 'answer' }
    }
    return { weeklyProgress: [] }
  }) as typeof apiClient.get
  apiClient.patch = (async () => ({ success: true })) as typeof apiClient.patch
  apiClient.post = (async (path: string, body: any) => { posts.push({ path, body }); if (failSend) throw new Error('Offline'); includeFollowUp = true; return { sent: true } }) as typeof apiClient.post
  const root = createRoot(container)
  const wrap = (content: React.ReactNode) => <I18nextProvider i18n={i18n}><MemoryRouter>{content}</MemoryRouter></I18nextProvider>
  try {
    useAuthStore.setState({ user: { id: 'learner', fullName: 'Learner', currentStreak: 0 } as any, hydrated: true })
    await act(async () => root.render(wrap(<NotificationsBell />))); await settle()
    await click(button('Notifications')); await settle()
    await click(button('Reply')); await settle()
    assert.equal(document.querySelectorAll('button button').length, 0, 'Reply and conversation controls must not be nested inside a notification button')
    assert.match(document.querySelector('.report-conversation')!.textContent!, /I cannot review my results.*Resolved.*Admin Alex.*Review fixed/s)
    const chooser = document.querySelector('select')!
    await act(async () => { chooser.value = 'r2'; chooser.dispatchEvent(new Event('change', { bubbles: true })) }); await settle()
    assert.match(document.querySelector('.report-conversation')!.textContent!, /My second issue/)
    assert.equal(button('Send reply').disabled, true)
    await fill('Can I review my saved tests?')
    await click(button('Send reply'))
    assert.match(document.querySelector('[role="alert"]')!.textContent!, /draft is saved/)
    assert.equal(document.querySelector('textarea')!.value, 'Can I review my saved tests?')
    failSend = false
    await click(button('Send reply')); await settle()
    assert.equal(posts.length, 2); assert.equal(posts[0].path, '/support/reports/r2/replies')
    assert.equal(posts[0].body.requestId, posts[1].body.requestId, 'Retrying a failed send keeps its idempotency key')
    assert.equal(document.querySelector('textarea')!.value, '')
    assert.match(document.querySelector('.report-conversation')!.textContent!, /Awaiting admin reply.*Can I review my saved tests\?.*Your reply was sent/s)
    await click(button('Load earlier messages'))
    assert.equal(olderLoads, 1); assert.match(document.querySelector('.report-conversation')!.textContent!, /Previous support response/)
    await click(button('Refresh conversation'))
    assert.equal([...document.querySelectorAll('button')].some(node => node.textContent === 'Load earlier messages'), false, 'Refreshing cannot lose an exhausted history cursor')
    await act(async () => i18n.changeLanguage('uz'))
    assert.ok(button('Javobni yuborish'))
    assert.match(document.querySelector('.report-conversation')!.textContent!, /Admin javobi kutilmoqda/)
    await act(async () => useAuthStore.setState({ user: { id: 'other', fullName: 'Other', currentStreak: 0 } as any })); await settle()
    assert.equal(document.querySelector('textarea'), null, 'Changing accounts removes the previous conversation')
    await click(button('Notifications')); await settle()
    assert.doesNotMatch(document.querySelector('[role="dialog"]')!.textContent!, /saved tests|Review fixed/)

    // A failed initial conversation fetch remains retryable.
    await act(async () => i18n.changeLanguage('en'))
    failLoad = true
    await act(async () => root.render(wrap(<ReportConversation reportId="r1" language="en" />)))
    assert.match(document.querySelector('[role="alert"]')!.textContent!, /Could not load/)
    failLoad = false
    await click(button('Refresh conversation'))
    assert.ok(document.querySelector('textarea'))
    console.log('PASS support conversations: notification Reply, batch report choice, full thread, send retry, reopened state, paged history, localization, account isolation and load recovery')
  } finally {
    await act(async () => root.unmount())
    Object.assign(apiClient, original)
    useAuthStore.setState({ user: session.user, accessToken: session.accessToken, refreshToken: session.refreshToken })
  }
}
