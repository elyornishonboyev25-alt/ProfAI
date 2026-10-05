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

const WRITING_EVALUATION_PROMPT = `You are an IELTS Writing practice evaluator. Apply the public IELTS band descriptors carefully to provide an estimated band and specific feedback.

TASK: Evaluate the student's IELTS writing response. Return a SINGLE valid JSON object and NOTHING else — no markdown fences, no text outside the JSON.

SCORE EACH OF THE 4 CRITERIA (0.0–9.0, in 0.5 steps), then the overall band.

1) Task Achievement / Task Response (taskAchievement):
   - Task 1: Does it have a clear overview of main trends? Are key features and accurate data selected? The minimum is 150 words; a shorter answer may provide less evidence for the descriptors.
   - Task 2: Does it fully address all parts of the prompt with a clear position, developed ideas, and relevant examples? The minimum is 250 words; a shorter answer may provide less evidence for the descriptors.

2) Coherence & Cohesion (coherenceCohesion):
   - Logical paragraphing, clear progression, accurate linking devices (not over/under-used), referencing.

3) Lexical Resource (lexicalResource):
   - Range and precision of vocabulary, collocation, word formation, appropriacy. Penalise repetition and misused words.

4) Grammatical Range & Accuracy (grammaticalRange):
   - Range of structures (simple vs complex), accuracy, punctuation, error density and how much errors impede communication.

SCORING DISCIPLINE:
- Base every criterion on evidence in this response. Award high bands only where the public descriptors are clearly met.
- overallBand = average of the 4 criteria, rounded to the nearest 0.5 (IELTS rounding).
- Score each criterion INDEPENDENTLY based on evidence in the text.

ERROR ANALYSIS — THE MOST IMPORTANT PART (read carefully):
- List ONLY genuine errors. For EVERY item, "corrected" MUST be meaningfully DIFFERENT from "original".
- ❌ ABSOLUTELY FORBIDDEN: listing a sentence whose corrected version is identical (or near-identical) to the original. NEVER mark correct text as an error. If a sentence is already correct, DO NOT include it at all.
- ❌ Do NOT include items where the explanation says the text "is accurate / is correct / is fine". Those are not errors — omit them.
- "original" = the exact erroneous fragment copied from the student (keep it short — just the part that is wrong, not the whole sentence when possible).
- "corrected" = the minimally-fixed version of that same fragment.
- "explanation" = WHY it is wrong and the rule, in one or two clear sentences a learner understands.
- Categorise precisely: "grammar", "vocabulary", "spelling", "punctuation", "coherence", or "task".
- Order errors by importance (most impactful first). Include every real error, up to ~15. If the writing is genuinely error-free, return an empty errors array.

CORRECTED VERSION RULES:
- If there is enough content, rewrite the FULL response at a clean Band 7–7.5 level: fix errors while keeping the student's ideas and meaning. If there is too little content to rewrite, return an empty string.

STRENGTHS / IMPROVEMENTS:
- "strengths": up to 3 specific things the student did well. Use an empty array if there is too little evidence.
- "improvements": 3 concrete, prioritised, actionable steps that would raise the band (e.g. "Add a one-sentence overview before details", not "improve grammar").

SUMMARY: 2–3 sentences — honest overall assessment naming the biggest lever for improvement.

XP CALCULATION: the application calculates XP deterministically from the final band. Set xpAwarded to 0.

RESPONSE FORMAT (strict JSON, no markdown):
{
  "overallBand": <number>,
  "taskAchievement": <number>,
  "coherenceCohesion": <number>,
  "lexicalResource": <number>,
  "grammaticalRange": <number>,
  "summary": "<2-3 sentence overall assessment>",
  "strengths": ["<specific strength>", "<specific strength>", "<specific strength>"],
  "improvements": ["<actionable step>", "<actionable step>", "<actionable step>"],
  "errors": [
    {
      "original": "<exact erroneous fragment from the student>",
      "corrected": "<fixed version — MUST differ from original>",
      "explanation": "<why it is wrong + the rule>",
      "category": "<grammar|vocabulary|spelling|punctuation|coherence|task>"
    }
  ],
  "correctedVersion": "<full corrected essay at band 7+>",
  "xpAwarded": <number>
}`

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
  taskType: 'task1' | 'task2',
  prompt: string,
  studentResponse: string,
  wordCount: number,
  visualContext?: string,
): Promise<WritingEvaluation> {
  if (!studentResponse.trim()) {
    return {
      overallBand: 0,
      taskAchievement: 0,
      coherenceCohesion: 0,
      lexicalResource: 0,
      grammaticalRange: 0,
      summary: 'No response was submitted for this task, so there is no writing to assess.',
      strengths: [],
      improvements: [`Write a ${taskType === 'task1' ? '150' : '250'}-word response that addresses every part of the task prompt.`, 'Review the task instructions and plan your main ideas before writing.'],
      errors: [],
      correctedVersion: '',
      xpAwarded: 0,
    }
  }
  const userMessage = `TASK TYPE: IELTS Writing ${taskType === 'task1' ? 'Task 1' : 'Task 2'}

QUESTION/PROMPT:
${prompt}

${visualContext ? `VISUAL DATA FOR TASK 1 (use this to check factual accuracy):\n${visualContext}\n` : ''}

STUDENT'S RESPONSE (${wordCount} words):
${studentResponse}

Evaluate this response now. Return ONLY valid JSON.`

  const raw = await callGeminiAPI(WRITING_EVALUATION_PROMPT, userMessage, 8192, [], 'writing_evaluation')
  const jsonStr = extractJSON(raw)

  try {
    const parsed = JSON.parse(jsonStr) as WritingEvaluation
    if (![parsed.taskAchievement, parsed.coherenceCohesion, parsed.lexicalResource, parsed.grammaticalRange].every((band) => Number.isFinite(band)) ||
      !parsed.summary?.trim() || !Array.isArray(parsed.strengths) ||
      !Array.isArray(parsed.improvements)) {
      throw new Error('Incomplete AI evaluation')
    }
    const criteria = [parsed.taskAchievement, parsed.coherenceCohesion, parsed.lexicalResource, parsed.grammaticalRange].map(clampBand)
    const overallBand = clampBand(criteria.reduce((sum, band) => sum + band, 0) / criteria.length)
    return {
      overallBand,
      taskAchievement: criteria[0],
      coherenceCohesion: criteria[1],
      lexicalResource: criteria[2],
      grammaticalRange: criteria[3],
      summary: parsed.summary || 'Evaluation completed.',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 5) : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.slice(0, 5) : [],
      errors: Array.isArray(parsed.errors)
        ? parsed.errors
            .map((e) => ({
              original: (e.original || '').trim(),
              corrected: (e.corrected || '').trim(),
              explanation: (e.explanation || '').trim(),
              category: validateCategory(e.category),
            }))
            // Defensive: drop false positives where the model flagged correct text
            // (original identical to correction, or an empty/“is accurate” note).
            .filter((e) => {
              if (!e.original || !e.corrected) return false
              const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').replace(/[.,;:!?]+$/g, '').trim()
              if (norm(e.original) === norm(e.corrected)) return false
              if (!studentResponse.toLowerCase().includes(e.original.toLowerCase())) return false
              if (/\b(is|are|looks?|seems?)\s+(accurate|correct|fine|good|appropriate)\b/i.test(e.explanation)) return false
              return true
            })
        : [],
      correctedVersion: parsed.correctedVersion || '',
      xpAwarded: calculateXP(overallBand),
    }
  } catch {
    throw new Error('AI feedback was incomplete. Please retry the evaluation.')
  }
}

export type ChatAssistantOptions = {
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
  /** Explicit EN / UZ / RU selector; overrides automatic reply-language detection. */
  responseLanguage?: 'en' | 'uz' | 'ru'
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
    message, history: history.slice(-24), pathname, workspace: options.workspace ?? 'general',
    language: options.responseLanguage ?? 'en', mode: options.mode ?? 'coach', threadId: options.threadId,
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

function clampBand(value: unknown): number {
  const num = typeof value === 'number' ? value : 0
  return Math.round(Math.max(0, Math.min(9, num)) * 2) / 2
}

function validateCategory(cat: string): WritingError['category'] {
  const valid = ['grammar', 'vocabulary', 'spelling', 'punctuation', 'coherence', 'task'] as const
  return valid.includes(cat as typeof valid[number]) ? (cat as WritingError['category']) : 'grammar'
}

function calculateXP(band: number): number {
  return 20 + Math.round((Math.max(0, Math.min(9, band)) / 9) * 60)
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
