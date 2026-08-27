// AI examiner brain. Reuses the Gemini key-rotation layer from geminiAI.ts so it
// inherits the same multi-key / multi-model fallback (never blocked by quota).
//   - getExaminerReply(): the adaptive follow-up engine (Features 3 & 4).
//   - evaluateSpeaking(): IELTS band scoring across the 4 official criteria (Feature 6).

import { callGeminiAPI, extractJSON } from './geminiAI'
import type { SpeechStats } from '@/lib/speakingScoring'
import { estimateBandsFromStats } from '@/lib/speakingScoring'

export type ExaminerTurn = {
  role: 'examiner' | 'candidate'
  text: string
}

export type ExaminerDirective = 'follow_up' | 'transition' | 'closing'

export type ExaminerReplyParams = {
  /** 1 | 2 | 3 for IELTS, or 0 for a non-IELTS interview persona. */
  part: 0 | 1 | 2 | 3
  /** Examiner persona — defaults to a British IELTS examiner. */
  persona?: string
  history: ExaminerTurn[]
  directive: ExaminerDirective
  /** Topic/question to steer a transition to a fresh area. */
  seedQuestion?: string
  candidateName?: string
  /** 'examiner' (strict IELTS) or 'friend' (casual Free Talk). Defaults to examiner. */
  style?: 'examiner' | 'friend'
}

function buildExaminerSystemPrompt(persona: string): string {
  return `You are ${persona}. You are conducting a live spoken English assessment with a single candidate. You behave like a REAL human examiner, not a chatbot.

VOICE & MANNER:
- Warm, calm, professional. British English. Speak naturally, as if face to face.
- Ask ONE question at a time. Keep each turn SHORT (1–2 sentences, max ~35 words) because it will be read aloud.
- Never repeat or paraphrase a question that already appears in the conversation history.
- NEVER give feedback, scores, corrections, or praise about their English during the test. Stay in role as the examiner.
- Use the candidate's own words to ask genuine, adaptive follow-ups (e.g. they say "I play football" → "What position do you play, and why?").
- Remember everything said earlier in the conversation and occasionally refer back to it ("You mentioned earlier that…").
- Do not number your questions or say "Question 1". Just ask, like a person.
- No markdown, no emojis, no stage directions. Output ONLY the words you would say aloud.

DIRECTIVES:
- follow_up: dig deeper into the candidate's LAST answer with a natural, specific follow-up question.
- transition: smoothly move to a new topic. A seed topic/question may be provided — rephrase it in your own natural words.
- closing: politely close the current part or the whole test in one short, friendly sentence (e.g. "Thank you, that's the end of this part.").

RESPONSE FORMAT — return ONLY valid JSON, nothing else:
{ "reply": "<exactly what you say aloud>" }`
}

function buildFriendSystemPrompt(persona: string): string {
  return `You are ${persona}. You are having a relaxed, natural English conversation with someone who is practising their spoken English. You sound like a real, warm friend — NOT an examiner and NOT a robot.

VOICE & MANNER:
- Friendly, encouraging and genuinely curious. Natural spoken English.
- Keep each turn SHORT (1–2 sentences, max ~35 words) because it is read aloud.
- React to what they say first ("Oh nice!", "That makes sense"), share a brief opinion or relatable comment, THEN ask one natural follow-up question to keep the chat flowing.
- Build on earlier things they mentioned, like a friend who remembers.
- Never repeat or paraphrase a question that already appears in the conversation history.
- Do NOT correct their grammar or give feedback during the chat — just keep the conversation enjoyable and flowing.
- No markdown, no emojis, no stage directions. Output ONLY the words you would say aloud.

RESPONSE FORMAT — return ONLY valid JSON: { "reply": "<exactly what you say aloud>" }`
}

const DEFAULT_PERSONA = 'a friendly, experienced British IELTS speaking examiner'

