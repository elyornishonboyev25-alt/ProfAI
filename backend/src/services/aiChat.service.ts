import { z } from 'zod'
import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'
import { generateSkillAnalytics } from './analytics.service.js'

const routeTargetSchema = z.enum([
  'DASHBOARD',
  'TEST_LIBRARY',
  'SAT_PREP',
  'IELTS_PREP',
  'VOCABULARY',
  'MOCK',
  'LEADERBOARD',
  'AI_ANALYSIS',
  'ACCOUNT',
])
type ChatLocale = 'en' | 'uz'
type ContextMode = 'analysis' | 'general' | 'exam' | 'training_reading' | 'training_listening'
const openTestTrackSchema = z.enum(['reading', 'listening'])
const openTestModeSchema = z.enum(['practice', 'simulation', 'full-test'])
const speakingModeSchema = z.enum(['conversation', 'mock'])
const speakingPartSchema = z.enum(['part1', 'part2', 'part3', 'full_mock'])

export type RouteTargetId = z.infer<typeof routeTargetSchema>
export type OpenTestActionPayload = {
  track: z.infer<typeof openTestTrackSchema>
  testId: string
  mode: z.infer<typeof openTestModeSchema>
  partIndex?: number
  durationMinutes?: number
}
export type SpeakingModeActionPayload = {
  mode: z.infer<typeof speakingModeSchema>
  part?: z.infer<typeof speakingPartSchema>
  englishOnly: boolean
}
export type AiChatAction =
  | { type: 'navigate'; target: RouteTargetId }
  | { type: 'open_test'; payload: OpenTestActionPayload }
  | { type: 'speaking_mode'; payload: SpeakingModeActionPayload }

export type AiChatRequest = {
  message: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
  locale?: ChatLocale
  contextMode?: ContextMode
  uiContext?: { pathname?: string }
}
export type AiChatResponse = {
  reply: string
  actions: AiChatAction[]
  meta: {
    source: 'openai' | 'hf' | 'fallback'
    locale: ChatLocale
  }
}

type AiChatContext = {
  weakTrack: string | null
  preferredName: string | null
  preferredLocale: ChatLocale
  fullName: string | null
}

const aiChatSchema = z
  .object({
    reply: z.string().min(6).max(1800),
    actions: z
      .array(
        z.union([
          z.object({ type: z.literal('navigate'), target: routeTargetSchema }).strict(),
          z
            .object({
              type: z.literal('open_test'),
              payload: z
                .object({
                  track: openTestTrackSchema,
                  testId: z.string().min(3).max(120),
                  mode: openTestModeSchema,
                  partIndex: z.number().int().min(1).max(4).optional(),
                  durationMinutes: z.number().int().min(5).max(180).optional(),
                })
                .strict(),
            })
            .strict(),
          z
            .object({
              type: z.literal('speaking_mode'),
              payload: z
                .object({
                  mode: speakingModeSchema,
                  part: speakingPartSchema.optional(),
                  englishOnly: z.boolean().default(true),
                })
                .strict(),
            })
            .strict(),
        ]),
      )
      .max(2)
      .default([]),
  })
  .strict()

const prismaRuntime = prisma as unknown as Record<string, any>
const userAiPreferenceDelegate = prismaRuntime.userAiPreference as
  | { findUnique?: (args: unknown) => Promise<any>; upsert?: (args: unknown) => Promise<any> }
  | undefined
const aiMemoryDelegate = prismaRuntime.aiMemory as
  | { upsert?: (args: unknown) => Promise<any> }
  | undefined
const threadDelegate = prismaRuntime.aiConversationThread as
  | {
      findFirst?: (args: unknown) => Promise<any>
      create?: (args: unknown) => Promise<any>
      update?: (args: unknown) => Promise<any>
    }
  | undefined
const messageDelegate = prismaRuntime.aiConversationMessage as
  | { create?: (args: unknown) => Promise<any> }
  | undefined

const replyHistory = new Map<string, string[]>()

