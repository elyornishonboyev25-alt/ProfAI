import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { MemoryRouter } from 'react-router-dom'
import assert from 'node:assert/strict'
import AccountProfile from '../../src/pages/AccountProfile'
import { ProfileAvatar, DEFAULT_PROFILE_AVATAR } from '../../src/components/profile/ProfileAvatar'
import { Avatar } from '../../src/features/learningCenter/components'
import { useAuthStore } from '../../src/store/authStore'
import { useProfileIdentitySync } from '../../src/hooks/useProfileIdentitySync'

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
  assert.match(DEFAULT_PROFILE_AVATAR, /^data:image\/jpeg;base64,/, 'Fallback must work without an asset request')
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
  await render(null)
  function IdentitySync() { useProfileIdentitySync(); return null }
  const savedUser = useAuthStore.getState().user!
  globalThis.fetch = async () => Response.json({ user: { ...savedUser, fullName: 'Server Name', avatarUrl: '/server-photo.jpg' } })
  await render(<IdentitySync />)
  assert.equal(useAuthStore.getState().user!.avatarUrl, '/server-photo.jpg', 'Opening the app refreshes a stale cached photo')
  assert.equal(useAuthStore.getState().user!.fullName, 'Server Name')
  await render(null)
  let respond!: (response: Response) => void
  globalThis.fetch = () => new Promise<Response>((resolve) => { respond = resolve })
  await render(<IdentitySync />)
  await act(async () => useAuthStore.getState().setUserAvatar('/just-uploaded.jpg'))
  await act(async () => respond(Response.json({ user: { ...savedUser, avatarUrl: '/older-response.jpg' } })))
  assert.equal(useAuthStore.getState().user!.avatarUrl, '/just-uploaded.jpg', 'A delayed refresh must not replace a newly saved photo')
  await render(null)
  await render(<IdentitySync />)
  await act(async () => useAuthStore.getState().clearSession())
  await act(async () => respond(Response.json({ user: savedUser })))
  assert.equal(useAuthStore.getState().user, null, 'A late response must not restore a signed-out user')
  await act(async () => root.unmount())
  console.log('Profile UI passed: photo fallback and replacement, session sync, name validation, save, cancel, persistence and retry.')
}
