import assert from 'node:assert/strict'
import { apiClient, ApiError } from '@/lib/apiClient'

export async function run() {
  const original = globalThis.fetch
  let calls = 0
  const request = (status: number, body: string, headers: Record<string, string> = {}) => {
    globalThis.fetch = (async () => { calls++; return new Response(body, { status, headers }) }) as typeof fetch
    return apiClient.post('/ai/voice/gemini/connect', {}, { auth: false })
  }
  try {
    for (const status of [502, 503, 504]) {
      await assert.rejects(request(status, '<html>Proxy unavailable</html>'), (error: ApiError) => {
        assert.ok(error instanceof ApiError)
        assert.equal(error.status, status)
        assert.equal(error.code, 'HTTP_SERVICE_UNAVAILABLE')
        assert.ok(error.message.includes('temporarily unavailable'))
        assert.ok(!error.message.includes('<html>'))
        return true
      })
    }
    await assert.rejects(request(429, 'Too many requests', { 'Retry-After': '30' }), (error: ApiError) => {
      assert.equal(error.code, 'HTTP_RATE_LIMIT')
      assert.equal(error.details?.retryAfterMs, 30_000)
      return true
    })
    for (const body of ['', 'null', '"error"', '[]']) await assert.rejects(request(500, body), (error: ApiError) => error.status === 500 && error.code === 'HTTP_REQUEST_FAILED')
    await assert.rejects(request(503, JSON.stringify({ code: 'GEMINI_QUOTA_UNAVAILABLE', message: 'Provider quota unavailable.', details: { retryAfterMs: 60_000 } }), { 'Retry-After': '10' }), (error: ApiError) => {
      assert.equal(error.code, 'GEMINI_QUOTA_UNAVAILABLE')
      assert.equal(error.message, 'Provider quota unavailable.')
      assert.equal(error.details?.retryAfterMs, 60_000)
      return true
    })
    assert.equal(calls, 9, 'The API client never retries POSTs automatically')
    console.log('PASS: proxy/rate-limit errors retain status and retry information; malformed bodies are safe and provider errors survive')
  } finally { globalThis.fetch = original }
}
