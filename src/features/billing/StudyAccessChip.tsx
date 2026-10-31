import { LockKeyhole, Check } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useBillingStore } from './store'
import { useBillingText } from './copy'
import { isFreeStudyResource } from './studyResources'
import './premium-experience.css'
export default function StudyAccessChip({ resource }: { resource: string }) {
  const user = useAuthStore(s => s.user)
  const { wallet, userId } = useBillingStore()
  const access = userId === user?.id ? wallet?.access ?? user?.access : user?.access
  const paid = access?.active && (!access.expiresAt || Date.parse(access.expiresAt) > Date.now())
  const free = isFreeStudyResource(resource)
  const text = useBillingText()
  return <span className={`study-access-chip ${free ? 'is-free' : ''}`}>{!free && !paid ? <LockKeyhole size={11} aria-hidden="true" /> : <Check size={11} aria-hidden="true" />}{free ? text('Free', 'Bepul', 'Бесплатно') : paid ? text('Included', 'Tarifda bor', 'Включено') : 'IvyGoo Pro'}</span>
}
