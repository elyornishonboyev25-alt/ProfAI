import { z } from 'zod'

export const novaMetricStages = ['microphone', 'negotiation', 'connection', 'first_audio', 'reply', 'interruption_to_stop', 'tool_wait', 'tts_request'] as const
export const metricSampleSchema = z.object({
  stage: z.enum(novaMetricStages), durationMs: z.number().finite().min(0).max(3_600_000),
  source: z.enum(['browser_clock', 'audio_clock', 'transcript_proxy', 'provider_speech_event', 'server_clock', 'fixture']),
}).strict()
export type NovaMetricSample = z.infer<typeof metricSampleSchema>
export const diagnosticsSnapshotSchema = z.object({
  samples: z.array(metricSampleSchema).max(256),
  counts: z.object({ modelCalls: z.number().int().min(0).max(100000), toolCalls: z.number().int().min(0).max(100000), errors: z.number().int().min(0).max(100000), reconnects: z.number().int().min(0).max(100000), ttsCalls: z.number().int().min(0).max(100000) }).strict(),
  inputTokens: z.number().int().nonnegative().nullable(), outputTokens: z.number().int().nonnegative().nullable(),
  usageBasis: z.enum(['unknown', 'response_totals', 'latest_provider_snapshot']),
}).strict()
export type NovaDiagnosticsSnapshot = z.infer<typeof diagnosticsSnapshotSchema>
export function summarizeSamples(samples: NovaMetricSample[]) {
  return Object.fromEntries(novaMetricStages.map(stage => {
    const values = samples.filter(sample => sample.stage === stage).map(sample => sample.durationMs).sort((a, b) => a - b)
    const quantile = (q: number) => values[Math.max(0, Math.ceil(values.length * q) - 1)] ?? null
    return [stage, { count: values.length, p50Ms: quantile(.5), p95Ms: values.length >= 20 ? quantile(.95) : null,
      sources: [...new Set(samples.filter(sample => sample.stage === stage).map(sample => sample.source))] }]
  }))
}
export class NovaDiagnostics {
  private data: NovaDiagnosticsSnapshot = { samples: [], counts: { modelCalls: 0, toolCalls: 0, errors: 0, reconnects: 0, ttsCalls: 0 }, inputTokens: null, outputTokens: null, usageBasis: 'unknown' }
  sample(stage: NovaMetricSample['stage'], durationMs: number, source: NovaMetricSample['source']) {
    const parsed = metricSampleSchema.safeParse({ stage, durationMs, source })
    if (parsed.success) { this.data.samples.push(parsed.data); if (this.data.samples.length > 256) this.data.samples.shift() }
  }
  count(key: keyof NovaDiagnosticsSnapshot['counts'], amount = 1) { if (Number.isInteger(amount) && amount > 0) this.data.counts[key] = Math.min(100000, this.data.counts[key] + amount) }
  tokens(input: unknown, output: unknown, basis: 'response_totals' | 'latest_provider_snapshot') {
    const valid = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
    if (valid(input)) this.data.inputTokens = basis === 'response_totals' ? (this.data.inputTokens ?? 0) + input : input
    if (valid(output)) this.data.outputTokens = basis === 'response_totals' ? (this.data.outputTokens ?? 0) + output : output
    if (valid(input) || valid(output)) this.data.usageBasis = basis
  }
  snapshot(): NovaDiagnosticsSnapshot { return diagnosticsSnapshotSchema.parse(this.data) }
}
const rateSchema = z.object({ inputPerMillion: z.number().finite().nonnegative(), outputPerMillion: z.number().finite().nonnegative(), currency: z.literal('USD'), source: z.string().min(1).max(300) }).strict()
export function configuredCostEstimate(model: string, snapshot: NovaDiagnosticsSnapshot, pricingJson = '') {
  let rates: unknown
  try { rates = JSON.parse(pricingJson)[model] } catch { return null }
  const parsed = rateSchema.safeParse(rates)
  if (!parsed.success || snapshot.inputTokens === null || snapshot.outputTokens === null || snapshot.usageBasis === 'unknown') return null
  return { amount: (snapshot.inputTokens * parsed.data.inputPerMillion + snapshot.outputTokens * parsed.data.outputPerMillion) / 1_000_000,
    currency: 'USD', source: parsed.data.source, basis: 'configured_effective_token_rates', coverage: snapshot.usageBasis,
    note: 'Estimate for reported tokens only. Audio-specific rates must be reflected in configured effective rates; this is not an invoice.' }
}
