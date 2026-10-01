import type { IELTSTest } from '../types/ieltsTypes'
import { fullReadingTest } from '../data/fullReadingTest'
import { fullReadingTest2 } from '../data/fullReadingTest2'
import { fullReadingTest3 } from '../data/fullReadingTest3'
import { fullReadingTest4 } from '../data/fullReadingTest4'
import { fullReadingTest5 } from '../data/fullReadingTest5'
import { fullReadingTest6 } from '../data/fullReadingTest6'
import { fullReadingTest7 } from '../data/fullReadingTest7'
import { fullReadingTest8 } from '../data/fullReadingTest8'
import { fullReadingTest9 } from '../data/fullReadingTest9'
import { fullReadingTest10 } from '../data/fullReadingTest10'
import { readingFullTests23to30 } from '../data/readingFullTests23to30'
import { mockReadingTests } from '../data/ieltsReadingPassages'
import { mockListeningTests } from '../data/listeningPassages'
import { resolveGeneratedTestById } from './generatedIeltsTests'

const CATALOG: IELTSTest[] = [
  fullReadingTest,
  fullReadingTest2,
  fullReadingTest3,
  fullReadingTest4,
  fullReadingTest5,
  fullReadingTest6,
  fullReadingTest7,
  fullReadingTest8,
  fullReadingTest9,
  fullReadingTest10,
  ...readingFullTests23to30,
  ...mockReadingTests,
  ...mockListeningTests,
]

export function resolveIeltsTestById(testId: string): IELTSTest | null {
  if (!testId) return null
  const normalized = testId.trim()
  const known = CATALOG.find((test) => test.id === normalized)
  if (known) return known
  return resolveGeneratedTestById(normalized)
}

export function listKnownIeltsTests(): IELTSTest[] {
  return CATALOG
}


