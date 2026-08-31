import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'

export type AiProviderName = 'gemini' | 'openai' | 'hf'

export type AiGenerationPurpose =
  | 'assistant_chat'
  | 'writing_evaluation'
  | 'word_explanation'
  | 'speaking_examiner'
  | 'speaking_evaluation'
  | 'speaking_response_analysis'
  | 'weekly_plan'
  | 'coach_report'
  | 'center_performance_analysis'
  | 'legacy_ai_chat'

export type AiGenerationResult = {
  text: string
  provider: AiProviderName
  model: string
  inputTokens: number | null
  outputTokens: number | null
  fallbackUsed: boolean
}

type ProviderResult = Omit<AiGenerationResult, 'provider' | 'fallbackUsed'>

type GenerateAiTextInput = {
  userId: string
  purpose: AiGenerationPurpose
  systemPrompt: string
  userMessage: string
  maxOutputTokens: number
  images?: string[]
  jsonMode?: boolean
}

type ProviderAvailability = {
  gemini: boolean
  openai: boolean
  hf: boolean
  hasImages?: boolean
}

class ProviderRequestError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'ProviderRequestError'
    this.code = code
  }
}

export class AiGenerationError extends Error {
  statusCode: number
  code: string

  constructor(statusCode: number, code: string, message: string) {
    super(message)
    this.name = 'AiGenerationError'
    this.statusCode = statusCode
    this.code = code
  }
}

function splitConfiguredValues(values: string[]) {
  return [...new Set(values.flatMap((value) => value.split(',')).map((value) => value.trim()).filter(Boolean))]
}

function getGeminiKeys() {
  return splitConfiguredValues([
    env.GEMINI_API_KEY,
    env.GEMINI_API_KEY_2,
    env.GEMINI_API_KEY_3,
    env.GEMINI_API_KEY_4,
    env.GEMINI_API_KEY_5,
  ])
}

function getGeminiModels() {
  return splitConfiguredValues([env.GEMINI_MODELS])
}

export function buildAiProviderOrder(availability: ProviderAvailability): AiProviderName[] {
  const order: AiProviderName[] = []
  if (availability.gemini) order.push('gemini')
  if (availability.openai) order.push('openai')
  // The configured Hugging Face chat endpoint is text-only. Do not silently
  // discard student screenshots when a multimodal provider is unavailable.
  if (availability.hf && !availability.hasImages) order.push('hf')
  return order
}

function parseDataUrl(dataUrl: string) {
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl)
  if (!match) throw new ProviderRequestError('INVALID_IMAGE', 'Unsupported image payload.')
  return { mimeType: match[1], data: match[2] }
}

async function fetchWithTimeout(url: string, init: RequestInit) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), env.AI_PROVIDER_TIMEOUT_MS)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ProviderRequestError('PROVIDER_TIMEOUT', 'AI provider timed out.')
    }
    throw new ProviderRequestError('PROVIDER_NETWORK', 'AI provider network request failed.')
  } finally {
    clearTimeout(timeoutId)
  }
}

async function requestGemini(input: GenerateAiTextInput): Promise<ProviderResult> {
  const keys = getGeminiKeys()
  const models = getGeminiModels()
  let lastError = new ProviderRequestError('GEMINI_UNAVAILABLE', 'Gemini is unavailable.')

  for (const model of models) {
    for (const key of keys) {
      const imageParts = (input.images ?? []).map((image) => {
        const parsed = parseDataUrl(image)
        return { inlineData: parsed }
      })
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`

      let response: Response
      try {
        response = await fetchWithTimeout(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': key,
          },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: input.userMessage }, ...imageParts] }],
            systemInstruction: { parts: [{ text: input.systemPrompt }] },
            generationConfig: {
              temperature: 0.45,
              maxOutputTokens: input.maxOutputTokens,
              ...(input.jsonMode === false ? {} : { responseMimeType: 'application/json' }),
            },
          }),
        })
      } catch (error) {
        lastError = error instanceof ProviderRequestError
          ? error
          : new ProviderRequestError('GEMINI_NETWORK', 'Gemini request failed.')
        continue
      }

      if (!response.ok) {
        lastError = new ProviderRequestError(`GEMINI_${response.status}`, 'Gemini rejected the request.')
        continue
      }

      const payload = (await response.json().catch(() => null)) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>
        usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number }
      } | null
      const text = payload?.candidates?.[0]?.content?.parts
        ?.filter((part) => typeof part.text === 'string' && !part.thought)
        .map((part) => part.text)
        .join('')
        .trim()

      if (!text) {
        lastError = new ProviderRequestError('GEMINI_EMPTY', 'Gemini returned an empty response.')
        continue
      }

      return {
        text,
        model,
        inputTokens: payload?.usageMetadata?.promptTokenCount ?? null,
        outputTokens: payload?.usageMetadata?.candidatesTokenCount ?? null,
      }
    }
  }

  throw lastError
}

function parseOpenAiCompatiblePayload(payload: unknown) {
  const parsed = payload as {
    choices?: Array<{ message?: { content?: string | Array<{ text?: string }> } }>
    usage?: { prompt_tokens?: number; completion_tokens?: number }
  }
  const content = parsed.choices?.[0]?.message?.content
  const text = typeof content === 'string'
    ? content
    : Array.isArray(content)
      ? content.map((item) => item.text ?? '').join('\n')
      : ''
  return {
    text: text.trim(),
    inputTokens: parsed.usage?.prompt_tokens ?? null,
    outputTokens: parsed.usage?.completion_tokens ?? null,
  }
}

async function requestOpenAi(input: GenerateAiTextInput): Promise<ProviderResult> {
  const userContent = input.images?.length
    ? [
        { type: 'text', text: input.userMessage },
        ...input.images.map((image) => ({ type: 'image_url', image_url: { url: image } })),
      ]
    : input.userMessage
  const response = await fetchWithTimeout(`${env.OPENAI_API_BASE.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      temperature: 0.45,
      max_tokens: input.maxOutputTokens,
      ...(input.jsonMode === false ? {} : { response_format: { type: 'json_object' } }),
      messages: [
        { role: 'system', content: input.systemPrompt },
        { role: 'user', content: userContent },
      ],
    }),
  })

  if (!response.ok) {
    throw new ProviderRequestError(`OPENAI_${response.status}`, 'OpenAI rejected the request.')
  }
  const parsed = parseOpenAiCompatiblePayload(await response.json().catch(() => null))
  if (!parsed.text) throw new ProviderRequestError('OPENAI_EMPTY', 'OpenAI returned an empty response.')
  return { ...parsed, model: env.OPENAI_MODEL }
}

