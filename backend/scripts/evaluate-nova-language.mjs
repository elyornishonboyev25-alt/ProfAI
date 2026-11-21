import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { extname } from 'node:path'
import { env } from '../dist/config/env.js'
import { transcribeSpeakingAudio } from '../dist/services/speakingAudio.service.js'
import { resolveNovaLanguage, normalizeUzbek } from '../dist/services/novaLanguage.js'
const value = flag => process.argv.includes(flag) ? process.argv[process.argv.indexOf(flag) + 1] : undefined
const suite = JSON.parse(await readFile(new URL('./fixtures/nova-language-audio.json', import.meta.url), 'utf8'))
const selected = suite.filter(row => !value('--case') || row.id === value('--case'))
if (!selected.length) throw Error('Unknown case ID')
if (value('--audio') && selected.length !== 1) throw Error('Use --case with a matching human recording; do not compare one recording to every sentence.')
const ready = [env.OPENAI_API_KEY, env.GEMINI_API_KEY, env.GEMINI_API_KEY_2, env.GEMINI_API_KEY_3, env.GEMINI_API_KEY_4, env.GEMINI_API_KEY_5].some(key => key.trim())
const tokens = text => normalizeUzbek(text).toLowerCase().replace(/[’‘]/g, "'").match(/[\p{L}\p{N}']+/gu) ?? []
function wordErrorRate(expected, actual) {
  const a = tokens(expected), b = tokens(actual), row = Array.from({ length: b.length + 1 }, (_, i) => i)
  if (!a.length) return b.length ? null : 0
  for (let i = 1; i <= a.length; i++) { let diagonal = row[0]; row[0] = i; for (let j = 1; j <= b.length; j++) { const previous = row[j]; row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + Number(a[i - 1] !== b[j - 1])); diagonal = previous } }
  return row[b.length] / a.length
}
const results = []
for (const entry of selected) {
  if (!ready || !value('--audio')) { results.push({ ...entry, status: 'not_run', reason: !ready ? 'NO_PROVIDER_CREDENTIALS' : 'NO_MATCHING_HUMAN_RECORDING', wordErrorRate: null, heardNaturalness: null, liveVad: null }); continue }
  const file = value('--audio'), mime = ({ '.wav': 'audio/wav', '.webm': 'audio/webm', '.mp4': 'audio/mp4', '.m4a': 'audio/mp4', '.ogg': 'audio/ogg' })[extname(file).toLowerCase()]
  if (!mime) throw Error('Use WAV, WEBM, M4A/MP4 or OGG')
  const bytes = await readFile(file); if (bytes.length > 5_500_000) throw Error('Recording is too large')
  const start = performance.now()
  const transcript = await transcribeSpeakingAudio(bytes.toString('base64'), mime, { language: entry.language, lastReliableLanguage: entry.lastReliableLanguage ?? 'uz' })
  results.push({ ...entry, status: transcript === null ? 'provider_failed' : 'captured', transcript, durationMs: Math.round(performance.now() - start), wordErrorRate: transcript === null ? null : wordErrorRate(entry.expected, transcript), resolved: transcript === null ? null : resolveNovaLanguage(transcript, entry.language, entry.lastReliableLanguage ?? 'uz'), heardNaturalness: null, liveVad: null, note: 'Recorded ASR only. Listen and separately test live VAD, acoustic interruption and output voice.' })
}
await mkdir(new URL('../../outputs/nova-v3/', import.meta.url), { recursive: true })
await writeFile(new URL(`../../outputs/nova-v3/language-audio-${Date.now()}.json`, import.meta.url), JSON.stringify({ source: 'human recordings only; no synthetic model quality score', results }, null, 2))
console.log(`${results.filter(row => row.status === 'captured').length}/${selected.length} ASR captures. ${!ready ? 'NOT RUN: no provider credentials.' : !value('--audio') ? 'NOT RUN: supply a matching human recording.' : 'Human listening and live microphone review remain separate.'}`)
if (results.some(row => row.status === 'not_run')) process.exitCode = 2
