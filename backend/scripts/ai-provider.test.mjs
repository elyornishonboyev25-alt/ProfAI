import assert from 'node:assert/strict'
import test from 'node:test'
import { app } from '../dist/app.js'
import { buildAiProviderOrder } from '../dist/services/aiProvider.service.js'

test('provider order keeps Gemini primary and configured providers as fallbacks', () => {
  assert.deepEqual(
    buildAiProviderOrder({ gemini: true, openai: true, hf: true }),
    ['gemini', 'openai', 'hf'],
  )
})

test('text-only Hugging Face fallback is excluded for image requests', () => {
  assert.deepEqual(
    buildAiProviderOrder({ gemini: true, openai: false, hf: true, hasImages: true }),
    ['gemini'],
  )
})

test('AI generation rejects unauthenticated payloads before JSON parsing', async (t) => {
  const server = app.listen(0)
  t.after(() => {
    server.closeAllConnections()
    server.close()
  })

  const address = server.address()
  assert.ok(address && typeof address === 'object')
  const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/ai/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{not-valid-json',
  })

  assert.equal(response.status, 401)
  assert.deepEqual(await response.json(), { message: 'Authentication required.' })
})
