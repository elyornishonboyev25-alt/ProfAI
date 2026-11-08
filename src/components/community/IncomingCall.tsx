import { useEffect, useState } from 'react'
import { Phone, PhoneOff, ShieldBan } from 'lucide-react'
import type { SpeakingCommunity } from '@/hooks/useSpeakingCommunity'
import { useCommunityCopy } from '@/i18n/community'
import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import ConfirmDialog from '@/components/common/ConfirmDialog'

export default function IncomingCall({ hub }: { hub: SpeakingCommunity }) {
  const t = useCommunityCopy()
  const [now, setNow] = useState(Date.now())
  const [confirmBlock, setConfirmBlock] = useState(false)
  const invitation = hub.invitation
  useEffect(() => {
    if (!invitation) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [invitation?.id])
  if (!invitation) return null
  const remaining = Math.max(0, Math.ceil((invitation.expiresAt - now) / 1000))
  return <>
    <section className="hub-invitation" aria-label={t('Incoming call')}>
      <div className="hub-incoming-person"><span className="hub-incoming-avatar"><ProfileAvatar src={invitation.from.avatarUrl} name={invitation.from.name} alt="" /><span><Phone size={13} /></span></span><div><b>{t('Incoming call')}</b><p>@{invitation.from.name}</p><small>{t('You can decline or let the call expire.')} <span role="timer" aria-label={t('Call time remaining')} aria-live="off">{remaining}s</span></small></div></div>
      <div className="hub-incoming-actions">
        <button type="button" className="hub-button is-primary" disabled={!hub.connected || hub.busy || !!hub.room || hub.blockBusy || remaining === 0} onClick={() => void hub.reply(true)}><Phone size={17} />{t('Accept & join')}</button>
        <button type="button" className="hub-button is-decline" disabled={hub.blockBusy} onClick={() => void hub.reply(false)}><PhoneOff size={17} />{t('Decline')}</button>
        <button type="button" className="hub-button is-block" disabled={!hub.connected || hub.blockBusy || remaining === 0} onClick={() => setConfirmBlock(true)}><ShieldBan size={16} />{t('Block caller')}</button>
      </div>
    </section>
    <ConfirmDialog open={confirmBlock} title={t('Block this caller?')} description={`@${invitation.from.name}. ${t('They will not be able to call or match with you. You can unblock them in call settings.')}`} confirmLabel={t('Block caller')} cancelLabel={t('Cancel')} destructive onClose={() => setConfirmBlock(false)} onConfirm={() => { hub.blockCaller(); setConfirmBlock(false) }} />
  </>
}
