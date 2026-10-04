/** Ignore typography, case and spacing, while still checking actual spelling. */
export function normalizeVocabularyAnswer(text: string) {
  return text.normalize('NFKC').toLowerCase().trim()
    .replace(/[‘’ʻʼ`]/g, "'")
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/\s+/g, ' ')
}

/** Personal sets may repeat meanings; each quiz option must remain distinct. */
export function uniqueWrongDefinitions(definitions: string[], answer: string) {
  const seen = new Set([normalizeVocabularyAnswer(answer)])
  return definitions.filter((definition) => {
    const key = normalizeVocabularyAnswer(definition)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}
