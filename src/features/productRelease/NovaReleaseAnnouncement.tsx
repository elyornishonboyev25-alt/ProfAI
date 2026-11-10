import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowUpRight, X } from 'lucide-react'
import CoachMascot from '@/components/ai/CoachMascot'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import { novaReleaseCopy } from './copy'
import './nova-release.css'

const RELEASE_ID = 'nova-studio-2026-11'
const receipts = new Map<string, 'pending' | 'saved'>()
const receiptKey = (owner: string) => `ivygoo:${RELEASE_ID}:${owner}:shown`
function readReceipt(owner: string) {
  try {
    const saved = localStorage.getItem(receiptKey(owner))
    if (saved === 'pending' || saved === 'saved') return saved
  } catch { /* The account receipt remains authoritative when storage is unavailable. */ }
  return receipts.get(owner)
}
function remember(owner: string, status: 'pending' | 'saved') {
  receipts.set(owner, status)
  try { localStorage.setItem(receiptKey(owner), status) } catch { /* In-memory suppression still works. */ }
}
async function saveReceipt(owner: string) {
  try {
    const result = await apiClient.post<{ recorded: boolean }>('/releases/nova-studio/shown', undefined, { expectedUserId: owner })
    if (result.recorded) remember(owner, 'saved')
  } catch { /* Retry a pending receipt on the next visit or when the connection returns. */ }
}

function occupied() {
  return document.hidden || document.activeElement?.matches('input, textarea, select, [contenteditable="true"]') ||
    [...document.querySelectorAll<HTMLElement>('[role="dialog"], [role="alertdialog"], dialog[open]')].some(node => node.getClientRects().length > 0)
}

/** An account-scoped, once-only invitation; server registration dates define the audience. */
export default function NovaReleaseAnnouncement({ enabled }: { enabled: boolean }) {
  const owner = useAuthStore(state => state.user?.id)
  const hydrated = useAuthStore(state => state.hydrated)
  const authenticated = useAuthStore(state => Boolean(state.accessToken))
  const talkOpen = useAiAssistantStore(state => state.talkOpen)
  const isSending = useAiAssistantStore(state => state.isSending)
  const isExamModeActive = useAiAssistantStore(state => state.isExamModeActive)
  const [openOwner, setOpenOwner] = useState<string | null>(null)
  const allowed = enabled && hydrated && authenticated && !talkOpen && !isSending && !isExamModeActive
  const close = useCallback(() => setOpenOwner(null), [])

  useEffect(() => {
    setOpenOwner(null)
    if (!allowed || !owner) return
    let cancelled = false
    let timer = 0
    const controller = new AbortController()
    const retryReceipt = () => { if (readReceipt(owner) === 'pending') void saveReceipt(owner) }
    window.addEventListener('online', retryReceipt)
    const check = async () => {
      const receipt = readReceipt(owner)
      if (receipt) { if (receipt === 'pending') void saveReceipt(owner); return }
      try {
        const release = await apiClient.get<{ releaseId: string; eligible: boolean }>('/releases/nova-studio', { signal: controller.signal, expectedUserId: owner })
        if (cancelled || !release.eligible || release.releaseId !== RELEASE_ID) return
        const showWhenClear = () => {
          if (cancelled || readReceipt(owner) || useAuthStore.getState().user?.id !== owner) return
          if (document.readyState !== 'complete' || occupied()) { timer = window.setTimeout(showWhenClear, 650); return }
          setOpenOwner(owner)
        }
        timer = window.setTimeout(showWhenClear, 1800)
      } catch { /* A failed audience check never displays a guest or new-account announcement. */ }
    }
    void check()
    return () => { cancelled = true; controller.abort(); window.clearTimeout(timer); window.removeEventListener('online', retryReceipt) }
  }, [allowed, owner])

  // Only a committed dialog counts as shown, so interrupted navigation never
  // consumes an invitation that the learner has not actually seen.
  const visible = allowed && Boolean(owner) && openOwner === owner
  useEffect(() => {
    if (!visible || !owner || document.hidden) return
    remember(owner, 'pending')
    void saveReceipt(owner)
  }, [visible, owner])

  if (!visible) return null
  return <NovaReleaseDialog onClose={close} />
}

export function NovaReleaseDialog({ onClose }: { onClose: () => void }) {
  const { i18n } = useTranslation()
  const text = novaReleaseCopy(i18n.resolvedLanguage ?? i18n.language ?? 'en')
  const navigate = useNavigate()
  const dialog = useRef<HTMLElement>(null)
  const primary = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const root = document.documentElement
    const overflow = root.style.overflow
    const padding = root.style.paddingRight
    const gutter = window.innerWidth - root.clientWidth
    root.style.overflow = 'hidden'
    if (gutter > 0) root.style.paddingRight = `${gutter}px`
    primary.current?.focus({ preventScroll: true })
    const keys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onClose(); return }
      if (event.key !== 'Tab') return
      const nodes = dialog.current?.querySelectorAll<HTMLButtonElement>('button')
      if (!nodes?.length) return
      const first = nodes[0], last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', keys)
    return () => {
      root.style.overflow = overflow
      root.style.paddingRight = padding
      document.removeEventListener('keydown', keys)
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [onClose])

  return createPortal(
    <div className="nova-release-overlay" data-lenis-prevent onClick={event => { if (event.target === event.currentTarget) onClose() }}>
      <section ref={dialog} className="nova-release-card" role="dialog" aria-modal="true" aria-labelledby="nova-release-sentence">
        <button type="button" className="nova-release-close" aria-label={text.close} onClick={onClose}><X size={18} /></button>
        <div className="nova-release-art" role="img" aria-label={text.illustration}>
          <span className="nova-release-orbit" aria-hidden="true" />
          <span className="nova-release-orbit nova-release-orbit--inner" aria-hidden="true" />
          <span className="nova-release-spark nova-release-spark--one" aria-hidden="true">✦</span>
          <span className="nova-release-spark nova-release-spark--two" aria-hidden="true">✦</span>
          <span className="nova-release-note" aria-hidden="true"><i /><i /><i /><span>✓</span></span>
          <CoachMascot size={226} expression="delighted" />
        </div>
        <h2 id="nova-release-sentence">{text.sentence}</h2>
        <button ref={primary} type="button" className="nova-release-action" onClick={() => { onClose(); navigate('/ai-tutor') }}>
          {text.action}<ArrowUpRight size={18} aria-hidden="true" />
        </button>
      </section>
    </div>, document.body,
  )
}
