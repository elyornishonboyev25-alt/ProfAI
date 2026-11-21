import { prisma } from '../lib/prisma.js'
import { env } from '../config/env.js'
import { configuredCostEstimate, diagnosticsSnapshotSchema, summarizeSamples, type NovaDiagnosticsSnapshot } from './novaDiagnostics.js'

export async function saveVoiceDiagnostics(userId: string, sessionId: string, side: 'client' | 'server', provider: string, model: string, snapshot: NovaDiagnosticsSnapshot, db = prisma) {
  const validated = diagnosticsSnapshotSchema.parse(snapshot)
  return db.novaSessionDiagnostics.upsert({ where: { sessionId_side: { sessionId, side } },
    create: { userId, sessionId, side, provider, model, snapshot: validated },
    update: { snapshot: validated },
  })
}
export function describeDiagnostics(model: string, snapshot: unknown) {
  const parsed = diagnosticsSnapshotSchema.safeParse(snapshot)
  return parsed.success ? { ...parsed.data, summary: summarizeSamples(parsed.data.samples), costEstimate: configuredCostEstimate(model, parsed.data, env.NOVA_MODEL_PRICING_JSON) } : null
}