function historyToText(history: ExaminerTurn[], candidateName?: string): string {
  const who = candidateName?.trim() || 'Candidate'
  return history
    .slice(-12)
    .map((t) => `${t.role === 'examiner' ? 'Examiner' : who}: ${t.text}`)
    .join('\n')
}

function normalizeExaminerQuestion(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function wasAlreadyAsked(reply: string, history: ExaminerTurn[]): boolean {
  const normalizedReply = normalizeExaminerQuestion(reply)
  return history.some(
    (turn) => turn.role === 'examiner' && normalizeExaminerQuestion(turn.text) === normalizedReply,
  )
}

/** Generate the examiner's next spoken line. Falls back to a scripted line on error. */
export async function getExaminerReply(params: ExaminerReplyParams): Promise<string> {
  const persona = params.persona ?? DEFAULT_PERSONA
  const system = params.style === 'friend' ? buildFriendSystemPrompt(persona) : buildExaminerSystemPrompt(persona)

  const partLabel =
    params.style === 'friend' ? 'Casual conversation' : params.part === 0 ? 'Interview' : `IELTS Speaking Part ${params.part}`
  const directiveLine =
    params.directive === 'follow_up'
      ? 'Ask a natural follow-up question about the candidate’s last answer.'
      : params.directive === 'transition'
        ? `Move to a new topic.${params.seedQuestion ? ` Base it on this idea: "${params.seedQuestion}"` : ''}`
        : 'Politely close this part in one short sentence.'

  const userMessage = `CONTEXT: ${partLabel}.
${directiveLine}

Conversation so far:
${historyToText(params.history, params.candidateName) || '(the test is just starting)'}

Respond with JSON only: { "reply": "<what you say next>" }`

  try {
    const raw = await callGeminiAPI(system, userMessage, 256, [], 'speaking_examiner')
    const parsed = JSON.parse(extractJSON(raw)) as { reply?: string }
    const reply = (parsed.reply ?? '').trim()
    if (reply && !wasAlreadyAsked(reply, params.history)) return reply
  } catch {
    // fall through to scripted fallback
  }
  return fallbackExaminerLine(params)
}

function fallbackExaminerLine(params: ExaminerReplyParams): string {
  if (params.directive === 'closing') return 'Thank you. That brings us to the end of this part.'
  if (params.directive === 'transition' && params.seedQuestion) return params.seedQuestion
  const generic = [
    'That’s interesting — could you tell me a little more about that?',
    'Why do you think that is?',
    'Can you give me an example?',
    'How did that make you feel?',
    'What led you to that view?',
    'Has your opinion about that changed over time?',
  ]
  const asked = new Set(
    params.history
      .filter((turn) => turn.role === 'examiner')
      .map((turn) => normalizeExaminerQuestion(turn.text)),
  )
  const unused = generic.filter((question) => !asked.has(normalizeExaminerQuestion(question)))
  const choices = unused.length > 0 ? unused : generic
  return choices[Math.floor(Math.random() * choices.length)]
}

// ── Band scoring ────────────────────────────────────────────────────────────
export type SpeakingEvaluation = {
  overallBand: number
  fluencyBand: number
  lexicalBand: number
  grammarBand: number
  pronunciationBand: number
  summary: string
  strengths: string[]
  weaknesses: string[]
  improvementPriorities: Array<{ area: string; target: number; action: string }>
  stats: SpeechStats
  source: 'ai' | 'offline'
}

const EVALUATION_PROMPT = `You are a senior, certified IELTS Speaking examiner with 15+ years of experience. You apply the official IELTS Speaking band descriptors with real-exam rigour and fairness. Pronunciation must be judged ONLY from the transcript's evidence (rhythm, sentence flow, fillers) since you cannot hear audio — estimate conservatively and say so if uncertain.

TASK: Evaluate the candidate's spoken responses. Return a SINGLE valid JSON object and NOTHING else.

SCORE EACH CRITERION 0.0–9.0 in 0.5 steps:
1) fluencyBand — Fluency & Coherence: flow, hesitation, fillers, logical development, linking.
2) lexicalBand — Lexical Resource: range, precision, collocation, paraphrase, idiomatic language.
3) grammarBand — Grammatical Range & Accuracy: variety of structures, accuracy, error density.
4) pronunciationBand — Pronunciation: estimated from rhythm, chunking and filler load (be cautious; anchor near fluency).

SCORING DISCIPLINE:
- Be realistic: most genuine attempts land 5.0–6.5. Award 7.0+ only for clearly strong, well-developed answers; 8.0+ only for near-native control. Very short or off-topic answers must score low (≤4.5).
- overallBand = average of the 4 criteria, rounded to the nearest 0.5.

FEEDBACK:
- summary: 2–3 honest sentences naming the single biggest lever to raise the band.
- strengths: 3 specific things they did well (reference what they actually said).
- weaknesses: 3 specific, concrete problems (not generic).
- improvementPriorities: 3 items, each { "area": <criterion>, "target": <achievable next band as number>, "action": <one concrete practice step> }.

RESPONSE FORMAT (strict JSON, no markdown):
{
  "fluencyBand": <number>,
  "lexicalBand": <number>,
  "grammarBand": <number>,
  "pronunciationBand": <number>,
  "overallBand": <number>,
  "summary": "<2-3 sentences>",
  "strengths": ["<...>", "<...>", "<...>"],
  "weaknesses": ["<...>", "<...>", "<...>"],
  "improvementPriorities": [
    { "area": "<criterion>", "target": <number>, "action": "<step>" }
  ]
}`

function clampBand(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return 5
  return Math.round(Math.max(2, Math.min(9, num)) * 2) / 2
}

export type EvaluateParams = {
  modeLabel: string
  history: ExaminerTurn[]
  stats: SpeechStats
}

export async function evaluateSpeaking(params: EvaluateParams): Promise<SpeakingEvaluation> {
  const transcript = params.history
    .map((t) => `${t.role === 'examiner' ? 'Examiner' : 'Candidate'}: ${t.text}`)
    .join('\n')

  const userMessage = `ASSESSMENT TYPE: ${params.modeLabel}

OBJECTIVE SPEECH STATS (from automatic analysis):
- Total words spoken: ${params.stats.wordCount}
- Distinct words: ${params.stats.uniqueWords} (lexical variety ${(params.stats.typeTokenRatio * 100).toFixed(0)}%)
- Filler words: ${params.stats.fillerCount}${params.stats.fillerWords.length ? ` (${params.stats.fillerWords.join(', ')})` : ''}
- Speaking pace: ${params.stats.wordsPerMinute} words/min over ${params.stats.durationSec}s

FULL TRANSCRIPT (examiner questions + candidate answers):
${transcript}

Grade the CANDIDATE's spoken English now. Return ONLY valid JSON.`

  try {
    const raw = await callGeminiAPI(EVALUATION_PROMPT, userMessage, 2048, [], 'speaking_evaluation')
    const parsed = JSON.parse(extractJSON(raw)) as Partial<SpeakingEvaluation>
    const fluencyBand = clampBand(parsed.fluencyBand)
    const lexicalBand = clampBand(parsed.lexicalBand)
    const grammarBand = clampBand(parsed.grammarBand)
    const pronunciationBand = clampBand(parsed.pronunciationBand)
    const overallBand = parsed.overallBand
      ? clampBand(parsed.overallBand)
      : clampBand((fluencyBand + lexicalBand + grammarBand + pronunciationBand) / 4)

    return {
      fluencyBand,
      lexicalBand,
      grammarBand,
      pronunciationBand,
      overallBand,
      summary: parsed.summary?.trim() || 'Evaluation complete.',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 4) : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.slice(0, 4) : [],
      improvementPriorities: Array.isArray(parsed.improvementPriorities)
        ? parsed.improvementPriorities
            .filter((p) => p && p.area && p.action)
            .slice(0, 4)
            .map((p) => ({ area: String(p.area), target: clampBand(p.target), action: String(p.action) }))
        : [],
      stats: params.stats,
      source: 'ai',
    }
  } catch {
    // AI unreachable (e.g. quota) — return an offline heuristic so a result still shows.
    return offlineEvaluation(params)
  }
}

