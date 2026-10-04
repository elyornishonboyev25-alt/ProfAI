import satVocabularyPacks from './satVocabulary.generated.json'
import { ieltsFullTestVocabulary } from './ieltsFullTestVocabulary'

export type VocabularyTrack = 'IELTS' | 'SAT'

export type VocabularyEntry = {
  id: string
  term: string
  uzbek?: string
  definition: string
  example: string
  exampleUzbek?: string
  synonym: string
  sourceQuestionId?: string
  sourceSectionId?: string
  sourceTitle?: string
  sourceExcerpt?: string
  sourceKind?: 'text' | 'topic'
}

export type VocabularySection = {
  id: string
  title: string
  topic?: string
  prompt?: string
  entries: VocabularyEntry[]
}

export type IeltsTest = {
  id: string
  title: string
  sections: VocabularySection[]
  sourceTestId?: string
  available?: boolean
}

export type IeltsBook = {
  skill: 'listening' | 'reading' | 'writing' | 'speaking'
  id: string
  title: string
  tests: IeltsTest[]
}

export type SatPack = {
  id: string
  title: string
  sections: VocabularySection[]
}

export type VocabularyCollections = {
  ielts: IeltsBook[]
  sat: SatPack[]
}

export const vocabularyCollections: VocabularyCollections = {
  ielts: ieltsFullTestVocabulary,
  sat: satVocabularyPacks,
}
