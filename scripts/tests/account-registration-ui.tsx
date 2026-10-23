import React, { act } from 'react'
import assert from 'node:assert/strict'
import { createRoot } from 'react-dom/client'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import EmailCodeForm from '../../src/components/auth/EmailCodeForm'
import ProtectedRoute from '../../src/components/auth/ProtectedRoute'
import { apiClient, ApiError } from '../../src/lib/apiClient'
import { useAuthStore } from '../../src/store/authStore'
import { accountReturnPath, isPublicAccountRoute } from '../../src/utils/accountAccess'
import '../../src/i18n'

export async function run() {
  const container = document.getElementById('root')!
  const root = createRoot(container)
  globalThis.sessionStorage = window.sessionStorage
  sessionStorage.clear()
  const originalPost = apiClient.post
  const calls: Array<{ path: string; body: Record<string, unknown>; auth?: boolean }> = []
  let failVerification = false
  let authenticated = 0
  const session = { user: { id: 'registration-user', onboardingCompleted: false }, accessToken: 'access', refreshToken: 'refresh' }
  apiClient.post = (async (path: string, body: Record<string, unknown>, options?: { auth?: boolean }) => {
    calls.push({ path, body, auth: options?.auth })
    if (path === '/auth/email/login' && failVerification) throw new ApiError('The verification code is incorrect.', 400, 'CODE_INVALID')
    return path === '/auth/verification/request' ? {} : session
  }) as typeof apiClient.post
  const input = async (id: string, value: string) => {
    const node = container.querySelector<HTMLInputElement>(`#${id}`)!
    assert.ok(node, `Missing input ${id}`)
    await act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!.call(node, value)
      node.dispatchEvent(new Event('input', { bubbles: true }))
    })
  }
  const submit = async () => { await act(async () => container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))) }
  const renderForm = async (intent: 'create-account' | 'sign-in') => {
    await act(async () => root.render(<MemoryRouter><EmailCodeForm key={intent} intent={intent} onAuthenticated={async payload => { assert.equal(payload.accessToken, 'access'); authenticated++ }} /></MemoryRouter>))
  }
  try {
    await renderForm('create-account')
    assert.equal(container.querySelector('input[type="password"]'), null, 'No password is requested for a new account')
    await input('auth-code-email', 'learner@example.com')
    await submit()
    assert.equal(calls.length, 0, 'Only Gmail addresses can request a code')
    await input('auth-code-email', 'Learner@GMAIL.com')
    await submit()
    assert.deepEqual(calls[0], { path: '/auth/verification/request', body: { email: 'learner@gmail.com', purpose: 'SIGN_IN' }, auth: false })
    assert.equal(calls[0].body.password, undefined)
    const deadline = JSON.parse(sessionStorage.getItem('ivygoo:email-code-challenge')!).expiresAt
    await act(async () => root.render(<MemoryRouter><EmailCodeForm key="reload" onAuthenticated={async () => { authenticated++ }} /></MemoryRouter>))
    assert.ok(container.querySelector('#auth-verification-code'), 'Reload restores the code step without sending another email')
    assert.equal(JSON.parse(sessionStorage.getItem('ivygoo:email-code-challenge')!).expiresAt, deadline, 'Reload preserves the original code deadline')
    assert.equal(calls.length, 1)
    await input('auth-verification-code', '12')
    await submit()
    assert.equal(calls.length, 1, 'An incomplete code is never submitted')
    await input('auth-verification-code', '123456')
    failVerification = true
    await submit()
    assert.equal(authenticated, 0, 'Rejected codes cannot create a session')
    assert.ok(container.querySelector('[role="alert"]'))
    failVerification = false
    await submit()
    assert.deepEqual(calls.at(-1), { path: '/auth/email/login', body: { email: 'learner@gmail.com', verificationCode: '123456' }, auth: false })
    assert.equal(authenticated, 1)
    assert.equal(sessionStorage.getItem('ivygoo:email-code-challenge'), null, 'A successful sign-in clears the pending challenge')
    await renderForm('sign-in')
    assert.equal(container.querySelector('input[type="password"]'), null)
    await input('auth-code-email', 'learner@gmail.com')
    await submit()
    assert.equal(calls.at(-1)!.body.purpose, 'SIGN_IN')
    await input('auth-verification-code', '123456')
    await submit()
    assert.equal(calls.at(-1)!.path, '/auth/email/login')
    assert.equal(calls.at(-1)!.body.password, undefined)
    assert.equal(authenticated, 2)

    for (const path of ['/dashboard', '/ielts', '/sat', '/account', '/profile', '/admission', '/learning-center/example', '/mock/sat/1']) assert.equal(isPublicAccountRoute(path), false, path)
    for (const path of ['/', '/login', '/register', '/premium', '/learning-center', '/shared/example']) assert.equal(isPublicAccountRoute(path), true, path)
    assert.equal(accountReturnPath({ pathname: '/ielts/tests', search: '?skill=reading', hash: '#mocks' }), '/ielts/tests?skill=reading#mocks')
    for (const pathname of ['//other.example', 'https://other.example', '/onboarding', '/focus', '/login', '/register', '/\\other.example']) assert.equal(accountReturnPath({ pathname }), '/dashboard')

    let privateMounts = 0
    function PrivateContent() { privateMounts++; return <p>Private dashboard</p> }
    function LoginDestination() { const location = useLocation(); return <output>{location.pathname}:{location.state?.from?.pathname}{location.state?.from?.search}{location.state?.from?.hash}</output> }
    useAuthStore.setState({ hydrated: true, user: null, accessToken: null })
    await act(async () => root.render(<MemoryRouter key="access-check" initialEntries={['/dashboard?view=week#results']}><Routes><Route path="/dashboard" element={<ProtectedRoute><PrivateContent /></ProtectedRoute>} /><Route path="/login" element={<LoginDestination />} /></Routes></MemoryRouter>))
    assert.equal(privateMounts, 0, 'Guest access never mounts private content')
    assert.match(container.textContent!, /\/login:\/dashboard\?view=week#results/)
    console.log('Account registration, code sign-in, private access and return destinations passed.')
  } finally {
    apiClient.post = originalPost
    await act(async () => root.unmount())
    useAuthStore.getState().clearSession()
  }
}
