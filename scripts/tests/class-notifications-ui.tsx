import React, { act } from 'react'
import assert from 'node:assert/strict'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, useLocation } from 'react-router-dom'
import i18n from 'i18next'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import TeacherNotesPanel from '../../src/features/learningCenter/TeacherNotesPanel'
import NotificationsBell from '../../src/components/layout/NotificationsBell'
import { learningCenterApi } from '../../src/features/learningCenter/api'
import { apiClient } from '../../src/lib/apiClient'
import { useAuthStore } from '../../src/store/authStore'

const user = (id: string) => ({ id, fullName: 'Fixture Learner', currentStreak: 2 }) as any
const notes = [{ id: 'note', note: 'Finish Full Mock Test 1.\nThen review every mistake.', createdAt: new Date().toISOString(), author: { id: 'teacher', fullName: 'Alex Teacher', avatarUrl: null } }]
const inbox = [
  { id: 'note', title: 'New teacher note: Academy', message: notes[0].note, metadata: { kind: 'TEACHER_NOTE', authorName: 'Alex Teacher', centerSlug: 'academy' }, readAt: null as string | null, createdAt: notes[0].createdAt, type: 'SYSTEM' },
  { id: 'assignment', title: 'New class assignment: IELTS', message: 'Complete the full mock.', metadata: { kind: 'CLASS_ASSIGNMENT', centerSlug: 'academy', examTrack: 'IELTS' }, readAt: null as string | null, createdAt: notes[0].createdAt, type: 'SYSTEM' },
]
const container = document.getElementById('root')!
const button = (label: string) => {
  const item = [...document.querySelectorAll<HTMLButtonElement>('button')].find(item => item.textContent?.includes(label) || item.getAttribute('aria-label') === label)
  assert.ok(item, label); return item
}
const click = async (item: HTMLElement) => { await act(async () => item.click()) }
const settle = async () => { await act(async () => { await new Promise(resolve => setTimeout(resolve, 300)) }) }

