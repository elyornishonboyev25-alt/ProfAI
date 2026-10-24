import type { IELTSTest, TestResult } from '@/types/ieltsTypes'
import { accountStorageFor } from './accountStorage'

const cached = new WeakMap<IELTSTest, { key: string; json: string }>()

/** One immutable copy per paper version, shared by every attempt and retake. */
export function storeIeltsPaperSnapshot(paper: IELTSTest, owner?: string): string {
  let entry = cached.get(paper)
  if (!entry) {
    const json = JSON.stringify(paper)
    let hash = 2166136261, second = 5381
    for (let index = 0; index < json.length; index++) {
      const code = json.charCodeAt(index)
      hash = Math.imul(hash ^ code, 16777619)
      second = Math.imul(second, 33) ^ code
    }
    entry = { key: `ielts:paper:v1:${paper.id}:${(hash >>> 0).toString(36)}:${(second >>> 0).toString(36)}:${json.length}`, json }
    cached.set(paper, entry)
  }
  accountStorageFor(owner).setItem(entry.key, entry.json)
  return entry.key
}

export function readIeltsPaperSnapshot(key: string | undefined, testId: string, owner?: string): IELTSTest | null {
  if (!key?.startsWith('ielts:paper:v1:')) return null
  try {
    const paper = JSON.parse(accountStorageFor(owner).getItem(key) ?? 'null')
    return paper?.id === testId && Array.isArray(paper.sections) && paper.sections.length ? paper : null
  } catch { return null }
}

export function compactIeltsResult(result: TestResult, paper?: IELTSTest, owner?: string): TestResult {
  const snapshot = paper ?? result.detailedBreakdown?.paperSnapshot
  const paperSnapshotKey = snapshot ? storeIeltsPaperSnapshot(snapshot, owner) : result.detailedBreakdown?.paperSnapshotKey
  return { ...result, detailedBreakdown: {
    activeSectionIds: result.detailedBreakdown?.activeSectionIds ?? [], paperSnapshotKey,
  } }
}
