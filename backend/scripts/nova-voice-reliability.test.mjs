import assert from 'node:assert/strict'
import test from 'node:test'
import express from 'express'

process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://fixture:fixture@localhost:5432/fixture'
process.env.ACCESS_TOKEN_SECRET = 'voice-reliability-access-fixture-000'
process.env.REFRESH_TOKEN_SECRET = 'voice-reliability-refresh-fixture-000'
process.env.AI_RATE_LIMIT_MAX = '2'
const { apiRateLimit, aiRateLimit, voiceRequestRateLimit } = await import('../dist/middleware/rateLimit.js')

test('voice maintenance survives general/chat limits, stays bounded and isolates accounts', async t => {
  const app = express()
  app.use((req, _res, next) => { req.user = { id: String(req.headers['x-fixture-user'] ?? 'first') }; next() })
  app.post('/busy-page', apiRateLimit, (_req, res) => res.sendStatus(204))
  app.post('/chat', aiRateLimit, (_req, res) => res.sendStatus(204))
  app.use('/voice', voiceRequestRateLimit, (_req, res) => res.sendStatus(204))
  const server = app.listen(0)
  t.after(() => { server.closeAllConnections(); server.close() })
  const request = (path, user = 'first') => fetch(`http://127.0.0.1:${server.address().port}${path}`, { method: 'POST', headers: { 'X-Fixture-User': user } })
  for (let n = 0; n < 120; n++) assert.equal((await request('/busy-page')).status, 204)
  assert.equal((await request('/busy-page')).status, 429)
  for (let n = 0; n < 2; n++) assert.equal((await request('/chat')).status, 204)
  const limitedChat = await request('/voice/gemini/connect')
  assert.equal(limitedChat.status, 429, 'New calls retain the generation allowance')
  const error = await limitedChat.json()
  assert.equal(error.code, 'AI_RATE_LIMIT')
  assert.ok(error.details.retryAfterMs > 0)
  const controls = ['/heartbeat', '/end', '/context', '/capabilities', '/diagnostics']
  for (let n = 0; n < 120; n++) assert.equal((await request('/voice' + controls[n % controls.length])).status, 204)
  const limitedControls = await request('/voice/context')
  assert.equal(limitedControls.status, 429, 'Maintenance still has abuse protection')
  assert.equal((await limitedControls.json()).code, 'VOICE_CONTROL_RATE_LIMIT')
  assert.equal((await request('/voice/heartbeat', 'second')).status, 204, 'Another account retains its allowance')
  assert.equal((await request('/voice/gemini/connect', 'second')).status, 204)
})