// ── Grammar analysis (per-answer feedback) ─────────────────────────────────
// Lightweight, fast prompt used by the Day-by-day IELTS Speaking runner. The user
// records (or types) one answer to one question; we return: a list of specific
// grammar mistakes with explanations, a clean AI-corrected version, and a Band 8+
// model rewrite of their own ideas. Different from evaluateSpeaking (whole exam).

export type GrammarIssue = {
  original: string
  corrected: string
  explanation: string
  category: 'grammar' | 'vocabulary' | 'pronunciation' | 'cohesion' | 'fluency'
}

export type SpeakingResponseAnalysis = {
  correctedVersion: string
  band8Template: string
  issues: GrammarIssue[]
  strengths: string[]
  suggestions: string[]
  estimatedBand: number
  source: 'ai' | 'offline'
}

const RESPONSE_ANALYSIS_PROMPT = `You are an experienced British IELTS Speaking examiner and English coach. A candidate has just answered a Speaking question. You will receive the question and their full spoken response (transcribed from audio). Your job is to give SHORT, useful, kind feedback that helps them improve.

TASK — return ONE JSON object with these fields:

1. "correctedVersion" — Take the candidate's exact response and fix ONLY clear grammar, word-choice and pronunciation-spelling mistakes. Keep their meaning, ideas, examples and voice exactly the same. This is them, cleaned up. Do NOT rewrite or improve the content — just correct errors. If the response is already clean, return it as-is.

2. "band8Template" — Now write a NEW model answer to the same question, at IELTS Band 8+ level, using the candidate's ideas as inspiration where possible but improving structure, vocabulary range, idiomatic phrases and complex sentences. Length: appropriate for the part (Part 1 ~50–80 words; Part 2 ~180–230 words; Part 3 ~80–130 words). Natural spoken English, not academic prose.

3. "issues" — Up to 6 specific mistakes from the candidate's response. For each item: "original" (exact erroneous fragment from their response), "corrected" (the fix — must be different from original), "explanation" (one sentence: WHY it's wrong + the rule, in plain language), "category" (one of: grammar, vocabulary, pronunciation, cohesion, fluency). If there are no real errors, return an empty array.

4. "strengths" — 2–3 specific things they did well (reference what they actually said).

5. "suggestions" — 2–3 concrete next-step tips (e.g. "Try using past perfect when describing a sequence of events").

6. "estimatedBand" — A rough overall band for this single answer, 0–9 in 0.5 steps. Be realistic: most genuine attempts land 5.0–6.5.

RULES:
- NEVER include items in "issues" where the original is identical to the corrected text or where the explanation says it is "fine" or "already correct".
- "correctedVersion" must be plain text, not markdown.
- Return ONLY valid JSON, no markdown fences.`

