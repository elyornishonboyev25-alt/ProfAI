import { apiClient } from '@/lib/apiClient'

export type AiGenerationPurpose =
  | 'assistant_chat'
  | 'writing_evaluation'
  | 'word_explanation'
  | 'speaking_examiner'
  | 'speaking_evaluation'
  | 'speaking_response_analysis'
  | 'weekly_plan'

export interface WritingError {
  original: string
  corrected: string
  explanation: string
  category: 'grammar' | 'vocabulary' | 'spelling' | 'punctuation' | 'coherence' | 'task'
}

export interface WritingEvaluation {
  overallBand: number
  taskAchievement: number
  coherenceCohesion: number
  lexicalResource: number
  grammaticalRange: number
  summary: string
  strengths: string[]
  improvements: string[]
  errors: WritingError[]
  correctedVersion: string
  xpAwarded: number
}

export interface GeminiChatAction {
  type: 'navigate' | 'open_writing_test' | 'open_test' | 'start_mock' | 'save_word'
  target?: string
  payload?: {
    /** Reading/Listening track for open_test. */
    track?: 'reading' | 'listening'
    /** Concrete test id ("ielts-listening-2") or catalog id ("listening-full-2"). */
    testId?: string
    /** "Listening test 2" → 2. Used when no exact testId is known. */
    ordinal?: number
    /** True when the user asked for an unfinished / next / not-yet-done test. */
    unfinished?: boolean
    /** Mock exam family for start_mock. */
    mock?: 'ielts' | 'sat'
    durationMinutes?: number
    timerEnabled?: boolean
    term?: string
    definition?: string
    example?: string
    synonym?: string
    context?: 'reading' | 'listening' | 'writing' | 'speaking' | 'article' | 'sat'
  }
}

export interface GeminiChatResponse {
  reply: string
  replyLanguage?: 'en' | 'uz' | 'ru'
  actions: GeminiChatAction[]
  title: string | null
  memoryUpdates: Array<{ key: string; value: string }>
  savedMemories?: import('@/store/aiAssistantStore').AiMemoryItem[]
  sources?: Array<{ title: string; url: string }>
}

// Structured word explanation used by the "Ask AI about this word" feature in Reading,
// Listening, and Article views. The English definition/example/synonym are shaped exactly like
// a Vocabulary Arena entry so the word can be saved and studied with the same activities, while
// `explanation` is a friendly, simple teaching written in the language the learner asked for.
export interface WordExplanation {
  term: string
  partOfSpeech: string
  definition: string
  example: string
  synonym: string
  explanation: string
  language: string
}

export async function callGeminiAPI(
  systemPrompt: string,
  userMessage: string,
  maxOutputTokens = 2048,
  images: string[] = [],
  purpose: AiGenerationPurpose = 'assistant_chat',
  signal?: AbortSignal,
): Promise<string> {
  const response = await apiClient.post<{ text: string }>('/ai/generate', {
    purpose,
    systemPrompt,
    userMessage,
    maxOutputTokens,
    images,
  }, { signal })
  return response.text
}

export function extractJSON(raw: string): string {
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) return fenceMatch[1].trim()
  const braceStart = raw.indexOf('{')
  const braceEnd = raw.lastIndexOf('}')
  if (braceStart !== -1 && braceEnd > braceStart) {
    return raw.slice(braceStart, braceEnd + 1)
  }
  return raw.trim()
}

export async function evaluateWriting(
  taskType: 'task1' | 'task2', prompt: string, studentResponse: string, _wordCount: number, visualContext?: string,
): Promise<WritingEvaluation> {
  if (!studentResponse.trim()) return {
    overallBand: 0, taskAchievement: 0, coherenceCohesion: 0, lexicalResource: 0, grammaticalRange: 0,
    summary: 'No response was submitted for this task, so there is no writing to assess.', strengths: [],
    improvements: ['Write a response that addresses every part of the task prompt.'], errors: [], correctedVersion: '', xpAwarded: 0,
  }
  // The backend owns the rubric, word count, score calculation and evidence checks.
  return apiClient.post<WritingEvaluation>('/ai/generate/writing/evaluate', { taskType, prompt, response: studentResponse, visualContext })
}
export type ChatAssistantOptions = {
  coachPreferences?: import('@/services/ai/coachPreferences').CoachPreferences
  workspace?: import('@/services/ai/workspaces').AiWorkspaceId
  threadId?: string
  delivery?: 'text' | 'voice'
  mode?: 'coach' | 'examiner'
  onReply?: (reply: string) => void
  signal?: AbortSignal
  studyContext?: string
  learnerName?: string | null
  screenContext?: string
  workspaceContext?: string
  siteKnowledge?: string
  /** Image attachments (data URLs) the learner sent — e.g. a screenshot. */
  images?: string[]
  /** Text follows the current message by default; voice can specify its transcription language. */
  responseLanguage?: 'auto' | 'en' | 'uz' | 'ru'
  memories?: Array<{ key: string; value: string }>
  generateTitle?: boolean
}

