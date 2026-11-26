// Shared by the browser and tools: refusal always wins over inferred save consent.
const normalize = (text: string) => text.normalize('NFKC').replace(/[‘’ʻʼ`´]/g, "'").toLowerCase()
export function refusesVocabularySave(text: string) {
  return /\b(?:don't|do not|never|stop|cancel|disable)\b.{0,70}\b(?:sav\w*|add\w*|auto\w*)\b|\b(?:sav\w*|add\w*|auto\w*)\b.{0,70}\b(?:off|stop|cancel|disable)\b|\b(?:qo'shma\w*|saqlama\w*)\b|\b(?:avto\w*|auto\w*)\b.{0,70}\b(?:to'xtat\w*|bekor\w*|o'chir\w*)\b/.test(normalize(text))
}
export function vocabularyAutoConsent(text: string): boolean | undefined {
  if (refusesVocabularySave(text)) return false
  const value = normalize(text)
  if (/\b(?:auto\w*|avto\w*)\b.{0,70}\b(?:qo'sh\w*|saqla\w*|save|add)\b|\b(?:save|add)\b.{0,70}\bautomatically\b/.test(value)) return true
  return undefined
}
export function explicitVocabularyConsent(text: string, term: string) {
  const value = normalize(text), word = normalize(term).trim()
  if (!word || refusesVocabularySave(text)) return false
  const index = value.indexOf(word)
  const boundary = (char: string | undefined) => !char || !/[\p{L}\p{N}_]/u.test(char)
  return index >= 0 && boundary(value[index - 1]) && boundary(value[index + word.length]) && /\b(?:qo'sh\w*|saqla\w*|add|save)\b/.test(value)
}