function clampBandHalf(value: unknown): number {
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(num)) return 5
  return Math.round(Math.max(0, Math.min(9, num)) * 2) / 2
}

function validIssueCategory(cat: string): GrammarIssue['category'] {
  const valid = ['grammar', 'vocabulary', 'pronunciation', 'cohesion', 'fluency'] as const
  return (valid as readonly string[]).includes(cat) ? (cat as GrammarIssue['category']) : 'grammar'
}

function normalise(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').replace(/[.,;:!?]+$/g, '').trim()
}

export async function analyzeSpeakingResponse(params: {
  part: 1 | 2 | 3
  question: string
  /** Spoken response (already transcribed). */
  transcript: string
}): Promise<SpeakingResponseAnalysis> {
  const text = (params.transcript || '').trim()
  if (text.length < 5) {
    return {
      correctedVersion: text,
      band8Template: '',
      issues: [],
      strengths: [],
      suggestions: ['Try speaking for longer — develop your answer with a reason and a clear example.'],
      estimatedBand: 0,
      source: 'offline',
    }
  }

  const userMessage = `IELTS Speaking Part ${params.part}.

QUESTION:
${params.question}

CANDIDATE'S RESPONSE (transcribed):
${text}

Analyse and return ONLY valid JSON.`

  try {
    const raw = await callGeminiAPI(RESPONSE_ANALYSIS_PROMPT, userMessage, 2048, [], 'speaking_response_analysis')
    const parsed = JSON.parse(extractJSON(raw)) as Partial<SpeakingResponseAnalysis>
    const issues = Array.isArray(parsed.issues)
      ? parsed.issues
          .map((issue) => ({
            original: String(issue?.original ?? '').trim(),
            corrected: String(issue?.corrected ?? '').trim(),
            explanation: String(issue?.explanation ?? '').trim(),
            category: validIssueCategory(String(issue?.category ?? 'grammar')),
          }))
          .filter((i) => {
            if (!i.original || !i.corrected) return false
            if (normalise(i.original) === normalise(i.corrected)) return false
            if (/\b(is|are|seems?|looks?)\s+(fine|correct|accurate|good)\b/i.test(i.explanation)) return false
            return true
          })
          .slice(0, 6)
      : []

    return {
      correctedVersion: String(parsed.correctedVersion ?? text).trim(),
      band8Template: String(parsed.band8Template ?? '').trim(),
      issues,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 4).map(String) : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 4).map(String) : [],
      estimatedBand: clampBandHalf(parsed.estimatedBand),
      source: 'ai',
    }
  } catch {
    return {
      correctedVersion: text,
      band8Template: '',
      issues: [],
      strengths: ['You attempted a full spoken answer.'],
      suggestions: ['AI grading is temporarily unavailable. Please try again in a moment.'],
      estimatedBand: 0,
      source: 'offline',
    }
  }
}

