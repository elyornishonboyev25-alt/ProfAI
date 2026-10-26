import content from './telegramIeltsPapers.json'
import type { IELTSTest } from '@/types/ieltsTypes'
import type { WritingFullTest } from './writingTestData'

export const telegramListeningTests = content.listening as IELTSTest[]
export const telegramReadingTests = content.reading as IELTSTest[]
export const telegramWritingTests = content.writing as WritingFullTest[]