async function requestHuggingFace(input: GenerateAiTextInput): Promise<ProviderResult> {
  const response = await fetchWithTimeout(`${env.HF_API_BASE.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.HF_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      model: env.HF_MODEL,
      temperature: 0.35,
      max_tokens: input.maxOutputTokens,
      messages: [
        { role: 'system', content: input.systemPrompt },
        { role: 'user', content: input.userMessage },
      ],
    }),
  })

  if (!response.ok) {
    throw new ProviderRequestError(`HF_${response.status}`, 'Hugging Face rejected the request.')
  }
  const parsed = parseOpenAiCompatiblePayload(await response.json().catch(() => null))
  if (!parsed.text) throw new ProviderRequestError('HF_EMPTY', 'Hugging Face returned an empty response.')
  return { ...parsed, model: env.HF_MODEL }
}

async function recordUsage(data: {
  userId: string
  purpose: AiGenerationPurpose
  provider: AiProviderName | 'none'
  model: string
  status: 'SUCCESS' | 'FAILED'
  requestChars: number
  responseChars?: number
  inputTokens?: number | null
  outputTokens?: number | null
  latencyMs: number
  fallbackUsed: boolean
  errorCode?: string
}) {
  await prisma.aiUsageEvent.create({ data }).catch(() => {
    // AI remains available during a rolling deployment where application code
    // may start shortly before the usage-ledger migration is applied.
  })
}

export async function generateAiText(input: GenerateAiTextInput): Promise<AiGenerationResult> {
  const startedAt = Date.now()
  const requestChars = input.systemPrompt.length + input.userMessage.length
  const order = buildAiProviderOrder({
    gemini: getGeminiKeys().length > 0 && getGeminiModels().length > 0,
    openai: env.OPENAI_API_KEY.trim().length > 0,
    hf: env.HF_ACCESS_TOKEN.trim().length > 0,
    hasImages: Boolean(input.images?.length),
  })

  if (order.length === 0) {
    await recordUsage({
      userId: input.userId,
      purpose: input.purpose,
      provider: 'none',
      model: 'none',
      status: 'FAILED',
      requestChars,
      latencyMs: Date.now() - startedAt,
      fallbackUsed: false,
      errorCode: 'AI_NOT_CONFIGURED',
    })
    throw new AiGenerationError(503, 'AI_NOT_CONFIGURED', 'AI is not configured on the server yet.')
  }

  let lastError = new ProviderRequestError('AI_PROVIDER_FAILED', 'AI provider request failed.')
  for (const [index, provider] of order.entries()) {
    try {
      const response = provider === 'gemini'
        ? await requestGemini(input)
        : provider === 'openai'
          ? await requestOpenAi(input)
          : await requestHuggingFace(input)
      const result: AiGenerationResult = {
        ...response,
        provider,
        fallbackUsed: index > 0,
      }
      await recordUsage({
        userId: input.userId,
        purpose: input.purpose,
        provider,
        model: result.model,
        status: 'SUCCESS',
        requestChars,
        responseChars: result.text.length,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        latencyMs: Date.now() - startedAt,
        fallbackUsed: result.fallbackUsed,
      })
      return result
    } catch (error) {
      lastError = error instanceof ProviderRequestError
        ? error
        : new ProviderRequestError('AI_PROVIDER_FAILED', 'AI provider request failed.')
    }
  }

  const lastProvider = order.at(-1) ?? 'none'
  await recordUsage({
    userId: input.userId,
    purpose: input.purpose,
    provider: lastProvider,
    model: 'unavailable',
    status: 'FAILED',
    requestChars,
    latencyMs: Date.now() - startedAt,
    fallbackUsed: order.length > 1,
    errorCode: lastError.code,
  })
  throw new AiGenerationError(502, lastError.code, 'AI providers are temporarily unavailable. Please try again.')
}
