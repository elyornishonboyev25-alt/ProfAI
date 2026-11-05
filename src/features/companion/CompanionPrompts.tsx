import UiText from '@/components/common/UiText'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, BookOpen, Check, Download, Flame, Loader2, MonitorSmartphone, Send, Share2, X } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { telegramLaunch } from '@/lib/telegramWebApp'
import { useAuthStore } from '@/store/authStore'
import { companionCopy } from './copy'
import { hasInstallPrompt, installationPlatform, isInstalledApp, takeInstallPrompt } from './installRuntime'
import { nextCompanionOffer, readCompanionState, updateCompanionState } from './promotionState'
import './companion.css'

type Offer = 'install' | 'telegram'
type Stage = 'intro' | 'guide' | 'requested' | 'installed'
type TelegramStatus = { enabled: boolean; linked: boolean }

function anotherDialogIsOpen() {
  return [...document.querySelectorAll<HTMLElement>('[role="dialog"], [role="alertdialog"], dialog[open]')]
    .some(node => node.getClientRects().length > 0)
}
function editing() { return document.activeElement?.matches('input, textarea, select, [contenteditable="true"]') }

export default function CompanionPrompts({ enabled }: { enabled: boolean }) {
  const { i18n } = useTranslation()
  const text = companionCopy(i18n.resolvedLanguage ?? i18n.language ?? 'en')
  const hydrated = useAuthStore(state => state.hydrated)
  const owner = useAuthStore(state => state.user?.id)
  const [offer, setOffer] = useState<Offer | null>(null)
  const [stage, setStage] = useState<Stage>('intro')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [, redraw] = useState(0)
  const open = useRef<Offer | null>(null)
  const dialog = useRef<HTMLElement>(null)
  const primary = useRef<HTMLButtonElement>(null)
  const close = () => { open.current = null; setOffer(null) }

  useEffect(() => {
    close()
    if (!enabled || !hydrated || telegramLaunch) return
    let cancelled = false
    let checking = false
    let alreadyLinked = false
    let lastCheck = 0
    const eligibleAt = Date.now() + 5000
    if (!readCompanionState().firstSeenAt) updateCompanionState({ firstSeenAt: Date.now() })
    const check = () => {
      if (cancelled || open.current || Date.now() < eligibleAt || document.hidden || anotherDialogIsOpen() || editing()) return
      const state = readCompanionState()
      const next = nextCompanionOffer(state, Date.now(), owner, isInstalledApp())
      if (next === 'install') {
        // Persist the actual display time, so reload never restarts the 48 hours.
        updateCompanionState({ installShownAt: Date.now() })
        open.current = 'install'; setStage('intro'); setOffer('install')
      } else if (next === 'telegram' && owner && !alreadyLinked && !checking && (!lastCheck || Date.now() - lastCheck >= 60_000)) {
        checking = true; lastCheck = Date.now()
        void apiClient.get<TelegramStatus>('/telegram/status').then(status => {
          if (status.linked) alreadyLinked = true
          if (cancelled || useAuthStore.getState().user?.id !== owner || !status.enabled || status.linked
            || document.hidden || anotherDialogIsOpen() || editing()) return
          const latest = readCompanionState()
          updateCompanionState({ telegramShown: { ...latest.telegramShown, [owner]: Date.now() } })
          open.current = 'telegram'; setBusy(false); setFailed(false); setOffer('telegram')
        }).catch(() => { /* Retry later; never advertise a bot we could not check. */ }).finally(() => { checking = false })
      }
    }
    const timer = window.setInterval(check, 1000)
    window.addEventListener('focus', check)
    window.addEventListener('storage', check)
    document.addEventListener('visibilitychange', check)
    return () => {
      cancelled = true
      window.clearInterval(timer)
      window.removeEventListener('focus', check)
      window.removeEventListener('storage', check)
      document.removeEventListener('visibilitychange', check)
    }
  }, [enabled, hydrated, owner])

  useEffect(() => {
    const changed = () => {
      redraw(value => value + 1)
      if (open.current === 'install' && readCompanionState().installed) setStage('installed')
    }
    window.addEventListener('ivygoo:install-state', changed)
    return () => window.removeEventListener('ivygoo:install-state', changed)
  }, [])

  useEffect(() => {
    if (!offer) return
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    primary.current?.focus({ preventScroll: true })
    const keys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close() }
      if (event.key !== 'Tab') return
      const nodes = dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]')
      if (!nodes?.length) return
      const first = nodes[0], last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', keys)
    return () => {
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', keys)
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [offer])

  const install = async () => {
    const prompt = takeInstallPrompt()
    if (!prompt) { setStage('guide'); return }
    setBusy(true)
    try {
      // Call before the first await: browsers require a direct user gesture.
      await prompt.prompt()
      const choice = await prompt.userChoice
      if (open.current === 'install') setStage(readCompanionState().installed ? 'installed' : choice.outcome === 'accepted' ? 'requested' : 'guide')
    } catch { if (open.current === 'install') setStage('guide') }
    finally { setBusy(false) }
  }
  const connect = async () => {
    if (busy) return
    setBusy(true); setFailed(false)
    try {
      const result = await apiClient.post<{ url: string }>('/telegram/link-code')
      if (open.current !== 'telegram' || useAuthStore.getState().user?.id !== owner) return
      const url = new URL(result.url)
      if (url.protocol !== 'https:' || url.hostname !== 't.me') throw new Error('Invalid bot link')
      // Same-tab navigation works on mobile and avoids asynchronous popup blocking.
      window.location.assign(url.href)
    } catch { if (open.current === 'telegram') setFailed(true) }
    finally { setBusy(false) }
  }

  if (!offer) return null
  const telegram = offer === 'telegram'
  const intro = stage === 'intro'
  const title = telegram ? text.tgTitle : intro ? text.title : stage === 'guide' ? text.guideTitle : stage === 'installed' ? text.installedTitle : text.requestedTitle
  const description = telegram ? text.tgBody : intro ? text.body : stage === 'guide' ? text.guideBody : stage === 'installed' ? text.installedBody : text.requestedBody
  return createPortal(
    <div className="companion-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) close() }}>
      <section ref={dialog} className={`companion-dialog ${telegram ? 'is-telegram' : ''}`} role="dialog" aria-modal="true" aria-labelledby="companion-title" aria-describedby="companion-description" data-companion={offer}>
        <button type="button" className="companion-close" onClick={close} aria-label={text.close}><X size={19} /></button>
        <div className="companion-preview" aria-hidden="true">
          {telegram ? <>
            <div className="companion-preview-heading"><Send size={16} /><span>Telegram</span></div>
            <div className="companion-chat">
              <div className="companion-chat-head"><img src="/ivygoo-icon-192.png?v=20261027" alt="" /><div><strong>IvyGoo</strong><small>{text.sample}</small></div><span className="companion-online" /></div>
              <div className="companion-bubble"><span className="companion-bubble-label"><BookOpen size={14} />{text.daily}</span><strong><UiText text={"consistent"} /></strong><p>{text.meaning}</p><span className="companion-bubble-rule" /><p>{text.reminder}</p></div>
              <div className="companion-chat-launch">{text.openApp}<ArrowRight size={15} /></div>
            </div>
          </> : <>
            <div className="companion-preview-heading"><MonitorSmartphone size={17} /><span>{text.home}</span></div>
            <div className="companion-home-screen">
              <div className="companion-home-caption">{text.shortcut}</div>
              <div className="companion-app-icon"><img src="/ivygoo-icon-192.png?v=20261027" alt="" /><span className="companion-icon-check"><Check size={12} strokeWidth={3} /></span></div>
              <strong className="companion-app-name">IvyGoo</strong>
              <div className="companion-session"><span>{text.workspace}</span><div><b>IELTS</b><b>SAT</b><ArrowRight size={16} /></div></div>
            </div>
          </>}
        </div>
        <div className="companion-content">
          <span className="companion-kicker">{telegram ? text.tgLabel : text.label}</span>
          <h2 id="companion-title">{title}</h2>
          <p id="companion-description" className="companion-description">{description}</p>
          {telegram ? <ul className="companion-benefits"><li><BookOpen size={18} />{text.tgWord}</li><li><Flame size={18} />{text.tgStreak}</li><li><MonitorSmartphone size={18} />{text.tgApp}</li></ul>
            : stage === 'guide' ? <ol className="companion-steps">{text[installationPlatform()].map((step, index) => <li key={step}><span>{index + 1}</span><p>{step}</p></li>)}</ol>
              : intro ? <ul className="companion-benefits"><li><Download size={18} />{text.oneTap}</li><li><BookOpen size={18} />{text.familiar}</li></ul>
                : <div className="companion-confirmation">{stage === 'installed' ? <Check size={28} /> : <Share2 size={28} />}</div>}
          {failed && <p className="companion-error" role="alert">{text.tgError}</p>}
          <div className="companion-actions">
            <button ref={primary} type="button" className="companion-primary" disabled={busy} onClick={telegram ? () => void connect() : intro ? () => void install() : close}>
              {busy ? <Loader2 size={18} className="companion-spin" /> : telegram ? <Send size={18} /> : intro ? <Download size={18} /> : <Check size={18} />}
              {telegram ? busy ? text.tgBusy : text.tgConnect : intro ? hasInstallPrompt() ? text.install : text.guideButton : text.done}
              {!busy && <ArrowRight size={17} />}
            </button>
            {(telegram || intro) && <button type="button" className="companion-later" onClick={close}>{text.later}</button>}
          </div>
          <p className="companion-footnote">{telegram ? text.tgFoot : text.free}</p>
        </div>
      </section>
    </div>, document.body,
  )
}
