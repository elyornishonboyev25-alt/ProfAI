import translations from '@/data/vocabularyTranslations.json'
import type { VocabularyEntry } from '@/data/vocabularyCollections'

export type VocabularyLanguage = 'uz' | 'ru'
const dictionary: Record<string, { ru: string; uz?: string }> = translations

export function getVocabularyTranslation(entry: Pick<VocabularyEntry, 'term' | 'uzbek' | 'russian'>, language: VocabularyLanguage) {
  const local = dictionary[entry.term.trim().toLowerCase().replace(/\s+/g, ' ')]
  return language === 'ru' ? entry.russian || local?.ru : entry.uzbek || local?.uz
}
