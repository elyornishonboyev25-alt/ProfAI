import type { GeminiChatResponse } from '@/services/geminiAI'

const DEFAULT_REPLY = "I'm here to help with your studies!"

function decodeJsonStringField(source: string, field: string): string | null {
  const fieldPattern = new RegExp(`"${field}"\\s*:\\s*"`, 'i')
  const match = fieldPattern.exec(source)
  if (!match) return null

  let output = ''
  for (let index = match.index + match[0].length; index < source.length; index += 1) {
    const character = source[index]
    if (character === '"') return output
    if (character !== '\\') {
      output += character
      continue
    }

    const escaped = source[index + 1]
    if (escaped === undefined) break
    index += 1

    const replacements: Record<string, string> = {
      '"': '"',
      '\\': '\\',
      '/': '/',
      b: '\b',
      f: '\f',
      n: '\n',
      r: '\r',
      t: '\t',
    }

    if (escaped === 'u') {
      const code = source.slice(index + 1, index + 5)
      if (/^[0-9a-f]{4}$/i.test(code)) {
        output += String.fromCharCode(Number.parseInt(code, 16))
        index += 4
      }
      continue
    }

    output += replacements[escaped] ?? escaped
  }

  return output || null
}

function unwrapReplyEnvelope(value: string): string {
  let current = value.trim()

  for (let depth = 0; depth < 2; depth += 1) {
    if (!/^\{\s*"reply"\s*:/i.test(current)) break

    try {
      const parsed = JSON.parse(current) as { reply?: unknown }
      if (typeof parsed.reply !== 'string') break
      current = parsed.reply.trim()
      continue
    } catch {
      const recovered = decodeJsonStringField(current, 'reply')
      if (!recovered) break
      current = recovered.trim()
    }
  }

  return current
}

/**
 * Normalizes both current replies and legacy/truncated JSON envelopes that may
 * already be stored in a learner's chat history.
 */
export function normalizeAssistantReply(value: unknown): string {
  if (typeof value !== 'string') return DEFAULT_REPLY

  const withoutFences = value
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()
  const normalized = unwrapReplyEnvelope(withoutFences)

  return normalized || DEFAULT_REPLY
}

export function recoverAssistantResponse(raw: string): GeminiChatResponse {
  const reply = decodeJsonStringField(raw, 'reply')

  return {
    reply: normalizeAssistantReply(reply ?? raw),
    actions: [],
    title: null,
    memoryUpdates: [],
  }
}
