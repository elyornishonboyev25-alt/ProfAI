import assert from 'node:assert/strict'
import test from 'node:test'
import express from 'express'

// This suite uses fake provider responses and never calls a paid API.
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.ACCESS_TOKEN_SECRET = 'speaking-test-access-secret-000'
process.env.REFRESH_TOKEN_SECRET = 'speaking-test-refresh-secret-000'
process.env.OPENAI_API_KEY = 'speaking-test-key'
const { default: routes } = await import('../dist/routes/speakingAudio.routes.js')
const { errorHandler } = await import('../dist/middleware/error.js')

test('speaking audio preserves voice profiles, retries and MP4 transcription', async (t) => {
  const app = express()
  app.use(express.json())
  app.use((req, _res, next) => { req.user = { id: 'test-speaker' }; next() })
  app.use(routes)
  app.use(errorHandler)
  const server = app.listen(0)
  const base = `http://127.0.0.1:${server.address().port}`
  const nativeFetch = globalThis.fetch
  let provider = async () => new Response('audio-data', { headers: { 'Content-Type': 'audio/mpeg' } })
  let calls = []
  globalThis.fetch = async (url, options) => {
    if (String(url).startsWith(base)) return nativeFetch(url, options)
    calls.push({ url, options })
    return provider(url, options)
  }
  t.after(() => { globalThis.fetch = nativeFetch; server.closeAllConnections(); server.close() })
  const request = (path, body) => nativeFetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })

  for (const [voice, gender] of [['cedar', 'male'], ['marin', 'female']]) {
    const body = { text: 'Could you tell me your full name, please?', voice }
    const response = await request('/voice', body)
    assert.equal(response.status, 200)
    assert.equal(Buffer.from((await response.json()).audioBase64, 'base64').toString(), 'audio-data')
    const payload = JSON.parse(calls.at(-1).options.body)
    assert.equal(payload.voice, voice)
    assert.match(payload.instructions, new RegExp(`adult ${gender}`))
    assert.match(payload.instructions, /British English/)
    assert.equal(payload.input, body.text)
    const count = calls.length
    assert.equal((await request('/voice', body)).status, 200)
    assert.equal(calls.length, count, 'Retry reuses a cached voice without a second generation')
  }
  provider = async () => { throw new Error('provider timeout') }
  assert.equal((await request('/voice', { text: 'A different question?', voice: 'cedar' })).status, 503)
  provider = async () => new Response('')
  assert.equal((await request('/voice', { text: 'Empty audio?', voice: 'marin' })).status, 503)
  assert.equal((await request('/voice', { text: 'Question?', voice: 'invalid' })).status, 400)

  const audioBase64 = Buffer.from('recorded-answer'.repeat(20)).toString('base64')
  let models = []
  provider = async (_url, { body }) => {
    models.push(body.get('model'))
    assert.equal(body.get('file').name, 'answer.mp4')
    assert.equal(body.get('file').type, 'audio/mp4')
    assert.equal(await body.get('file').text(), Buffer.from(audioBase64, 'base64').toString())
    return body.get('model') === 'gpt-transcribe'
      ? new Response('{}', { status: 404 })
      : Response.json({ text: '  My name is Ali.  ' })
  }
  const transcript = await request('/transcribe', { audioBase64, mimeType: 'audio/mp4' })
  assert.equal(transcript.status, 200)
  assert.deepEqual(await transcript.json(), { text: 'My name is Ali.' })
  assert.deepEqual(models, ['gpt-transcribe', 'gpt-4o-transcribe'])
  provider = async () => { throw new Error('offline') }
  assert.equal((await request('/transcribe', { audioBase64, mimeType: 'audio/mp4' })).status, 503)
  provider = async () => Response.json({ text: [] })
  assert.equal((await request('/transcribe', { audioBase64, mimeType: 'audio/mp4' })).status, 503)
  assert.equal((await request('/transcribe', { audioBase64: 'not base64!', mimeType: 'audio/mp4' })).status, 400)
})