function containsAny(input: string, tokens: string[]) {
  return tokens.some((token) => input.includes(token))
}
function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
function normalizeLocale(input?: string | null): ChatLocale {
  if (!input) return 'en'
  return input.toLowerCase().startsWith('uz') ? 'uz' : 'en'
}
function parseMessageContent(responsePayload: unknown): string | null {
  const payload = responsePayload as { choices?: Array<{ message?: { content?: string } }> }
  return payload.choices?.[0]?.message?.content?.trim() ?? null
}
function extractJsonObject(input: string): unknown {
  const clean = input.trim().replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim()
  try {
    return JSON.parse(clean)
  } catch {
    const start = clean.indexOf('{')
    const end = clean.lastIndexOf('}')
    if (start < 0 || end <= start) throw new Error('Invalid JSON response')
    return JSON.parse(clean.slice(start, end + 1))
  }
}
function scoreSimilarity(a: string, b: string) {
  const left = new Set(a.toLowerCase().split(/\W+/).filter(Boolean))
  const right = new Set(b.toLowerCase().split(/\W+/).filter(Boolean))
  let inter = 0
  for (const token of left) if (right.has(token)) inter += 1
  const union = left.size + right.size - inter
  return union === 0 ? 1 : inter / union
}
function varyReply(userId: string, reply: string, locale: ChatLocale, name?: string | null) {
  const current = replyHistory.get(userId) ?? []
  const duplicated = current.some((prev) => scoreSimilarity(prev, reply) >= 0.9)
  if (!duplicated) {
    replyHistory.set(userId, [...current, reply].slice(-6))
    return reply
  }
  const fallback =
    locale === 'uz'
      ? `Albatta${name ? ` ${name}` : ''}. Bu safar savolingizni boshqa usulda hal qilamiz, davom etamizmi?`
      : `Sure${name ? ` ${name}` : ''}. Let's approach this from a different angle and continue.`
  replyHistory.set(userId, [...current, fallback].slice(-6))
  return fallback
}

