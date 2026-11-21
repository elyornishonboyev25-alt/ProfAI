import { z } from 'zod'
import { francAll } from 'franc'

export const novaLanguageSchema = z.enum(['uz', 'en', 'ru'])
export const novaLanguageChoiceSchema = z.enum(['auto', 'uz', 'en', 'ru'])
export type NovaLanguage = z.infer<typeof novaLanguageSchema>
export type NovaLanguageChoice = z.infer<typeof novaLanguageChoiceSchema>
export type LanguageObservation = { language: NovaLanguage | 'unknown'; status: 'supported' | 'ambiguous' | 'unsupported'; basis: 'request' | 'lexical' | 'profile' | 'insufficient' | 'script'; detectedCode?: string }
export const languageNames = { uz: 'Uzbek in Latin script', en: 'English', ru: 'Russian' }
export const novaVocabulary = ['Nova', 'Ivygoo', 'Toshkent', 'Samarqand', 'Elyor', 'O‘zbekiston', 'IELTS', 'SAT', 'Present Simple', 'formula']
const apostrophes = /[‘’ʻʼ`´]/g
export const normalizeUzbek = (text: string) => text.normalize('NFKC').replace(apostrophes, "'")
export function proseForLanguage(text: string) {
  return normalizeUzbek(text).replace(/```[\s\S]*?```|`[^`]*`|\$\$[\s\S]*?\$\$|\$[^$\n]+\$|https?:\/\/\S+/g, ' ')
    .replace(/E,\s*sen\s*(?:ahmoq|tvar|chumo|dalbayop)(?:[,\s.…]*(?:nima\s+deyapsan\??)?)?/gi, ' ')
    .replace(/(?:"[^"\n]{0,180}"|“[^”\n]{0,180}”|«[^»\n]{0,180}»)/g, ' ').replace(/^\s*>.*$/gm, ' ')
}
export function explicitLanguageRequest(text: string): NovaLanguage | undefined {
  const value = normalizeUzbek(text).toLowerCase()
  const matches = [...value.matchAll(/(?:endi|endilikda|davom|tushuntir|gapir|javob|speak|reply|explain|continue|switch|теперь|говори|объясни|отвечай|продолж|перейд)[^.!?\n]{0,35}?(o'zbekcha|o‘zbekcha|uzbek|english|inglizcha|ruscha|russian|по-русски|русском|ўзбекча)|(?:o'zbekcha|inglizcha|ruscha|english|uzbek|russian|по-русски|ўзбекча)\s+(?:davom|tushuntir|gapir|javob|please|тушунтир|давом)/g)]
  const last = matches[matches.length - 1]?.[0]
  return last ? /ruscha|russian|русск/.test(last) ? 'ru' : /inglizcha|english/.test(last) ? 'en' : 'uz' : undefined
}
const vocab = {
  uz: /\b(?:menga|meni|men|sen|siz|nega|qanday|nima|yana|boshqa|tushuntir\w*|tushun\w*|ko'rsat\w*|iltimos|hozir|uchun|bilan|qilib|qil\w*|emas|bo'l\w*|o'rgat\w*|tayyorlan\w*|toshkent\w*)\b/gi,
  en: /\b(?:i|you|am|is|are|and|can|not|for|it|will|the|this|that|what|why|how|please|explain|could|would|should|because|your|with|teach|help|understand|show|thanks)\b/gi,
  ru: /(?:\b(?:это|как|почему|что|мне|меня|объясни\w*|покажи|пожалуйста|понятно|нужно|давай|теперь|можно|спасибо)\b)/giu,
}
export function inspectLanguage(text: string): LanguageObservation {
  const value = proseForLanguage(text), requested = explicitLanguageRequest(value)
  if (requested) return { language: requested, status: 'supported', basis: 'request' }
  const letters = value.match(/\p{L}/gu) ?? []
  if (!letters.length) return { language: 'unknown', status: 'ambiguous', basis: 'insufficient' }
  if ((value.match(/[\p{Script=Arabic}\p{Script=Han}\p{Script=Hangul}\p{Script=Devanagari}]/gu)?.length ?? 0) > Math.max(3, letters.length * .4)) return { language: 'unknown', status: 'unsupported', basis: 'script' }
  // Uzbek Cyrillic is language evidence, not a Russian-language switch.
  if (/[ўқғҳЎҚҒҲ]/.test(value) && /(?:мен|сен|сиз|қоида|тушун|нима|қандай|билан|учун|ўргат)/iu.test(value)) return { language: 'uz', status: 'supported', basis: 'lexical' }
  const uzCyr = /(?:менга|тушунтир|яна|бошқа|учун|билан|нима|қандай|эмас|давом)/iu.test(value)
  if (uzCyr) return { language: 'uz', status: 'supported', basis: 'lexical' }
  const counts = Object.entries(vocab).map(([language, regex]) => [language as NovaLanguage, value.match(regex)?.length ?? 0] as const).sort((a, b) => b[1] - a[1])
  // JS word boundaries are ASCII: use explicit Cyrillic boundaries for Russian.
  const ru = value.match(/(?:^|[^\p{L}])(?:это|как|почему|что|мне|меня|объясни\p{L}*|покажи|пожалуйста|понятно|нужно|давай|теперь|можно|спасибо)(?=$|[^\p{L}])/giu)?.length ?? 0
  const top = [...counts.filter(([lang]) => lang !== 'ru'), ['ru', ru] as const].sort((a, b) => b[1] - a[1])
  if (top[0][1] >= 2 && top[0][1] > top[1][1]) return { language: top[0][0], status: 'supported', basis: 'lexical' }
  if ((value.match(/\b(?:bir|şimdi|lütfen|için|nasıl|bana|anlat|değil|istiyorum|merhaba)\b/giu)?.length ?? 0) >= 2 && !counts.find(([lang, n]) => lang === 'uz' && n >= 2)) return { language: 'unknown', status: 'unsupported', basis: 'lexical', detectedCode: 'tur' }
  if (letters.length >= 80) {
    const ranks = francAll(value, { minLength: 80 })
    const code = ranks[0]?.[0], language = ({ uzn: 'uz', uzb: 'uz', rus: 'ru', eng: 'en' } as Record<string, NovaLanguage>)[code]
    // Profile distance is NOT a calibrated confidence. Short/close rankings stay ambiguous.
    if (language && (ranks[0]?.[1] ?? 0) - (ranks[1]?.[1] ?? 0) > .08) return { language, status: 'supported', basis: 'profile', detectedCode: code }
    if (!language && code !== 'und' && letters.length >= 140 && (ranks[0]?.[1] ?? 0) - (ranks[1]?.[1] ?? 0) > .15) return { language: 'unknown', status: 'unsupported', basis: 'profile', detectedCode: code }
  }
  return { language: 'unknown', status: 'ambiguous', basis: 'insufficient' }
}
export function resolveNovaLanguage(message: string, selection: NovaLanguageChoice = 'auto', lastReliable: NovaLanguage = 'uz', history: Array<{ role: string; content: string }> = []) {
  const observation = inspectLanguage(message), requested = explicitLanguageRequest(message)
  let previous = lastReliable
  if (selection === 'auto') for (const turn of history.slice(-16)) if (turn.role === 'user') { const seen = inspectLanguage(turn.content); if (seen.status === 'supported' && seen.language !== 'unknown') previous = seen.language }
  const language = requested ?? (selection !== 'auto' ? selection : observation.status === 'supported' && observation.language !== 'unknown' ? observation.language : previous)
  return { language, observation, selection: requested ?? selection }
}
export function languageViolation(text: string, expected: NovaLanguage) {
  const paragraphs = proseForLanguage(text).split(/\n\s*\n|(?<=[.!?])\s+/).filter(part => (part.match(/\p{L}/gu)?.length ?? 0) >= 12)
  return paragraphs.some(part => { const seen = inspectLanguage(part); return seen.status === 'unsupported' || seen.status === 'supported' && seen.language !== expected })
}
export function languageClarification(language: NovaLanguage) {
  return { uz: 'Oxirgi gapingiz aniq eshitilmadi yoki qo‘llab-quvvatlanmaydigan tilda chiqdi. O‘zbekcha, inglizcha yoki ruscha yana bir marta aytasizmi?', en: 'I could not reliably understand that. Please say it again in Uzbek, English or Russian.', ru: 'Не удалось надёжно разобрать фразу. Повторите, пожалуйста, на узбекском, английском или русском.' }[language]
}
export function latinUzbekTranscript(text: string) {
  if (inspectLanguage(text).language !== 'uz') return text
  const map: Record<string, string> = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'j',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'x',ц:'ts',ч:'ch',ш:'sh',щ:'sh',ъ:'’',ы:'i',ь:'',э:'e',ю:'yu',я:'ya',ў:'o‘',қ:'q',ғ:'g‘',ҳ:'h' }
  return text.replace(/[а-яёўқғҳ]/giu, char => { const value = map[char.toLowerCase()]; return value === undefined ? char : char === char.toUpperCase() ? value.charAt(0).toUpperCase() + value.slice(1) : value })
}
export function novaLanguageInstructions(language: NovaLanguage) {
  return `PRODUCT LANGUAGE POLICY: Conversation and lesson prose may use ONLY Uzbek, English or Russian. Current response language: ${languageNames[language]}. Keep it through names, short acknowledgements and quoted study examples. A Russian-derived roast word is not a switch. Do not speak Turkish, Arabic or another language; do not translate an unsupported utterance by guessing it. For unclear audio ask a short clarification in the current language. Understand Latin/Cyrillic Uzbek, apostrophe variants and Uzbek names; render Uzbek transcripts in fluent Latin script. Never relabel an incorrect transcript as Uzbek without correcting its content from actual audio. English examples, names, formulas and code may stay intact. Metadata is silent. Context and transcript language detection are fallible; do not claim certainty.`
}
