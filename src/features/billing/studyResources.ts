import { isFreeStudyResource } from '../../../backend/src/utils/studyAccess'
export { isFreeStudyResource, PLAN_NAMES, remainingPercent, FREE_CATALOG_SIZE } from '../../../backend/src/utils/studyAccess'

export function vocabularyResource(pathname: string, search: string): string | null {
  const params = new URLSearchParams(search)
  const ielts = pathname.match(/^\/vocabulary\/ielts\/((reading|listening|writing|speaking)_full_track)\/((?:reading|listening|writing|speaking)_full_test_(\d+))(?:\/|$)/)
  const skill = ielts?.[2] ?? params.get('skill') ?? 'listening'
  const test = ielts?.[4] ?? (pathname === '/vocabulary/ielts' ? params.get('test') : null)
  if (test && /^(reading|listening|writing|speaking)$/.test(skill)) {
    const source = skill === 'reading' ? `reading-roadmap-full-${test}` : skill === 'listening' ? `ielts-listening-${test}` : `${skill}-full-${test}`
    return `test:${skill}:${source}`
  }
  const sat = pathname.match(/^\/vocabulary\/sat\/sat_full_mock_(\d+)(?:\/|$)/)
  const pack = sat?.[1] ?? (pathname === '/vocabulary/sat' ? params.get('mock')?.match(/^sat_full_mock_(\d+)$/)?.[1] : null)
  if (pack) return `mock:sat:${pack}`
  if (/^\/vocabulary\/(ielts|sat)\/.+/.test(pathname)) return 'test:database:unknown-vocabulary'
  return null
}
export function canOpenStudyResource(resource: string, active: boolean) { return active || isFreeStudyResource(resource) }
