import { useAccountAccess } from './useAccountAccess'
import { canOpenStudyResource } from './studyResources'
export function useStudyAccessPrompt() {
  const access = useAccountAccess()
  const allowed = (resource: string) => canOpenStudyResource(resource, Boolean(access?.active))
  const open = (resource: string) => {
    if (allowed(resource)) return true
    window.dispatchEvent(new CustomEvent('profai:premium-required', { detail: 'content' }))
    return false
  }
  return { allowed, open }
}
