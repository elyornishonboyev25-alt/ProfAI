import type { Location } from 'react-router-dom'
import { fullMockLaunchState, getFullMockById } from './ieltsMockCatalog'

/** History state can disappear on a restored tab or a copied/reloaded URL. */
export function resolveFullMockRouteState(location: Pick<Location, 'pathname' | 'search' | 'state'>) {
  const state = location.state as Record<string, unknown> | null
  if (state?.reviewPayload || state?.mock) return state
  const mockId = new URLSearchParams(location.search).get('mock')
  if (!mockId) return state
  const mock = getFullMockById(mockId)
  const section = mock?.sections.find(item => item.launchPath === location.pathname)
  return section ? { ...state, ...fullMockLaunchState(mockId, section.key) } : state
}
