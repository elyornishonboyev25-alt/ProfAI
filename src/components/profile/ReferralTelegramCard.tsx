import { useCallback, useEffect, useState } from 'react'
import { Check, Copy, Gift, Loader2, Send, Unplug, Users } from 'lucide-react'
import UiText from '@/components/common/UiText'
import { apiClient } from '@/lib/apiClient'
import '@/styles/referral-card.css'

type ReferralSummary = {
  code: string | null
  link: string | null
  invited: number
  qualified: number
  pending: number
  earnedDays: number
  inviteeBonusDays: number
  friendDays?: number
  next: { count: number; days: number; remaining: number } | null
  tiers: Array<{ count: number; days: number; reached: boolean }>
}

type TelegramStatus = {
  enabled: boolean
  botUsername: string
  linked: boolean
  link: { username: string | null } | null
}

export default function ReferralTelegramCard() {
  const [referral, setReferral] = useState<ReferralSummary | null>(null)
  const [telegram, setTelegram] = useState<TelegramStatus | null>(null)
  const [copied, setCopied] = useState(false)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)

  const load = useCallback(async () => {
    try {
      const [summary, status] = await Promise.all([
        apiClient.get<ReferralSummary>('/referrals/me'),
        apiClient.get<TelegramStatus>('/telegram/status'),
      ])
      setReferral(summary)
      setTelegram(status)
      setFailed(false)
    } catch {
      setFailed(true)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const copy = async () => {
    if (!referral?.link) return
    try {
      await navigator.clipboard.writeText(referral.link)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard access can be denied; the link stays visible for manual copy.
    }
  }

  const connect = async () => {
    setBusy(true)
    try {
      const result = await apiClient.post<{ url: string }>('/telegram/link-code')
      window.open(result.url, '_blank', 'noopener')
    } finally {
      setBusy(false)
    }
  }

  const disconnect = async () => {
    setBusy(true)
    try {
      await apiClient.delete('/telegram/link')
      await load()
    } finally {
      setBusy(false)
    }
  }

  const progress = referral?.next ? Math.min(100, Math.round((referral.qualified / referral.next.count) * 100)) : 100

  return (
    <section id="referral" className="rc scroll-mt-24">
      <header className="rc-head">
        <span className="rc-badge"><Gift size={20} /></span>
        <div>
          <p className="rc-eyebrow"><UiText text={"INVITE & EARN"} /></p>
          <h2><UiText text={"Invite friends, earn free premium"} /></h2>
        </div>
        {referral && <span className="rc-chip"><Users size={14} />{referral.qualified}/{referral.invited} <UiText text={"friends counted"} /></span>}
      </header>

      {failed && !referral && <p className="rc-muted"><UiText text={"Invitation details could not be loaded. Refresh to try again."} /></p>}
      {!referral && !failed && <Loader2 className="rc-spin" size={20} />}

      {referral && (
        <div className="rc-grid">
          <div className="rc-main">
            <p className="rc-muted">
              <UiText text="Share your link. Your friend gets {{inviteeDays}} bonus days. You get +{{friendDays}} Premium days for every friend who signs up, starts our Telegram bot and joins the @IvyGoo channel — on top of your plan." values={{ inviteeDays: referral.inviteeBonusDays, friendDays: referral.friendDays ?? 3 }} />
            </p>
            <div className="rc-link">
              <input readOnly value={referral.link ?? ''} aria-label="Invitation link" onFocus={(event) => event.currentTarget.select()} />
              <button type="button" className="rc-primary" onClick={() => void copy()}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                <UiText text={copied ? 'Copied' : 'Copy'} />
              </button>
            </div>

            <div className="rc-progress" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${progress}%` }} />
            </div>
            <p className="rc-progress-note">
              {referral.next
                ? <>{referral.next.remaining} <UiText text={"more friend(s) until your next bonus."} /></>
                : <UiText text={"You have earned every reward. Thank you!"} />}
              {' '}<b>{referral.earnedDays}</b> <UiText text={"days"} /> <UiText text={"earned"} />
            </p>

            <ul className="rc-tiers">
              {referral.tiers.map((tier) => (
                <li key={tier.count} className={tier.reached ? 'is-reached' : ''}>
                  <span>{tier.count} <UiText text={'friends'} /> · <UiText text={'bonus'} /></span>
                  <b>+{tier.days} <UiText text={"days"} />{tier.reached && <Check size={14} />}</b>
                </li>
              ))}
            </ul>
          </div>

          <aside className="rc-telegram">
            <p className="rc-tg-title"><Send size={16} /> Telegram</p>
            <p className="rc-muted">
              <UiText text={"Connect the bot for a daily word, streak reminders and reward alerts."} />
            </p>
            {telegram?.enabled === false ? (
              <p className="rc-muted"><UiText text={"The Telegram bot is coming soon."} /></p>
            ) : telegram?.linked ? (
              <div className="rc-tg-actions">
                <span className="rc-connected"><Check size={15} /> <UiText text={"Connected"} />{telegram.link?.username ? ` · @${telegram.link.username}` : ''}</span>
                <button type="button" className="rc-secondary" disabled={busy} onClick={() => void disconnect()}>
                  <Unplug size={15} /> <UiText text={"Disconnect"} />
                </button>
              </div>
            ) : (
              <div className="rc-tg-actions">
                <button type="button" className="rc-primary" disabled={busy || !telegram} onClick={() => void connect()}>
                  {busy ? <Loader2 size={16} className="rc-spin" /> : <Send size={16} />} <UiText text={"Connect Telegram"} />
                </button>
                <button type="button" className="rc-link-button" onClick={() => void load()}>
                  <UiText text={"I connected it"} />
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </section>
  )
}
