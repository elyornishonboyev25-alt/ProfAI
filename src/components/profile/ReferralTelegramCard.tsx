import { useCallback, useEffect, useState } from 'react'
import { Check, Copy, Gift, Loader2, Send, Unplug } from 'lucide-react'
import UiText from '@/components/common/UiText'
import { apiClient } from '@/lib/apiClient'

type ReferralSummary = {
  code: string | null
  link: string | null
  invited: number
  qualified: number
  pending: number
  earnedDays: number
  inviteeBonusDays: number
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

  return (
    <section id="referral" className="account-profile-card mt-6 scroll-mt-24 surface-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-slate-900">
          <Gift className="h-5 w-5 text-red-600" />
          <UiText text={"Invite friends, earn free premium"} />
        </h2>
        {referral && <span className="soft-chip">{referral.qualified} / {referral.invited} <UiText text={"friends counted"} /></span>}
      </div>

      {failed && !referral && (
        <p className="mt-4 text-sm text-slate-600"><UiText text={"Invitation details could not be loaded. Refresh to try again."} /></p>
      )}
      {!referral && !failed && <Loader2 className="mt-4 h-5 w-5 animate-spin text-slate-400" />}

      {referral && (
        <div className="mt-4 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm leading-6 text-slate-600">
              <UiText text={"Share your link. Your friend gets bonus premium days when they sign up, and you earn more days each time a friend finishes their first test or practice."} />
            </p>
            <div className="mt-3 flex items-center gap-2">
              <input readOnly value={referral.link ?? ''} aria-label="Invitation link" onFocus={(event) => event.currentTarget.select()}
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700" />
              <button type="button" onClick={() => void copy()}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-black text-white">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <UiText text={copied ? 'Copied' : 'Copy'} />
              </button>
            </div>
            <ul className="mt-4 grid gap-2">
              {referral.tiers.map((tier) => (
                <li key={tier.count} className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm ${tier.reached ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-700'}`}>
                  <span>{tier.count} <UiText text={tier.count === 1 ? 'friend' : 'friends'} /></span>
                  <span className="font-black">+{tier.days} <UiText text={"days"} /> {tier.reached && '✓'}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-slate-500">
              {referral.next
                ? <>{referral.next.remaining} <UiText text={"more friend(s) until your next reward."} /></>
                : <UiText text={"You have earned every reward. Thank you!"} />}
              {' '}<UiText text={"Total earned"} />: {referral.earnedDays} <UiText text={"days"} />
            </p>
          </div>

          <div className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-5">
            <p className="inline-flex items-center gap-2 text-sm font-black text-sky-800"><Send className="h-4 w-4" /> Telegram</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              <UiText text={"Connect the bot for a daily word, streak reminders and reward alerts."} />
            </p>
            {telegram?.enabled === false ? (
              <p className="mt-3 text-xs text-slate-500"><UiText text={"The Telegram bot is coming soon."} /></p>
            ) : telegram?.linked ? (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700"><Check className="h-4 w-4" /> <UiText text={"Connected"} />{telegram.link?.username ? ` · @${telegram.link.username}` : ''}</span>
                <button type="button" disabled={busy} onClick={() => void disconnect()}
                  className="inline-flex min-h-9 items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 disabled:opacity-60">
                  <Unplug className="h-4 w-4" /> <UiText text={"Disconnect"} />
                </button>
              </div>
            ) : (
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button type="button" disabled={busy || !telegram} onClick={() => void connect()}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-sky-600 px-4 text-xs font-black text-white disabled:opacity-60">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} <UiText text={"Connect Telegram"} />
                </button>
                <button type="button" onClick={() => void load()} className="text-xs font-bold text-slate-500 underline">
                  <UiText text={"I connected it"} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
