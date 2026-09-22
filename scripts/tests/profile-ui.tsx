import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import assert from 'node:assert/strict'
import AccountProfile from '../../src/pages/AccountProfile'
import { ProfileAvatar, DEFAULT_PROFILE_AVATAR } from '../../src/components/profile/ProfileAvatar'
import { Avatar } from '../../src/features/learningCenter/components'
import { useAuthStore } from '../../src/store/authStore'

const container = document.getElementById('root')!
const root = createRoot(container)
const image = () => container.querySelector('img')!
const input = () => container.querySelector<HTMLInputElement>('#profile-full-name')!
const button = (label: string) => container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`)!
async function click(element: HTMLElement) {
  assert.ok(element, 'Expected a button')
  await act(async () => element.click())
}
async function type(value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input(), value)
    input().dispatchEvent(new Event('input', { bubbles: true }))
  })
}
async function render(content: React.ReactNode) {
  await act(async () => root.render(content))
}

export async function run() {
  await render(<ProfileAvatar src="https://example.test/photo.jpg" />)
  assert.equal(image().getAttribute('src'), 'https://example.test/photo.jpg')
  assert.equal(image().getAttribute('referrerpolicy'), 'no-referrer')
  await act(async () => image().dispatchEvent(new Event('error')))
  assert.equal(image().getAttribute('src'), DEFAULT_PROFILE_AVATAR, 'Broken photos use the site avatar')
  await act(async () => image().dispatchEvent(new Event('error')))
  assert.equal(image().getAttribute('src'), DEFAULT_PROFILE_AVATAR, 'No fallback retry loop')
  await render(<ProfileAvatar src="/assets/avatars/learner-v3-01.png" />)
  assert.equal(image().getAttribute('src'), '/assets/avatars/learner-v3-01.png', 'A new selection replaces a failed photo')
  await render(<ProfileAvatar src={null} />)
  assert.equal(image().getAttribute('src'), DEFAULT_PROFILE_AVATAR)
  await render(<ProfileAvatar src="  " />)
  assert.equal(image().getAttribute('src'), DEFAULT_PROFILE_AVATAR)
  await render(<Avatar name="Learner" url="/missing.jpg" />)
  await act(async () => image().dispatchEvent(new Event('error')))
  assert.equal(image().getAttribute('src'), DEFAULT_PROFILE_AVATAR, 'Learning center uses the same fallback')

  const account = {
    fullName: 'Saved Learner', email: 'learner@example.test', nickname: 'learner',
    avatarUrl: '/assets/avatars/learner-v3-01.png', level: 1, xp: 0,
    profile: { country: 'Uzbekistan', phone: '12345' },
  }
  let failSave = false
  const writes: Record<string, unknown>[] = []
  globalThis.fetch = async (url, options) => {
    const path = String(url)
    if (path.endsWith('/profile/account') && options?.method === 'PUT') {
      const patch = JSON.parse(String(options.body))
      writes.push(patch)
      if (failSave) return new Response(JSON.stringify({ message: 'Please try again.' }), { status: 503 })
      account.fullName = patch.fullName
      return Response.json({ fullName: account.fullName, profile: account.profile })
    }
    if (path.endsWith('/profile/account')) return Response.json(account)
    if (path.endsWith('/profile/badges')) return Response.json({ badges: [] })
    throw new Error(`Unexpected request: ${path}`)
  }
  useAuthStore.setState({ user: {
    id: 'profile-ui-user', fullName: 'Stale Name', avatarUrl: '/stale.jpg', nickname: 'learner',
    email: account.email, role: 'USER', premium: false, xp: 0, level: 1, currentStreak: 0, onboardingCompleted: true,
  }, accessToken: 'test-token' })
  const page = () => <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><AccountProfile /></MemoryRouter>
  await render(page())
  assert.equal(container.querySelector('h1')!.textContent, 'Saved Learner')
  assert.equal(useAuthStore.getState().user!.avatarUrl, account.avatarUrl, 'Server photo refreshes the shared session')
  assert.equal(input(), null, 'The editor is hidden until the pencil is clicked')
  await click(button('Edit full name'))
  assert.equal(document.activeElement, input())
  await type('Canceled Name')
  await click(button('Cancel name editing'))
  assert.equal(writes.length, 0)
  assert.equal(input(), null)
  await click(button('Edit full name'))
  assert.equal(input().value, 'Saved Learner')
  await type(' ')
  await click(button('Save name'))
  assert.equal(writes.length, 0, 'Invalid names never reach the API')
  assert.ok(container.querySelector('[role="alert"]'))
  await type('  Updated Learner  ')
  await click(button('Save name'))
  assert.deepEqual(writes[0], { fullName: 'Updated Learner' }, 'Saving a name leaves other profile fields alone')
  assert.equal(container.querySelector('h1')!.textContent, 'Updated Learner')
  assert.equal(useAuthStore.getState().user!.fullName, 'Updated Learner')
  assert.equal(JSON.parse(localStorage.getItem('smart-test-pro-auth-v2')!).state.user.fullName, 'Updated Learner')
  assert.equal(input(), null)
  await render(null)
  await render(page())
  assert.equal(container.querySelector('h1')!.textContent, 'Updated Learner', 'Saved name survives remounting')

  failSave = true
  await click(button('Edit full name'))
  await type('Retry Learner')
  await click(button('Save name'))
  assert.equal(input().value, 'Retry Learner', 'Failed saves keep the draft for retry')
  assert.equal(useAuthStore.getState().user!.fullName, 'Updated Learner')
  assert.match(container.querySelector('[role="alert"]')!.textContent!, /Please try again/)
  failSave = false
  await click(button('Save name'))
  assert.equal(container.querySelector('h1')!.textContent, 'Retry Learner')
  await click(button('Edit full name'))
  await act(async () => input().dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })))
  assert.equal(input(), null)
  await act(async () => root.unmount())
  console.log('Profile UI passed: photo fallback and replacement, session sync, name validation, save, cancel, persistence and retry.')
}
