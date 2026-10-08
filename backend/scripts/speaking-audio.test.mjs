import assert from 'node:assert/strict'
import test from 'node:test'
import express from 'express'

// This suite uses fake provider responses and never calls a paid API.
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test'
process.env.ACCESS_TOKEN_SECRET = 'speaking-test-access-secret-000'
process.env.REFRESH_TOKEN_SECRET = 'speaking-test-refresh-secret-000'
process.env.OPENAI_API_KEY = 'speaking-test-key'
process.env.OPENAI_TRANSCRIBE_MODEL = 'whisper-1'
for (const name of ['GEMINI_API_KEY', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3', 'GEMINI_API_KEY_4', 'GEMINI_API_KEY_5']) process.env[name] = ''
const { default: routes } = await import('../dist/routes/speakingAudio.routes.js')
const { env } = await import('../dist/config/env.js')
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
  for (const [language, name] of [['uz', 'Uzbek'], ['ru', 'Russian']]) {
    const body = { text: 'Same cached text', voice: 'marin', language }
    const before = calls.length
    assert.equal((await request('/voice', body)).status, 200)
    assert.equal(calls.length, before + 1, 'Voice caches are isolated by language')
    const payload = JSON.parse(calls.at(-1).options.body)
    assert.equal(payload.voice, 'marin', 'Nova shares the Speaking mock female voice')
    assert.equal(payload.model, 'gpt-4o-mini-tts')
    assert.match(payload.instructions, new RegExp(`natural ${name} with native pronunciation`))
    assert.match(payload.instructions, /do not translate or add words/)
    assert.equal(payload.input, body.text)
    assert.equal((await request('/voice', body)).status, 200)
    assert.equal(calls.length, before + 1)
  }
  assert.equal((await request('/voice', { text: 'Question?', language: 'invalid' })).status, 400)
  let releaseAudio
  let generationStarted
  const started = new Promise((resolve) => { generationStarted = resolve })
  provider = async () => { generationStarted(); return new Promise((resolve) => { releaseAudio = () => resolve(new Response('shared-audio')) }) }
  const concurrentCount = calls.length
  const first = request('/voice', { text: 'Concurrent natural voice?' })
  await started
  const second = request('/voice', { text: 'Concurrent natural voice?' })
  await new Promise((resolve) => setTimeout(resolve, 30))
  assert.equal(calls.length, concurrentCount + 1, 'Overlapping retries share one synthesis request')
  releaseAudio()
  assert.deepEqual((await Promise.all([first, second])).map((response) => response.status), [200, 200])
  provider = async () => { throw new Error('provider timeout') }
  assert.equal((await request('/voice', { text: 'A different question?', voice: 'cedar' })).status, 503)
  provider = async () => new Response('recovered-audio')
  assert.equal((await request('/voice', { text: 'A different question?', voice: 'cedar' })).status, 200, 'Failed synthesis never poisons the in-flight cache')
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
    return body.get('model') === 'gpt-4o-transcribe'
      ? new Response('{}', { status: 404 })
      : Response.json({ text: '  My name is Ali.  ' })
  }
  const transcript = await request('/transcribe', { audioBase64, mimeType: 'audio/mp4' })
  assert.equal(transcript.status, 200)
  assert.deepEqual(await transcript.json(), { text: 'My name is Ali.' })
  assert.deepEqual(models, ['gpt-4o-transcribe', 'whisper-1'])
  provider = async () => { throw new Error('offline') }
  assert.equal((await request('/transcribe', { audioBase64, mimeType: 'audio/mp4' })).status, 503)
  provider = async () => Response.json({ text: [] })
  assert.equal((await request('/transcribe', { audioBase64, mimeType: 'audio/mp4' })).status, 503)
  assert.equal((await request('/transcribe', { audioBase64: 'not base64!', mimeType: 'audio/mp4' })).status, 400)

  env.GEMINI_API_KEY = 'speaking-test-gemini-key'
  env.GEMINI_MODELS = 'gemini-2.5-flash'
  for (const [voice, profile] of [['cedar', 'Charon'], ['marin', 'Kore']]) {
    provider = async (url, { body }) => {
      if (String(url).includes('/audio/speech')) return new Response('{}', { status: 503 })
      assert.ok(String(url).includes(env.GEMINI_TTS_MODEL))
      const payload = JSON.parse(body)
      assert.deepEqual(payload.generationConfig.speechConfig.voiceConfig, { voice: profile }, 'Gemini 3.8 uses the documented single-speaker voice configuration')
      assert.equal(payload.contents[0].parts[0].text, `Gemini fallback ${voice}?`)
      assert.match(payload.contents[0].parts[0].speech_metadata.style, /British English/)
      return Response.json({ candidates: [{ content: { parts: [{ inlineData: { data: Buffer.from([0, 1, 2, 3]).toString('base64'), mimeType: 'audio/L16;codec=pcm;rate=24000' } }] } }] })
    }
    const response = await request('/voice', { text: `Gemini fallback ${voice}?`, voice })
    assert.equal(response.status, 200)
    const result = await response.json()
    assert.equal(result.mimeType, 'audio/wav')
    const wave = Buffer.from(result.audioBase64, 'base64')
    assert.equal(wave.toString('ascii', 0, 4), 'RIFF')
    assert.equal(wave.readUInt32LE(24), 24000)
    assert.deepEqual([...wave.subarray(44)], [0, 1, 2, 3])
  }
  // A deployment with only Gemini still records/transcribes every browser format.
  env.OPENAI_API_KEY = ''
  const modernModel = env.GEMINI_TTS_MODEL
  env.GEMINI_TTS_MODEL = 'gemini-2.5-flash-preview-tts'
  provider = async (_url, { body }) => {
    const payload = JSON.parse(body)
    assert.deepEqual(payload.generationConfig.speechConfig.voiceConfig, { prebuiltVoiceConfig: { voiceName: 'Kore' } })
    assert.equal(payload.contents[0].parts[0].speech_metadata, undefined, 'Older TTS models do not accept modern metadata')
    assert.match(payload.contents[0].parts[0].text, /Read this text aloud:\nLegacy configured voice\?$/)
    return Response.json({ candidates: [{ content: { parts: [{ inlineData: { data: Buffer.from('wav-data').toString('base64'), mimeType: 'audio/wav' } }] } }] })
  }
  assert.equal((await request('/voice', { text: 'Legacy configured voice?' })).status, 200)
  env.GEMINI_TTS_MODEL = modernModel
  for (const mimeType of ['audio/mp4', 'audio/webm', 'audio/ogg', 'audio/wav']) {
    provider = async (_url, { body }) => {
      const payload = JSON.parse(body)
      assert.deepEqual(payload.contents[0].parts[0].inlineData, { mimeType, data: audioBase64 })
      assert.match(payload.systemInstruction.parts[0].text, /verbatim/)
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ text: 'Um, I like music.' }) }] } }] })
    }
    const response = await request('/transcribe', { audioBase64, mimeType })
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { text: 'Um, I like music.' })
  }
  provider = async () => Response.json({ candidates: [{ content: { parts: [{ text: '{"text":""}' }] } }] })
  assert.deepEqual(await (await request('/transcribe', { audioBase64, mimeType: 'audio/webm' })).json(), { text: '' }, 'Silence does not become an invented answer')
  env.GEMINI_API_KEY = ''
  assert.equal((await request('/voice', { text: 'No configured provider?', voice: 'marin' })).status, 503)
  assert.equal((await request('/transcribe', { audioBase64, mimeType: 'audio/webm' })).status, 503)
})
