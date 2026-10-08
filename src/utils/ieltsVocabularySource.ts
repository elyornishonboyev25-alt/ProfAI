/** Visible passage and question copy only: never answers, explanations or metadata. */
export function getIeltsVocabularySourceLines(value: unknown, key = ''): string[] {
  if (['id', 'audioUrl', 'imageUrl', 'type', 'kind', 'correctAnswer', 'explanation', 'partInstruction', 'instruction', 'partLabel', 'range', 'width', 'className', 'sourceUrl', 'location'].includes(key)) return []
  if (typeof value === 'string') {
    const text = value.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim()
    return text ? [text] : []
  }
  if (Array.isArray(value)) return value.flatMap((item) => getIeltsVocabularySourceLines(item, key))
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([name, item]) => getIeltsVocabularySourceLines(item, name))
  return []
}