export async function chatWithAssistant(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>,
  pathname: string,
  options: ChatAssistantOptions = {},
): Promise<GeminiChatResponse> {
  const payload = {
    coachPreferences: options.coachPreferences,
    message, history: history.slice(-24), pathname, workspace: options.workspace ?? 'general',
    language: options.responseLanguage ?? 'auto', mode: options.mode ?? 'coach', threadId: options.threadId,
    studyContext: (options.studyContext ?? '').slice(0, 16000), screenContext: (options.screenContext ?? '').slice(0, 12000),
    siteKnowledge: (options.siteKnowledge ?? '').slice(0, 16000), images: options.images ?? [],
    delivery: options.delivery ?? 'text', generateTitle: options.generateTitle ?? false,
  }
  if (!options.onReply) return apiClient.post<GeminiChatResponse>('/ai/assistant/chat', payload, { signal: options.signal })
  const response = await apiClient.postStream('/ai/assistant/stream', payload, { signal: options.signal })
  if (!response.body) throw new Error('Streaming is unavailable.')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let event = ''
  let final: GeminiChatResponse | null = null
  try {
    while (true) {
      const chunk = await reader.read()
      buffer += chunk.done ? decoder.decode() : decoder.decode(chunk.value, { stream: true })
      let end: number
      while ((end = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, end).replace(/\r$/, '')
        buffer = buffer.slice(end + 1)
        if (line.startsWith('event:')) event = line.slice(6).trim()
        if (!line.startsWith('data:')) continue
        const data = JSON.parse(line.slice(5))
        if (event === 'error') throw new Error(data.message ?? 'AI response was interrupted.')
        if (event === 'reply' && typeof data.reply === 'string') options.onReply(data.reply)
        if (event === 'done') final = data as GeminiChatResponse
      }
      if (chunk.done) break
    }
    if (!final?.reply?.trim()) throw new Error('The answer did not finish. Please retry.')
    return final
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock() }

}

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  uz: "Uzbek (O'zbek tili)",
  ru: 'Russian (Русский)',
  tr: 'Turkish (Türkçe)',
  ar: 'Arabic (العربية)',
  es: 'Spanish (Español)',
  fr: 'French (Français)',
}

const WORD_EXPLANATION_PROMPT = `You are a warm, expert English vocabulary tutor helping a student who is reading and met a word or phrase they do not understand. Explain it so clearly that a beginner instantly gets it. Never be vague, never invent a meaning — if the phrase is an idiom or has a special sense in the given context, explain THAT exact sense.

You will receive: the WORD/PHRASE, the SENTENCE it appeared in (context), and the LANGUAGE the student wants the friendly explanation written in.

Return a SINGLE valid JSON object and NOTHING else (no markdown fences, no extra text):
{
  "term": "<the word/phrase, cleaned up and lowercased unless it is a proper noun>",
  "partOfSpeech": "<noun | verb | adjective | adverb | phrase | idiom | ...>",
  "definition": "<one clear, simple ENGLISH definition (this is saved as a flashcard, so keep it self-contained — max ~14 words)>",
  "example": "<one short, natural ENGLISH example sentence using the word — NOT copied from the student's sentence>",
  "synonym": "<one common English synonym or a 2-3 word equivalent>",
  "explanation": "<2-4 friendly sentences that TEACH the meaning, written ENTIRELY in the requested language. Explain what it means here in context, in plain words a learner understands. If the requested language is not English, do NOT write the explanation in English.>"
}

Rules:
- "definition", "example", and "synonym" are ALWAYS in English (they become a study flashcard).
- "explanation" is ALWAYS in the requested language only.
- Keep everything accurate and beginner-friendly. No filler, no repetition.`

// Ask the AI to explain a word/phrase the learner selected. `language` is a code like 'en' or
// 'uz' (default English). The result is structured so it can be shown in the popover AND saved
// to the personal vocabulary store as a study card.
export async function explainWord(
  word: string,
  context: string,
  language = 'en',
): Promise<WordExplanation> {
  const langLabel = LANGUAGE_LABELS[language] ?? language
  const userMessage = `WORD/PHRASE: ${word}
SENTENCE (context): ${context || '(no surrounding sentence provided)'}
EXPLANATION LANGUAGE: ${langLabel}

Explain it now. Return ONLY valid JSON.`

  const raw = await callGeminiAPI(WORD_EXPLANATION_PROMPT, userMessage, 1024, [], 'word_explanation')
  const jsonStr = extractJSON(raw)

  try {
    const parsed = JSON.parse(jsonStr) as Partial<WordExplanation>
    const term = (parsed.term || word).trim()
    return {
      term,
      partOfSpeech: (parsed.partOfSpeech || '').trim(),
      definition: (parsed.definition || '').trim(),
      example: (parsed.example || '').trim(),
      synonym: (parsed.synonym || '').trim(),
      explanation: (parsed.explanation || '').trim(),
      language,
    }
  } catch {
    // Fall back to showing the raw reply so the learner still gets help.
    return {
      term: word.trim(),
      partOfSpeech: '',
      definition: '',
      example: '',
      synonym: '',
      explanation: raw.replace(/```json|```/g, '').trim(),
      language,
    }
  }
}
