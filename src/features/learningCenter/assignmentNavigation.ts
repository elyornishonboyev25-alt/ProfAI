import { learningCenterApi } from './api'

export function assignmentDestination(route: string, assignmentId?: string) {
  if (!route.startsWith('/') || route.startsWith('//') || route.includes('\\')) {
    throw new Error('This assignment needs a valid ProfAI destination. Please contact your teacher.')
  }
  const destination = new URL(route, window.location.origin)
  if (destination.origin !== window.location.origin) throw new Error('Please use a local ProfAI destination.')
  if (assignmentId) destination.searchParams.set('assignmentId', assignmentId)
  return destination.pathname + destination.search + destination.hash
}

export async function startAssignment(slug: string, assignment: {
  id: string; assignmentId: string; routePath: string; status: string; progress: number
}) {
  const destination = assignmentDestination(assignment.routePath, assignment.assignmentId)
  if (['ASSIGNED', 'OVERDUE'].includes(assignment.status)) {
    await learningCenterApi.updateSubmission(slug, assignment.id, {
      status: 'IN_PROGRESS', progress: Math.max(10, assignment.progress),
    })
  }
  return destination
}
