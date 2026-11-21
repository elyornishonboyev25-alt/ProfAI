import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { env } from '../dist/config/env.js'
import { prisma } from '../dist/lib/prisma.js'
import { generateAiText } from '../dist/services/aiProvider.service.js'
import { assistantContextSchema, buildCoachPrompt, parseAssistantReply } from '../dist/services/assistantPolicy.js'

// Real provider output, synthetic learner data, no account/database writes.
// This captures evidence for HUMAN review; it does not declare naturalness from regexes.
if (![env.GEMINI_API_KEY, env.GEMINI_API_KEY_2, env.GEMINI_API_KEY_3, env.GEMINI_API_KEY_4, env.GEMINI_API_KEY_5, env.OPENAI_API_KEY, env.HF_ACCESS_TOKEN].some(value => value.trim())) {
  console.error('NOT RUN: No configured AI provider credentials. Real conversational quality and audio naturalness remain unverified.')
  process.exitCode = 2
} else {
  prisma.aiUsageEvent.create = async () => ({})
  const cases = JSON.parse(await readFile(new URL('./fixtures/nova-evaluation.json', import.meta.url), 'utf8'))
  const selected = process.argv[2] ? cases.filter(entry => entry.id === process.argv[2]) : cases
  if (!selected.length) throw new Error('Unknown evaluation case ID.')
  const results = []
  for (const entry of selected) {
    const context = assistantContextSchema.parse({ mode: entry.mode, language: entry.language ?? 'auto' })
    const start = performance.now()
    try {
      const result = await generateAiText({ userId: 'nova-synthetic-evaluation', purpose: 'assistant_chat',
        systemPrompt: buildCoachPrompt(context), userMessage: JSON.stringify({ request: entry.message, history: entry.history ?? [], context: { learner: null, memories: [] } }),
        maxOutputTokens: 1800, signal: AbortSignal.timeout(60_000) })
      results.push({ id: entry.id, expectedReview: entry.check, elapsedMs: Math.round(performance.now() - start), provider: result.provider, model: result.model, result: parseAssistantReply(result.text), humanReview: 'pending' })
      console.log(`CAPTURED: ${entry.id} (${result.provider}/${result.model}); human review pending`)
    } catch (error) {
      results.push({ id: entry.id, error: error?.code ?? 'EVALUATION_FAILED', humanReview: 'blocked' })
      console.error(`FAILED: ${entry.id}`); process.exitCode = 1
    }
  }
  const directory = new URL('../../outputs/', import.meta.url)
  await mkdir(directory, { recursive: true })
  const target = new URL(`nova-evaluation-${Date.now()}.json`, directory)
  await writeFile(target, JSON.stringify({ note: 'Text-only real-model captures. Listen separately to native audio; never infer speech quality from these results.', results }, null, 2))
  console.log(`Evidence: ${fileURLToPath(target)}`)
}