function detectLocaleByMessage(message: string, fallback: ChatLocale) {
  const normalized = message.toLowerCase()
  if (containsAny(normalized, ['salom', 'rahmat', 'iltimos', 'lugat', 'imtihon'])) return 'uz'
  if (containsAny(normalized, ['hello', 'thanks', 'please', 'exam', 'speaking'])) return 'en'
  return fallback
}
function detectNameUpdate(message: string) {
  const m =
    message.match(/(?:my name is|call me)\s+([a-z][a-z\s'-]{1,40})/i) ??
    message.match(/(?:ismim|mening ismim)\s+([a-z][a-z\s'-]{1,40})/i)
  return m?.[1]?.trim().replace(/\s+/g, ' ') ?? null
}
function isGreetingMessage(message: string) {
  return containsAny(message.toLowerCase(), ['hello', 'hi', 'hey', 'salom', 'assalomu alaykum'])
}
function extractConversationTopic(message: string) {
  const normalized = message.trim()
  const aboutMatch = normalized.match(/(?:about|haqida|to'g'risida)\s+(.{2,120})/i)
  if (aboutMatch?.[1]) return aboutMatch[1].trim()
  const letsTalkMatch = normalized.match(/(?:let'?s talk|gaplashamiz|gaplashmoqchiman)\s*(?:about)?\s*(.{2,120})?/i)
  if (letsTalkMatch?.[1]) return letsTalkMatch[1].trim()
  return null
}
function buildAdaptiveFallbackReply(params: {
  locale: ChatLocale
  preferredName: string | null
  message: string
  weakTrack: string | null
  contextMode: ContextMode
}) {
  const { locale, preferredName, message, weakTrack, contextMode } = params
  const normalized = message.toLowerCase()
  const namePrefix = preferredName ? `${preferredName}, ` : ''
  const topic = extractConversationTopic(message)

  if (isGreetingMessage(message)) {
    return locale === 'uz'
      ? `Salom ${namePrefix}bugun nimadan boshlaymiz? Test ochish, speaking practice yoki oddiy suhbat qilamiz.`
      : `Hi ${namePrefix}where do you want to start today: open a test, speaking practice, or a normal conversation?`
  }

  if (containsAny(normalized, ['who are you', 'sen kimsan', 'what can you do', 'nima qila olasan'])) {
    return locale === 'uz'
      ? `${namePrefix}men Study AI copilotman: test ochaman, speaking mock qilaman, vocabulary bilan yordam beraman va analytics bo'yicha tavsiya beraman.`
      : `${namePrefix}I am your Study AI copilot: I can open tests, run speaking mock sessions, help with vocabulary, and guide your analytics plan.`
  }

  if (containsAny(normalized, ['talk', 'conversation', 'gaplash', 'chat'])) {
    return locale === 'uz'
      ? `${namePrefix}albatta, bemalol gaplashamiz${topic ? `: ${topic}` : ''}. Birinchi fikringizni yozing, men aniq va ravon javob beraman.`
      : `${namePrefix}sure, we can talk freely${topic ? ` about ${topic}` : ''}. Share your first thought and I will respond clearly and naturally.`
  }

  if (containsAny(normalized, ['ielts', 'sat', 'reading', 'listening', 'writing', 'speaking'])) {
    if (contextMode === 'training_reading' || contextMode === 'training_listening') {
      return locale === 'uz'
        ? `${namePrefix}training rejimidasiz. Men vocabulary bo'yicha izoh, tarjima va ishlatish misollarini beraman, lekin tayyor javob bermayman.`
        : `${namePrefix}you are in training mode. I can explain vocabulary with translation and usage examples, but I cannot provide direct answers.`
    }
    return locale === 'uz'
      ? `${namePrefix}${weakTrack ? `${weakTrack}ga urg'u berib` : 'study plan asosida'} ishlashni boshlaymiz. Xohlasangiz testni ochib beraman yoki speaking mockni ishga tushiraman.`
      : `${namePrefix}let us continue with ${weakTrack ? `extra focus on ${weakTrack}` : 'a structured study plan'}. I can open a test now or start a speaking mock immediately.`
  }

  if (message.trim().endsWith('?') || containsAny(normalized, ['qanday', 'nima uchun', 'how', 'why', 'what'])) {
    return locale === 'uz'
      ? `${namePrefix}savolingizni tushundim. Shu mavzu bo'yicha bosqichma-bosqich, aniq va amaliy javob beraman. Xohlasangiz misol bilan ham tushuntiraman.`
      : `${namePrefix}I understand your question. I can answer it step by step with practical detail, and include examples if you want.`
  }

  return locale === 'uz'
    ? `${namePrefix}xabaringizni oldim. Davom eting, men kontekstga mos javob berib boraman.`
    : `${namePrefix}I got your message. Keep going and I will respond based on your context.`
}
function isCheatingRequest(message: string) {
  return containsAny(message.toLowerCase(), ['answer key', 'tell me the answer', 'javobini ayt', 'yechib ber'])
}
function isVocabRequest(message: string) {
  return containsAny(message.toLowerCase(), ['vocab', 'vocabulary', 'definition', 'translation', 'lugat'])
}
function isNavigationIntent(message: string) {
  return containsAny(message.toLowerCase(), ['open', 'go to', 'navigate', 'show', 'och', 'ochib ber', 'kir'])
}
function detectNavigateTarget(message: string): RouteTargetId | null {
  const normalized = message.toLowerCase()
  if (containsAny(normalized, ['dashboard', 'home', 'bosh sahifa'])) return 'DASHBOARD'
  if (containsAny(normalized, ['test library', 'tests', 'testlar'])) return 'TEST_LIBRARY'
  if (containsAny(normalized, ['sat prep', 'sat section'])) return 'SAT_PREP'
  if (containsAny(normalized, ['ielts prep', 'ielts section'])) return 'IELTS_PREP'
  if (containsAny(normalized, ['vocabulary', 'word', 'lugat'])) return 'VOCABULARY'
  if (containsAny(normalized, ['mock arena'])) return 'MOCK'
  if (containsAny(normalized, ['leaderboard', 'reyting'])) return 'LEADERBOARD'
  if (containsAny(normalized, ['ai analysis', 'ai coach'])) return 'AI_ANALYSIS'
  if (containsAny(normalized, ['account', 'settings'])) return 'ACCOUNT'
  return null
}
function resolveReadingTestId(index: number) {
  if (index <= 1) return 'ielts-reading-full-vol1'
  if (index === 2) return 'ielts-reading-full-vol2'
  if (index === 3) return 'ielts-reading-full-vol3'
  return `reading-full-${index}`
}
function resolveListeningTestId(index: number) {
  if (index <= 1) return 'ielts-listening-1'
  if (index === 2) return 'ielts-listening-2'
  return `listening-full-${index}`
}
function parseOpenTestAction(message: string): OpenTestActionPayload | null {
  const normalized = message.toLowerCase()
  const hasReading = containsAny(normalized, ['reading', 'read'])
  const hasListening = containsAny(normalized, ['listening', 'listen'])
  if (!hasReading && !hasListening) return null
  if (!containsAny(normalized, ['open', 'start', 'launch', 'full test', 'passage', 'part', 'qism'])) return null
  const track: OpenTestActionPayload['track'] = hasListening ? 'listening' : 'reading'
  const fullTestIndex = clamp(Number(normalized.match(/full\s*test\s*(\d{1,2})/)?.[1] ?? '1'), 1, 20)
  const partIndex = normalized.match(/(?:passage|part|qism|section)\s*(\d{1,2})/)?.[1]
  const duration = normalized.match(/(\d{1,3})\s*(?:min|minute|minutes|daqiqa|daq\.?)/)?.[1]
  return {
    track,
    testId: track === 'reading' ? resolveReadingTestId(fullTestIndex) : resolveListeningTestId(fullTestIndex),
    mode: partIndex || duration ? 'practice' : track === 'listening' ? 'full-test' : 'simulation',
    partIndex: partIndex ? clamp(Number(partIndex), 1, 4) : undefined,
    durationMinutes: duration ? clamp(Number(duration), 5, 180) : undefined,
  }
}
function parseSpeakingModeAction(message: string): SpeakingModeActionPayload | null {
  const normalized = message.toLowerCase()
  if (!containsAny(normalized, ['speaking', 'voice', 'mock', 'mic'])) return null
  if (containsAny(normalized, ['mock', 'part 1', 'part1', 'part 2', 'part2', 'part 3', 'part3'])) {
    const part =
      normalized.includes('part 1') || normalized.includes('part1')
        ? 'part1'
        : normalized.includes('part 2') || normalized.includes('part2')
          ? 'part2'
          : normalized.includes('part 3') || normalized.includes('part3')
            ? 'part3'
            : 'full_mock'
    return { mode: 'mock', part, englishOnly: true }
  }
  if (containsAny(normalized, ['english speaking', 'speak english'])) {
    return { mode: 'conversation', englishOnly: true }
  }
  return null
}

async function buildChatContext(userId: string): Promise<AiChatContext> {
  const [skillAnalytics, user, preference] = await Promise.all([
    generateSkillAnalytics(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } }),
    typeof userAiPreferenceDelegate?.findUnique === 'function'
      ? userAiPreferenceDelegate.findUnique({
          where: { userId },
          select: { preferredName: true, preferredLocale: true },
        })
      : Promise.resolve(null),
  ])
  const tracks = [...skillAnalytics.trackBreakdown].sort((a, b) => a.skillPower - b.skillPower)
  return {
    weakTrack: tracks[0]?.label ?? null,
    preferredName: preference?.preferredName ?? null,
    preferredLocale: normalizeLocale(preference?.preferredLocale ?? 'en'),
    fullName: user?.fullName ?? null,
  }
}

async function requestOpenAiChat(systemPrompt: string, userPrompt: string) {
  const response = await fetch(`${env.OPENAI_API_BASE.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      temperature: 0.45,
      max_tokens: 700,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  })
  if (!response.ok) throw new Error('OpenAI provider failed')
  const payload = await response.json()
  const content = parseMessageContent(payload)
  if (!content) throw new Error('OpenAI provider returned empty content')
  return content
}

async function requestHfChat(systemPrompt: string, userPrompt: string) {
  const response = await fetch(`${env.HF_API_BASE.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.HF_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      model: env.HF_MODEL,
      temperature: 0.35,
      max_tokens: 700,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  })
  if (!response.ok) throw new Error('HF provider failed')
  const payload = await response.json()
  const content = parseMessageContent(payload)
  if (!content) throw new Error('HF provider returned empty content')
  return content
}

async function persistMemory(userId: string, locale: ChatLocale, detectedName: string | null) {
  if (typeof userAiPreferenceDelegate?.upsert === 'function') {
    await userAiPreferenceDelegate
      .upsert({
        where: { userId },
        update: {
          preferredLocale: locale,
          lastAssistantLanguage: locale,
          preferredName: detectedName ?? undefined,
        },
        create: {
          userId,
          preferredLocale: locale,
          lastAssistantLanguage: locale,
          preferredName: detectedName ?? undefined,
          toneStyle: 'sweet',
        },
      })
      .catch(() => null)
  }
  if (typeof aiMemoryDelegate?.upsert === 'function') {
    await aiMemoryDelegate
      .upsert({
        where: { userId_key: { userId, key: 'last_locale' } },
        update: { value: locale },
        create: { userId, key: 'last_locale', value: locale },
      })
      .catch(() => null)
  }
}

async function persistConversation(userId: string, locale: string, contextMode: string, userMessage: string, reply: string) {
  if (
    typeof threadDelegate?.findFirst !== 'function' ||
    typeof threadDelegate?.create !== 'function' ||
    typeof messageDelegate?.create !== 'function'
  ) {
    return
  }
  const thread =
    (await threadDelegate.findFirst({ where: { userId }, orderBy: { updatedAt: 'desc' }, select: { id: true } })) ??
    (await threadDelegate.create({
      data: { userId, title: userMessage.slice(0, 80), locale, contextMode },
      select: { id: true },
    }))
  await messageDelegate.create({ data: { threadId: thread.id, role: 'user', content: userMessage, locale } }).catch(() => null)
  await messageDelegate.create({ data: { threadId: thread.id, role: 'assistant', content: reply, locale } }).catch(() => null)
}

export async function generateAiChatResponse(userId: string, input: AiChatRequest): Promise<AiChatResponse> {
  const context = await buildChatContext(userId).catch(() => ({
    weakTrack: null,
    preferredName: null,
    preferredLocale: 'en' as const,
    fullName: null,
  }))
  const detectedName = detectNameUpdate(input.message)
  const locale = detectLocaleByMessage(input.message, normalizeLocale(input.locale ?? context.preferredLocale))
  const preferredName = detectedName ?? context.preferredName ?? context.fullName?.split(' ')[0] ?? null
  const contextMode = input.contextMode ?? 'general'
  const isTrainingContext =
    contextMode === 'training_reading' || contextMode === 'training_listening'

  await persistMemory(userId, locale, detectedName)

  if (input.contextMode === 'exam') {
    const reply = varyReply(
      userId,
      locale === 'uz' ? `Hozir exam mode yoqilgan${preferredName ? ` ${preferredName}` : ''}.` : `Exam mode is active${preferredName ? ` ${preferredName}` : ''}.`,
      locale,
      preferredName,
    )
    await persistConversation(userId, locale, contextMode, input.message, reply)
    return { reply, actions: [], meta: { source: 'fallback', locale } }
  }

  if (isTrainingContext && isCheatingRequest(input.message)) {
    const reply = varyReply(
      userId,
      locale === 'uz' ? "Trainingda javobni to'g'ridan-to'g'ri bera olmayman." : 'I cannot provide direct answers in training mode.',
      locale,
      preferredName,
    )
    await persistConversation(userId, locale, contextMode, input.message, reply)
    return { reply, actions: [], meta: { source: 'fallback', locale } }
  }

  const openTest = parseOpenTestAction(input.message)
  if (openTest) {
    const reply = varyReply(userId, locale === 'uz' ? "So'ragan testingizni ochyapman." : 'Opening the requested test now.', locale, preferredName)
    await persistConversation(userId, locale, contextMode, input.message, reply)
    return { reply, actions: [{ type: 'open_test', payload: openTest }], meta: { source: 'fallback', locale } }
  }

  const speakingMode = parseSpeakingModeAction(input.message)
  if (speakingMode) {
    const reply = varyReply(
      userId,
      locale === 'uz' ? 'Speaking coach rejimi tayyor.' : 'Speaking coach mode is ready.',
      locale,
      preferredName,
    )
    await persistConversation(userId, locale, contextMode, input.message, reply)
    return { reply, actions: [{ type: 'speaking_mode', payload: speakingMode }], meta: { source: 'fallback', locale } }
  }

  if (isTrainingContext && !isVocabRequest(input.message)) {
    const reply = varyReply(
      userId,
      locale === 'uz' ? "Trainingda faqat lug'at bo'yicha yordam bera olaman." : 'In training mode I can help only with vocabulary.',
      locale,
      preferredName,
    )
    await persistConversation(userId, locale, contextMode, input.message, reply)
    return { reply, actions: [], meta: { source: 'fallback', locale } }
  }

  const navigate = isNavigationIntent(input.message) ? detectNavigateTarget(input.message) : null
  if (navigate) {
    const reply = varyReply(userId, locale === 'uz' ? "Bo'limni ochyapman." : 'Opening that section now.', locale, preferredName)
    await persistConversation(userId, locale, contextMode, input.message, reply)
    return { reply, actions: [{ type: 'navigate', target: navigate }], meta: { source: 'fallback', locale } }
  }

  const systemPrompt = [
    'You are ProfAI, a premium AI tutor and exam copilot.',
    locale === 'uz' ? 'Reply in Uzbek language.' : 'Reply in English language.',
    isTrainingContext
      ? 'Training mode: only vocabulary support, no direct answers.'
      : 'Study-first but general conversation allowed.',
    preferredName ? `Use user name sometimes: ${preferredName}.` : '',
    'Return strict JSON with keys: reply, actions.',
    'Allowed actions: navigate, open_test, speaking_mode.',
  ]
    .filter(Boolean)
    .join(' ')
  const userPrompt = JSON.stringify({
    locale,
    context_mode: contextMode,
    user_message: input.message,
    history: input.history.slice(-10),
    weak_track: context.weakTrack,
    allowed_targets: routeTargetSchema.options,
  })

  try {
    const source: AiChatResponse['meta']['source'] = env.OPENAI_API_KEY.trim()
      ? 'openai'
      : env.HF_ACCESS_TOKEN.trim()
        ? 'hf'
        : 'fallback'
    const raw =
      source === 'openai'
        ? await requestOpenAiChat(systemPrompt, userPrompt)
        : source === 'hf'
          ? await requestHfChat(systemPrompt, userPrompt)
          : null

    if (!raw) throw new Error('No provider configured')

    try {
      const parsed = extractJsonObject(raw)
      const validated = aiChatSchema.parse(parsed)
      const reply = varyReply(userId, validated.reply, locale, preferredName)
      await persistConversation(userId, locale, contextMode, input.message, reply)
      return {
        reply,
        actions: validated.actions,
        meta: { source, locale },
      }
    } catch {
      const plainReply = raw.trim().replace(/\s+/g, ' ').slice(0, 1800)
      const reply = varyReply(
        userId,
        plainReply.length >= 12
          ? plainReply
          : buildAdaptiveFallbackReply({
              locale,
              preferredName,
              message: input.message,
              weakTrack: context.weakTrack,
              contextMode,
            }),
        locale,
        preferredName,
      )
      await persistConversation(userId, locale, contextMode, input.message, reply)
      return { reply, actions: [], meta: { source, locale } }
    }
  } catch {
    const reply = varyReply(
      userId,
      buildAdaptiveFallbackReply({
        locale,
        preferredName,
        message: input.message,
        weakTrack: context.weakTrack,
        contextMode,
      }),
      locale,
      preferredName,
    )
    await persistConversation(userId, locale, contextMode, input.message, reply)
    return { reply, actions: [], meta: { source: 'fallback', locale } }
  }
}
