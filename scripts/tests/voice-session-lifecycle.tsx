import assert from 'node:assert/strict'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { openVoiceSession, releaseVoiceSession, voiceClientId } from '@/lib/voiceSessionLifecycle'

export async function run() {
  const previous = apiClient.post
  useAuthStore.setState({ user: { id: 'session-lifecycle', role: 'USER' } as any, accessToken: 'fixture-token' })
  let unlock: () => void = () => {}
  const wait = new Promise<void>(resolve => { unlock = resolve })
  const events: string[] = []
  let failRelease = false
  apiClient.post = (async (path, body) => {
    events.push(`${path}:${body?.id ?? 'new'}`)
    if (path.endsWith('/end')) {
      if (failRelease) { failRelease = false; throw new Error('Fixture dropped end request') }
      if (body.id === 'first') await wait
      return undefined
    }
    assert.equal(body.clientId, voiceClientId())
    return { id: 'next' }
  }) as typeof apiClient.post
  try {
    const client = voiceClientId()
    assert.equal(voiceClientId(), client, 'This tab keeps the same identity across retry and reload storage')
    const closing = releaseVoiceSession('first')
    const connecting = openVoiceSession('/ai/voice/gemini/connect', {})
    await new Promise(resolve => setTimeout(resolve, 20))
    assert.equal(events.length, 1, 'A new admission waits for the previous release acknowledgement')
    unlock(); await closing; await connecting
    assert.deepEqual(events.slice(0, 2), ['/ai/voice/end:first', '/ai/voice/gemini/connect:new'])
    events.length = 0; failRelease = true
    await releaseVoiceSession('dropped')
    await openVoiceSession('/ai/voice/standard/connect', {})
    assert.deepEqual(events, ['/ai/voice/end:dropped', '/ai/voice/end:dropped', '/ai/voice/standard/connect:new'], 'A failed release is retried before switching transports')
    const controller = new AbortController(); controller.abort()
    const count = events.length
    await assert.rejects(openVoiceSession('/ai/voice/gemini/connect', {}, controller.signal), { name: 'AbortError' })
    assert.equal(events.length, count, 'Cancelled starts cannot reserve server time')
    console.log('PASS: serialized close/reopen, stable browser identity, dropped release recovery and cancelled admission')
  } finally { unlock(); apiClient.post = previous }
}
