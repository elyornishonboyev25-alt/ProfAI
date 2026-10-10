import assert from 'node:assert/strict'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import OwnerAccountActivity from '@/components/owner/OwnerAccountActivity'
import { apiClient } from '@/lib/apiClient'

export async function run() {
  const element = document.getElementById('root')!
  const root = createRoot(element)
  const previousGet = apiClient.get
  let finishHistory: ((value: unknown) => void) | undefined
  const now = new Date().toISOString()
  const account = { id: 'one', fullName: 'Learner One', email: 'one@gmail.com', deviceCount: 2, onlineDevices: 1, lastSeenAt: now }
  const response = (items: unknown[]) => ({ items, total: items.length, page: 1, pageSize: 20, updatedAt: now, trackingSince: now,
    metrics: { onlineUsers: 1, totalDevices: 2, multipleDeviceAccounts: 1, logins: 3 } })
  apiClient.get = async <T,>(path: string) => {
    if (path.endsWith('/devices')) return { items: [{ deviceId: 'desktop', deviceType: 'DESKTOP', browser: 'Chrome', os: 'Windows', online: true, firstSeenAt: now, lastSeenAt: now, loginAt: now, ipAddress: '192.0.2.1' }] } as T
    if (new URL(path, 'http://localhost').searchParams.get('view') === 'history') return new Promise<T>(resolve => { finishHistory = resolve as (value: unknown) => void })
    return response([account]) as T
  }
  const click = async (name: string) => {
    const button = [...element.querySelectorAll('button')].find(node => node.textContent === name)
    assert.ok(button, `Missing button: ${name}`)
    await act(async () => button.click())
  }
  try {
    await act(async () => root.render(<OwnerAccountActivity language="en" reload={0} />))
    assert.equal(element.querySelectorAll('.owner-account').length, 1)
    await click('Sign-in history')
    assert.equal(element.querySelectorAll('.owner-account').length, 0)
    assert.equal(element.querySelectorAll('.owner-history-row').length, 0, 'Previous account rows must not render as history while loading')
    assert.ok(finishHistory)
    await act(async () => finishHistory!(response([{ id: 'login', user: account, deviceType: 'PHONE', browser: 'Safari', os: 'iOS', method: 'EMAIL_CODE', ipAddress: '192.0.2.2', loginAt: now }])))
    assert.equal(element.querySelectorAll('.owner-history-row').length, 1)
    assert.ok(element.textContent?.includes('Email code'))
    await click('Accounts')
    assert.equal(element.querySelectorAll('.owner-history-row').length, 0)
    assert.equal(element.querySelectorAll('.owner-account').length, 1)
    await act(async () => element.querySelector<HTMLButtonElement>('.owner-device-button')!.click())
    assert.equal(element.querySelectorAll('.owner-device').length, 1)
    assert.equal(element.querySelector('.owner-device-button')?.getAttribute('aria-expanded'), 'true')
    assert.ok(element.textContent?.includes('192.0.2.1'))
    console.log('Owner activity UI: delayed history transition, return to accounts and device expansion passed.')
  } finally {
    await act(async () => root.unmount())
    apiClient.get = previousGet
  }
}
