import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'
import { readEventStream } from '../utils/eventStream.js'

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

export type GenerateAiTextInput = {
  userId: string
  purpose: AiGenerationPurpose
  systemPrompt: string
  userMessage: string
  maxOutputTokens: number
  images?: string[]
  jsonMode?: boolean
  signal?: AbortSignal
  onText?: (text: string) => void
  audio?: Array<{ mimeType: string; data: string }>
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
    return await fetch(url, { ...init, signal: init.signal ? AbortSignal.any([init.signal, controller.signal]) : controller.signal })
  } catch (error) {
    if (init.signal?.aborted) throw error
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
  const models = input.purpose === 'assistant_chat' && env.AI_CHAT_MODEL && (env.AI_CHAT_PROVIDER === 'gemini' || env.AI_CHAT_PROVIDER === 'auto')
    ? [env.AI_CHAT_MODEL] : getGeminiModels()
  let lastError = new ProviderRequestError('GEMINI_UNAVAILABLE', 'Gemini is unavailable.')

  for (const model of models) {
    for (const key of keys) {
      const imageParts = (input.images ?? []).map((image) => {
        const parsed = parseDataUrl(image)
        return { inlineData: parsed }
      })
      const audioParts = (input.audio ?? []).map((audio) => ({ inlineData: audio }))
      const operation = input.onText ? 'streamGenerateContent?alt=sse' : 'generateContent'
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:${operation}`

      let response: Response
      try {
        response = await fetchWithTimeout(url, {
          signal: input.signal,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': key,
          },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: input.userMessage }, ...imageParts, ...audioParts] }],
            systemInstruction: { parts: [{ text: input.systemPrompt }] },
            generationConfig: {
              temperature: 0.45,
              maxOutputTokens: input.maxOutputTokens,
              ...(input.jsonMode === false ? {} : { responseMimeType: 'application/json' }),
            },
          }),
        })
      } catch (error) {
        if (input.signal?.aborted) throw error
        lastError = error instanceof ProviderRequestError
          ? error
          : new ProviderRequestError('GEMINI_NETWORK', 'Gemini request failed.')
        continue
      }

      if (!response.ok) {
        lastError = new ProviderRequestError(`GEMINI_${response.status}`, 'Gemini rejected the request.')
        continue
      }

      if (input.onText && response.body) {
        let text = ''
        let inputTokens: number | null = null
        let outputTokens: number | null = null
        for await (const data of readEventStream(response.body)) {
          const payload = JSON.parse(data)
          if (payload.error) throw new ProviderRequestError('GEMINI_STREAM', 'AI response was interrupted.')
          const delta = (payload.candidates?.[0]?.content?.parts ?? [])
            .filter((part: { text?: string; thought?: boolean }) => typeof part.text === 'string' && !part.thought)
            .map((part: { text: string }) => part.text).join('')
          text += delta
          if (delta) input.onText(text)
          inputTokens = payload.usageMetadata?.promptTokenCount ?? inputTokens
          outputTokens = payload.usageMetadata?.candidatesTokenCount ?? outputTokens
        }
        if (!text.trim()) throw new ProviderRequestError('GEMINI_EMPTY', 'Gemini returned an empty response.')
        return { text: text.trim(), model, inputTokens, outputTokens }
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
  const model = input.purpose === 'assistant_chat' && env.AI_CHAT_MODEL && env.AI_CHAT_PROVIDER === 'openai'
    ? env.AI_CHAT_MODEL : env.OPENAI_MODEL
  const userContent = input.images?.length
    ? [
        { type: 'text', text: input.userMessage },
        ...input.images.map((image) => ({ type: 'image_url', image_url: { url: image } })),
      ]
    : input.userMessage
  const response = await fetchWithTimeout(`${env.OPENAI_API_BASE.replace(/\/$/, '')}/chat/completions`, {
    signal: input.signal,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      ...(/^(?:gpt-5|gpt-6|o[1-9])/.test(model) ? { max_completion_tokens: input.maxOutputTokens } : { temperature: 0.45, max_tokens: input.maxOutputTokens }),
      ...(input.onText ? { stream: true, stream_options: { include_usage: true } } : {}),
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
  if (input.onText && response.body) {
    let text = ''
    let inputTokens: number | null = null
    let outputTokens: number | null = null
    for await (const data of readEventStream(response.body)) {
      if (data === '[DONE]') break
      const payload = JSON.parse(data)
      if (payload.error) throw new ProviderRequestError('OPENAI_STREAM', 'AI response was interrupted.')
      const delta = payload.choices?.[0]?.delta?.content
      if (typeof delta === 'string') { text += delta; input.onText(text) }
      inputTokens = payload.usage?.prompt_tokens ?? inputTokens
      outputTokens = payload.usage?.completion_tokens ?? outputTokens
    }
    if (!text.trim()) throw new ProviderRequestError('OPENAI_EMPTY', 'OpenAI returned an empty response.')
    return { text: text.trim(), model, inputTokens, outputTokens }
  }
  const parsed = parseOpenAiCompatiblePayload(await response.json().catch(() => null))
  if (!parsed.text) throw new ProviderRequestError('OPENAI_EMPTY', 'OpenAI returned an empty response.')
  return { ...parsed, model }
}

async function requestHuggingFace(input: GenerateAiTextInput): Promise<ProviderResult> {
  const response = await fetchWithTimeout(`${env.HF_API_BASE.replace(/\/$/, '')}/chat/completions`, {
    signal: input.signal,
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
  input = { ...input, signal: AbortSignal.any([AbortSignal.timeout(Math.max(60000, env.AI_PROVIDER_TIMEOUT_MS)), ...(input.signal ? [input.signal] : [])]) }
  const startedAt = Date.now()
  const requestChars = input.systemPrompt.length + input.userMessage.length
  let order = buildAiProviderOrder({
    gemini: getGeminiKeys().length > 0 && getGeminiModels().length > 0,
    openai: env.OPENAI_API_KEY.trim().length > 0,
    hf: env.HF_ACCESS_TOKEN.trim().length > 0,
    hasImages: Boolean(input.images?.length),
  })
  if (input.audio?.length) order = order.filter((provider) => provider === 'gemini')
  if (input.purpose === 'assistant_chat' && env.AI_CHAT_PROVIDER !== 'auto') {
    const preferred = env.AI_CHAT_PROVIDER
    order = [preferred, ...order.filter((provider) => provider !== preferred)].filter((provider) => order.includes(provider))
  }

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
  let emitted = false
  let attemptedProvider: AiProviderName = order[0]
  let attemptedIndex = 0
  const providerInput = { ...input, onText: input.onText ? (value: string) => { emitted = true; input.onText!(value) } : undefined }
  for (const [index, provider] of order.entries()) {
    attemptedProvider = provider; attemptedIndex = index
    input.signal?.throwIfAborted()
    try {
      const response = provider === 'gemini'
        ? await requestGemini(providerInput)
        : provider === 'openai'
          ? await requestOpenAi(providerInput)
          : await requestHuggingFace(providerInput)
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
      if (input.signal?.aborted) throw error
      lastError = error instanceof ProviderRequestError
        ? error
        : new ProviderRequestError('AI_PROVIDER_FAILED', 'AI provider request failed.')
      // Never splice a second model's answer into a partially delivered reply.
      if (emitted) break
    }
  }

  await recordUsage({
    userId: input.userId,
    purpose: input.purpose,
    provider: attemptedProvider,
    model: 'unavailable',
    status: 'FAILED',
    requestChars,
    latencyMs: Date.now() - startedAt,
    fallbackUsed: attemptedIndex > 0,
    errorCode: lastError.code,
  })
  throw new AiGenerationError(502, lastError.code, 'AI providers are temporarily unavailable. Please try again.')
}
