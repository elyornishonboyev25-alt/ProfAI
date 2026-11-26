import assert from 'node:assert/strict'
import { z } from 'zod'
import { apiClient } from '@/lib/apiClient'
import { learningCenterApi } from '@/features/learningCenter/api'
import type { CenterStudent } from '@/features/learningCenter/types'

// The API can still run this schema while the new web bundle is deployed.
const legacyQuery = z.object({
  search: z.string().trim().max(120).optional(),
  groupId: z.string().trim().max(191).optional(),
  exam: z.enum(['IELTS', 'SAT', 'BOTH']).optional(),
  status: z.enum(['ON_TRACK', 'WATCH', 'NEEDS_ATTENTION']).optional(),
  days: z.coerce.number().int().min(7).max(365).default(90),
})

export async function run() {
  const originalGet = apiClient.get
  const students = Array.from({ length: 83 }, (_, index) => ({ id: `student-${index}`, fullName: `Student ${index}` })) as CenterStudent[]
  const requests: URL[] = []
  let legacyRows = students
  apiClient.get = (async (path: string) => {
    const url = new URL(path, 'https://classroom.example.test')
    requests.push(url)
    const parsed = legacyQuery.safeParse(Object.fromEntries(url.searchParams))
    assert.equal(parsed.success, true, 'New directory requests must work with the deployed legacy query validator')
    return { students: legacyRows }
  }) as typeof apiClient.get
  try {
    assert.equal(legacyQuery.safeParse({ days: '0' }).success, false, 'Reproduce the query rejection shown in the screenshot')
    const first = await learningCenterApi.students('academy', { days: 0, page: 1, pageSize: 25 })
    assert.equal(requests[0].searchParams.has('days'), false, 'All-time uses the server default instead of the incompatible zero parameter')
    assert.equal(first.students.length, 25)
    assert.equal(first.students[0].id, 'student-0')
    assert.deepEqual(first.pagination, { page: 1, pageSize: 25, pages: 4, total: 83 })

    const last = await learningCenterApi.students('academy', { days: 0, page: 4, pageSize: 25, search: 'Student', exam: 'SAT', groupId: 'group-a', status: 'WATCH' })
    assert.equal(last.students.length, 8)
    assert.equal(last.students.at(-1)?.id, 'student-82', 'Every student stays reachable when the API returns an unpaged roster')
    assert.equal(requests.at(-1)?.searchParams.get('search'), 'Student')
    assert.equal(requests.at(-1)?.searchParams.get('groupId'), 'group-a')
    assert.equal(requests.at(-1)?.searchParams.get('exam'), 'SAT')
    assert.equal(requests.at(-1)?.searchParams.get('status'), 'WATCH')

    await learningCenterApi.students('academy', { days: 180 })
    assert.equal(requests.at(-1)?.searchParams.get('days'), '180', 'Explicit supported date filters remain intact')
    const unpaged = await learningCenterApi.students('academy')
    assert.equal(unpaged.students.length, 83, 'Existing unpaged callers keep the full roster')

    legacyRows = []
    const empty = await learningCenterApi.students('academy', { days: 0, page: 4, pageSize: 25 })
    assert.deepEqual(empty.students, [])
    assert.deepEqual(empty.pagination, { page: 1, pageSize: 25, pages: 1, total: 0 })

    const serverPage = { students: students.slice(25, 50), pagination: { page: 2, pageSize: 25, total: 83, pages: 4 } }
    apiClient.get = (async () => serverPage) as typeof apiClient.get
    const current = await learningCenterApi.students('academy', { days: 0, page: 2, pageSize: 25 })
    assert.equal(current, serverPage, 'Current API pages pass through without being sliced twice')
    assert.equal(current.students[0].id, 'student-25')
    console.log('PASS: classroom requests work with both API versions; zero-day validation regression, all students across pages, filters, empty classes and current server pagination.')
  } finally {
    apiClient.get = originalGet
  }
}
