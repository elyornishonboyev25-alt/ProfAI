import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { env } from '../dist/config/env.js'
import { prisma } from '../dist/lib/prisma.js'
import { assistantContextSchema, buildCoachPrompt, parseAssistantReply } from '../dist/services/assistantPolicy.js'
import { geminiLiveSetup, geminiUsesInitialHistory } from '../dist/services/geminiLive.service.js'
import { openGeminiLive } from '../dist/services/geminiLiveTransport.js'
import { geminiLiveKeys } from '../dist/services/voiceProvider.js'
import { generateAiText } from '../dist/services/aiProvider.service.js'
import { readNovaPerformance } from '../dist/services/novaPersona.js'

const arg = name => process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : undefined
const suite = JSON.parse(await readFile(new URL('./fixtures/nova-quality-v2.json', import.meta.url)))
const selected = suite.filter(row => row.driver === 'native' && (!arg('--case') || row.id === arg('--case')))
if (!selected.length) throw new Error('Unknown native case ID.')
const directory = new URL('../../outputs/nova-v2/', import.meta.url)
await mkdir(directory, { recursive: true })
prisma.aiUsageEvent.create = async () => ({}) // Synthetic evaluation; no account or usage writes.
function wav(bytes, rate) {
  const header = Buffer.alloc(44)
  header.write('RIFF'); header.writeUInt32LE(bytes.length + 36, 4); header.write('WAVEfmt ', 8)
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22)
  header.writeUInt32LE(rate, 24); header.writeUInt32LE(rate * 2, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34)
  header.write('data', 36); header.writeUInt32LE(bytes.length, 40)
  return Buffer.concat([header, bytes])
}
const results = []
for (const entry of selected) {
  if (!geminiLiveKeys().length) { results.push({ id: entry.id, status: 'not_run', reason: 'NO_GEMINI_CREDENTIALS', humanReview: 'pending', steps: entry.steps }); continue }
  const start = performance.now(), context = assistantContextSchema.parse({ language: 'auto', mode: 'coach' })
  let socket, pcmTimer
  try {
    socket = await openGeminiLive(geminiLiveSetup(context, { learner: null, memories: [], skills: [] }), geminiLiveKeys(), AbortSignal.timeout(20_000))
    const connectedMs = Math.round(performance.now() - start), frames = [], expressions = [], transcripts = []
    let firstAudioMs = null, rate = 24000, pcmBytes = 0, modelRequests = 0
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('NATIVE_CAPTURE_TIMEOUT')), 45_000)
      socket.on('error', () => { clearTimeout(timer); reject(new Error('NATIVE_TRANSPORT_ERROR')) })
      socket.on('close', () => { clearTimeout(timer); reject(new Error('NATIVE_CLOSED_EARLY')) })
      socket.on('message', raw => {
        void (async () => {
          const event = JSON.parse(String(raw))
          if (event.error) throw new Error('NATIVE_PROVIDER_REJECTED')
          for (const tool of event.toolCall?.functionCalls ?? []) {
            let response
            if (tool.name === 'set_expression') {
              const value = readNovaPerformance(tool.args)
              if (value) expressions.push({ audioOffsetMs: Math.round(pcmBytes / 2 / rate * 1000), performance: value, alignment: 'received_audio_boundary' })
              response = { applied: Boolean(value) }
            } else if (tool.name === 'observe_learning') response = { recorded: false, reason: 'Synthetic evaluation does not persist learner evidence.' }
            else if (tool.name === 'ask_coach') {
              const result = await generateAiText({ userId: 'nova-synthetic-evaluation', purpose: 'assistant_chat', systemPrompt: buildCoachPrompt(context, 'voice'),
                userMessage: JSON.stringify({ request: tool.args.request, history: transcripts.map(turn => ({ role: turn.role, content: turn.text })), context: { learner: null, memories: [], skills: [] } }),
                onModelRequest: () => { modelRequests++ }, maxOutputTokens: 1800, signal: AbortSignal.timeout(30_000) })
              response = parseAssistantReply(result.text, tool.args.request)
            } else response = { error: 'Unsupported evaluation tool.' }
            socket.send(JSON.stringify({ toolResponse: { functionResponses: [{ id: tool.id, name: tool.name, response }] } }))
          }
          const content = event.serverContent
          if (content?.inputTranscription?.text) transcripts.push({ role: 'user', text: content.inputTranscription.text })
          if (content?.outputTranscription?.text) transcripts.push({ role: 'assistant', text: content.outputTranscription.text })
          for (const part of content?.modelTurn?.parts ?? []) if (part.inlineData?.data && /^audio\/pcm/.test(part.inlineData.mimeType ?? '')) {
            const incomingRate = Number(/rate=(\d+)/.exec(part.inlineData.mimeType)?.[1] ?? 24000)
            if (frames.length && incomingRate !== rate) throw new Error('AUDIO_RATE_CHANGED')
            rate = incomingRate
            const frame = Buffer.from(part.inlineData.data, 'base64'); pcmBytes += frame.length; frames.push(frame)
            firstAudioMs ??= Math.round(performance.now() - start)
          }
          if (content?.turnComplete && frames.length) { clearTimeout(timer); resolve() }
        })().catch(error => { clearTimeout(timer); reject(error) })
      })
      if (geminiUsesInitialHistory()) socket.send(JSON.stringify({ clientContent: { turnComplete: true } }))
      if (arg('--pcm')) {
        // Signed little-endian PCM16, 16 kHz, mono. No fake STT claim from text input.
        void readFile(arg('--pcm')).then(bytes => {
          if (!bytes.length || bytes.length % 2 || bytes.length > 1_920_000) throw new Error('INVALID_PCM_SAMPLE')
          let offset = 0
          pcmTimer = setInterval(() => {
            if (offset >= bytes.length) { clearInterval(pcmTimer); socket.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } })); return }
            const data = bytes.subarray(offset, offset += 3200).toString('base64')
            socket.send(JSON.stringify({ realtimeInput: { audio: { data, mimeType: 'audio/pcm;rate=16000' } } }))
          }, 100)
        }).catch(reject)
      } else socket.send(JSON.stringify({ realtimeInput: { text: entry.message } }))
    })
    const audioFile = `${entry.id}-${Date.now()}.wav`
    await writeFile(new URL(audioFile, directory), wav(Buffer.concat(frames), rate))
    results.push({ id: entry.id, status: 'captured', provider: 'gemini', model: env.GEMINI_LIVE_MODEL, inputMode: arg('--pcm') ? 'recorded_pcm' : 'text_to_native_audio',
      connectedMs, firstAudioNetworkMs: firstAudioMs, modelRequests, audioFile, transcripts, expressions,
      humanReview: 'pending', limitations: 'No browser playback, microphone barge-in or physical speaker latency is measured here. Listen to the WAV and run the browser/microphone protocol separately.', steps: entry.steps })
  } catch (error) { results.push({ id: entry.id, status: 'failed', error: error.message }); process.exitCode = 1 }
  finally { clearInterval(pcmTimer); socket?.close() }
}
await writeFile(new URL(`native-captures-${Date.now()}.json`, directory), JSON.stringify({ results }, null, 2))
if (!geminiLiveKeys().length) { console.error('NOT RUN: no Gemini credentials; native speech and actual microphone behaviour remain unverified.'); process.exitCode = 2 }
