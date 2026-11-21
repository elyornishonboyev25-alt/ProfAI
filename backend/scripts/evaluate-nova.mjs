import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { env } from '../dist/config/env.js'
import { prisma } from '../dist/lib/prisma.js'
import { generateAiText } from '../dist/services/aiProvider.service.js'
import { assistantContextSchema, buildCoachPrompt, parseAssistantReply, partialAssistantReply } from '../dist/services/assistantPolicy.js'
import { relevantMemories } from '../dist/services/novaMemory.service.js'

const cases = JSON.parse(await readFile(new URL('./fixtures/nova-quality-v2.json', import.meta.url), 'utf8'))
const rubric = JSON.parse(await readFile(new URL('./fixtures/nova-quality-rubric.json', import.meta.url), 'utf8'))
if (process.argv.includes('--list')) {
  console.log(JSON.stringify({ total: cases.length, cases: cases.map(entry => ({ id: entry.id, driver: entry.driver ?? 'text', category: entry.category })) }, null, 2))
} else {
  const caseId = process.argv.slice(2).find(arg => !arg.startsWith('--'))
  const selected = cases.filter(entry => !entry.driver && (!caseId || entry.id === caseId))
  if (!selected.length) throw new Error('Unknown text case ID; use --list for native and browser scenarios.')
  const ready = [env.GEMINI_API_KEY, env.GEMINI_API_KEY_2, env.GEMINI_API_KEY_3, env.GEMINI_API_KEY_4, env.GEMINI_API_KEY_5, env.OPENAI_API_KEY, env.HF_ACCESS_TOKEN].some(value => value.trim())
  prisma.aiUsageEvent.create = async () => ({}) // Synthetic learner; no account/database writes.
  const directory = new URL('../../outputs/nova-v2/', import.meta.url)
  await mkdir(directory, { recursive: true })
  const results = []
  for (const entry of selected) {
    const humanReview = Object.fromEntries(rubric.dimensions.map(dimension => [dimension, null]))
    const expectedReview = rubric.categories[entry.category]
    if (!ready) { results.push({ id: entry.id, status: 'not_run', reason: 'NO_PROVIDER_CREDENTIALS', expectedReview, humanReview }); continue }
    const context = assistantContextSchema.parse({ mode: entry.mode, language: entry.language ?? 'auto' })
    let modelRequests = 0, firstVisibleReplyMs = null
    const started = performance.now()
    try {
      const generated = await generateAiText({ userId: 'nova-synthetic-evaluation', purpose: 'assistant_chat',
        onModelRequest: () => { modelRequests++ }, systemPrompt: buildCoachPrompt(context),
        userMessage: JSON.stringify({ request: entry.message, history: entry.history ?? [], context: { learner: null, memories: relevantMemories(entry.memories ?? [], entry.message), skills: entry.skills ?? [] } }),
        onText: raw => { if (firstVisibleReplyMs === null && partialAssistantReply(raw)) firstVisibleReplyMs = Math.round(performance.now() - started) },
        maxOutputTokens: 2200, signal: AbortSignal.timeout(60_000),
      })
      const answer = parseAssistantReply(generated.text, entry.message)
      results.push({ id: entry.id, status: 'captured', expectedReview, humanReview,
        requestDurationMs: Math.round(performance.now() - started), firstVisibleReplyMs, modelRequests,
        provider: generated.provider, model: generated.model, result: answer,
        mechanicalNotes: { words: answer.reply.split(/\s+/).length, endsWithQuestion: /\?\s*$/.test(answer.reply) },
      })
      console.log(`CAPTURED: ${entry.id}; independent human review pending`)
    } catch (error) { results.push({ id: entry.id, status: 'failed', error: error?.code ?? 'EVALUATION_FAILED', expectedReview, humanReview }); process.exitCode = 1 }
  }
  const latencies = results.filter(row => row.status === 'captured').map(row => row.requestDurationMs).sort((a, b) => a - b)
  const percentile = q => latencies[Math.max(0, Math.ceil(latencies.length * q) - 1)] ?? null
  const target = new URL(`quality-${Date.now()}.json`, directory)
  await writeFile(target, JSON.stringify({ note: 'Text-model evidence, not a speech-quality score. Mechanical notes do not prove conversational quality. Scores stay null until human review.',
    totalScenarios: cases.length, rubric, latency: { samples: latencies.length, p50Ms: percentile(.5), p95Ms: latencies.length >= 20 ? percentile(.95) : null }, results,
    interactiveScenarios: cases.filter(entry => entry.driver),
  }, null, 2))
  console.log(`Evidence: ${fileURLToPath(target)}`)
  if (!ready) { console.error('NOT RUN: No provider credentials. Model naturalness, speech quality and live latency remain unverified.'); process.exitCode = 2 }
}