function offlineEvaluation(params: EvaluateParams): SpeakingEvaluation {
  const bands = estimateBandsFromStats(params.stats)
  const { wordCount, fillerCount, wordsPerMinute } = params.stats
  const weaknesses: string[] = []
  if (fillerCount > 4) weaknesses.push(`Reduce filler words — you used ${fillerCount}. Pause silently instead.`)
  if (wordCount < 60) weaknesses.push('Develop answers further — extend each idea with a reason and an example.')
  if (wordsPerMinute && (wordsPerMinute < 80 || wordsPerMinute > 180))
    weaknesses.push('Aim for a steady, natural pace of roughly 110–150 words per minute.')
  if (weaknesses.length === 0) weaknesses.push('Use a wider range of complex sentences and topic-specific vocabulary.')

  return {
    ...bands,
    summary:
      'Offline estimate (AI grading was unavailable). Scores are approximate, based on your fluency, pace and vocabulary range. Try again shortly for a full AI assessment.',
    strengths: [
      wordCount >= 60 ? 'You produced a good amount of speech.' : 'You attempted the full answer.',
      params.stats.typeTokenRatio >= 0.5 ? 'Reasonable vocabulary variety.' : 'Clear, understandable ideas.',
    ],
    weaknesses: weaknesses.slice(0, 3),
    improvementPriorities: [
      { area: 'Fluency & Coherence', target: clampBand(bands.fluencyBand + 0.5), action: 'Practise speaking for 2 minutes without stopping on one topic.' },
      { area: 'Lexical Resource', target: clampBand(bands.lexicalBand + 0.5), action: 'Learn 5 topic phrases daily and use them when you speak.' },
    ],
    stats: params.stats,
    source: 'offline',
  }
}