export async function run() {
  await i18n.use(initReactI18next).init({ lng: 'en', fallbackLng: 'en', resources: { en: { translation: {} }, uz: { translation: {} }, ru: { translation: {} } } })
  const originalNote = learningCenterApi.addNote, originalGet = apiClient.get, originalPatch = apiClient.patch
  const root = createRoot(container)
  let failSend = true, failRead = false, failLoad = false, refreshes = 0, sent = '', route = ''
  learningCenterApi.addNote = async (_slug, _id, note) => { if (failSend) throw new Error('Offline'); sent = note; return {} }
  apiClient.get = (async (path: string) => {
    if (path === '/dashboard/notifications') {
      if (failLoad) throw new Error('Offline')
      return { notifications: useAuthStore.getState().user?.id === 'learner' ? inbox.map(item => ({ ...item })) : [], unreadCount: inbox.filter(item => !item.readAt).length }
    }
    if (path === '/profile/badges') return { badges: [] }
    return { weeklyProgress: [] }
  }) as typeof apiClient.get
  apiClient.patch = (async (path: string) => {
    if (failRead) throw new Error('Offline')
    for (const item of inbox) if (path.endsWith('/read-all') || path.includes(`/${item.id}/read`)) item.readAt = new Date().toISOString()
    return { success: true }
  }) as typeof apiClient.patch
  const wrap = (content: React.ReactNode) => <I18nextProvider i18n={i18n}><MemoryRouter>{content}</MemoryRouter></I18nextProvider>
  function Location() { route = useLocation().pathname; return null }
  try {
    await act(async () => root.render(wrap(<TeacherNotesPanel slug="academy" studentId="learner" notes={[]} onSent={async () => { refreshes++ }} />)))
    assert.equal(button('Save note').disabled, true)
    await act(async () => {
      const input = container.querySelector('textarea')!
      Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')!.set!.call(input, '  Finish Full Mock Test 1.  ')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await click(button('Save note'))
    assert.match(container.querySelector('[role="alert"]')!.textContent!, /draft is saved/)
    assert.equal(container.querySelector('textarea')!.value, '  Finish Full Mock Test 1.  ')
    failSend = false
    await click(button('Save note'))
    assert.equal(sent, 'Finish Full Mock Test 1.')
    assert.equal(refreshes, 1)
    assert.equal(container.querySelector('textarea')!.value, '')
    assert.match(container.querySelector('[role="status"]')!.textContent!, /sent to the student/)
    await act(async () => i18n.changeLanguage('uz'))
    assert.ok(button('Xabar yuborish'))
    await act(async () => i18n.changeLanguage('en'))

    useAuthStore.setState({ user: user('learner'), hydrated: true })
    await act(async () => root.render(wrap(<><NotificationsBell /><Location /></>)))
    await settle()
    assert.equal(container.querySelector('.profai-notifications-count')!.textContent, '2', 'Unread badge is fetched before opening the panel')
    await click(button('Notifications')); await settle()
    assert.ok(document.querySelector('[role="dialog"]'))
    const panel = document.querySelector('[role="dialog"]')!
    assert.ok(panel.textContent!.indexOf('Latest updates') < panel.textContent!.indexOf('day streak'), 'Teacher updates come first')
    failRead = true
    await click(button('Read full message'))
    assert.equal(button('Collapse message').getAttribute('aria-expanded'), 'true')
    assert.match(document.querySelector('[role="alert"]')!.textContent!, /Could not mark/)
    assert.equal(container.querySelector('.profai-notifications-count')!.textContent, '2', 'Failed read stays unread')
    failRead = false
    await click(button('Collapse message'))
    assert.equal(container.querySelector('.profai-notifications-count')!.textContent, '1')
    await click(button('Open assignment')); await settle()
    assert.equal(route, '/learning-center/academy/assignments')
    assert.ok(!document.querySelector('[role="dialog"]'), 'Assignment navigation closes the panel')

    // A fresh mount (returning to the site) retains read state from the server.
    await act(async () => root.render(wrap(<><NotificationsBell key="return" /><Location /></>)))
    await settle()
    assert.equal(container.querySelector('.profai-notifications-count'), null)
    await click(button('Notifications')); await settle()
    assert.equal(document.querySelectorAll('.profai-notification-unread').length, 0)
    await click(button('Read full message'))
    assert.match(button('Collapse message').textContent!, /Then review every mistake/)
    await act(async () => { document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })) }); await settle()
    assert.equal(document.activeElement?.getAttribute('aria-label'), 'Notifications')
    inbox[0].readAt = null
    failLoad = true
    await click(button('Notifications')); await settle()
    assert.match(document.querySelector('[role="alert"]')!.textContent!, /could not be refreshed/)
    failLoad = false
    await click(button('Try again')); await settle()
    assert.equal(container.querySelector('.profai-notifications-count')!.textContent, '1')
    failRead = true
    await click(button('Mark all read'))
    assert.equal(container.querySelector('.profai-notifications-count')!.textContent, '1')
    failRead = false
    await click(button('Mark all read')); await settle()
    assert.equal(container.querySelector('.profai-notifications-count'), null)
    await act(async () => useAuthStore.setState({ user: user('other') })); await settle()
    await click(button('Notifications')); await settle()
    assert.match(document.querySelector('[role="dialog"]')!.textContent!, /No updates yet/)
    assert.doesNotMatch(document.querySelector('[role="dialog"]')!.textContent!, /Finish Full Mock/)
    console.log('PASS class notifications: note draft recovery, delivery confirmation, localization, sign-in fetch, full note, assignment navigation, read persistence, refresh/read retries, account isolation and focus restoration')
  } finally {
    await act(async () => root.unmount())
    learningCenterApi.addNote = originalNote; apiClient.get = originalGet; apiClient.patch = originalPatch
  }
}
