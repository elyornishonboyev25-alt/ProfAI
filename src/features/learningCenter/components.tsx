import { useEffect, useId, useRef, useState, type ComponentType, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Check, Copy, Minus, Sparkles, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/components/ui/utils'
import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import type { StudentStatus } from './types'

export function CenterPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn(
      'lc-panel relative overflow-hidden rounded-[1.75rem] border border-white/90 bg-white/90 shadow-sm',
      className,
    )}>
      {children}
    </section>
  )
}

export function CenterPageHeading({ eyebrow, title, description, action }: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="lc-page-heading flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="text-[10px] font-bold uppercase tracking-[.22em] text-blue-600">{eyebrow}</p> : null}
        <h1 className="mt-1 text-3xl font-black tracking-[-.055em] text-slate-950 sm:text-[2.35rem]">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-slate-500">{description}</p> : null}
      </div>
      {action}
    </div>
  )
}

export function MetricCard({ label, value, note, icon: Icon, accent = 'blue', trend }: {
  label: string
  value: string | number
  note: string
  icon: ComponentType<{ className?: string }>
  accent?: 'blue' | 'red' | 'emerald' | 'violet'
  trend?: number
}) {
  const styles = {
    blue: 'from-blue-600 to-indigo-600 shadow-blue-500/20',
    red: 'from-red-500 to-rose-600 shadow-red-500/20',
    emerald: 'from-emerald-500 to-teal-600 shadow-emerald-500/20',
    violet: 'from-violet-500 to-indigo-600 shadow-violet-500/20',
  }
  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('lc-metric-card group relative overflow-hidden rounded-[1.75rem] border border-white/90 bg-white/90 p-5 shadow-[0_16px_44px_rgba(15,23,42,.07)]', `lc-metric-${accent}`)}
    >
      <div className="absolute -right-7 -top-7 h-24 w-24 rounded-full bg-blue-50 transition-transform duration-500 group-hover:scale-125" />
      <div className="relative flex items-start justify-between gap-3">
        <span className={cn('grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg', styles[accent])}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        {typeof trend === 'number' ? <Trend value={trend} compact /> : null}
      </div>
      <p className="relative mt-4 text-[11px] font-bold uppercase tracking-[.12em] text-slate-400">{label}</p>
      <p className="relative mt-1 text-[1.75rem] font-bold tracking-[-.04em] text-slate-950">{value}</p>
      <p className="relative mt-1 text-[11px] font-semibold text-slate-500">{note}</p>
    </motion.article>
  )
}

export function Trend({ value, compact = false }: { value: number; compact?: boolean }) {
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full font-bold',
      compact ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1.5 text-xs',
      value > 0 ? 'bg-emerald-50 text-emerald-700' : value < 0 ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-500',
    )}>
      <Icon className="h-3.5 w-3.5" /> {value > 0 ? '+' : ''}{value.toFixed(1)}%
    </span>
  )
}

export function StatusBadge({ status }: { status: StudentStatus }) {
  const meta = {
    ON_TRACK: { label: 'On track', className: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    WATCH: { label: 'Watch', className: 'border-amber-200 bg-amber-50 text-amber-700' },
    NEEDS_ATTENTION: { label: 'Needs attention', className: 'border-red-200 bg-red-50 text-red-700' },
  }[status]
  return <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.08em]', meta.className)}>{meta.label}</span>
}

export function Avatar({ name, url, size = 'md' }: { name: string; url?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'h-14 w-14 text-base' : size === 'sm' ? 'h-8 w-8 text-[10px]' : 'h-10 w-10 text-xs'
  return (
    <span className={cn('grid shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 font-bold text-blue-700 ring-1 ring-blue-100', sizeClass)}>
      <ProfileAvatar src={url} alt={name} />
    </span>
  )
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="grid min-h-56 place-items-center px-5 py-10 text-center">
      <div>
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600"><Sparkles className="h-6 w-6" /></span>
        <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <CenterPanel className="p-6">
      <div className="flex items-center gap-3 text-red-700"><AlertTriangle className="h-5 w-5" /><p className="text-sm font-bold">{message}</p></div>
      <button type="button" onClick={onRetry} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-xs font-bold text-white">Try again</button>
    </CenterPanel>
  )
}

export function CenterSkeleton({ blocks = 6 }: { blocks?: number }) {
  return (
    <div className="grid animate-pulse gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: blocks }, (_, index) => <div key={index} className="h-36 rounded-[1.5rem] border border-white bg-white/60" />)}
    </div>
  )
}

export function Modal({ open, title, description, onClose, children, busy = false }: {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  busy?: boolean
}) {
  const titleId = useId()
  const descriptionId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  const busyRef = useRef(busy)
  closeRef.current = onClose
  busyRef.current = busy
  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusable = () => Array.from(panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]') ?? [])
    const firstInput = panelRef.current?.querySelector<HTMLElement>('input, select, textarea')
    ;(firstInput ?? focusable()[0] ?? panelRef.current)?.focus()
    function keydown(event: KeyboardEvent) {
      if (event.key === 'Escape') { event.preventDefault(); if (!busyRef.current) closeRef.current() }
      if (event.key !== 'Tab') return
      const elements = focusable()
      const first = elements[0]
      const last = elements[elements.length - 1]
      if (!first) { event.preventDefault(); panelRef.current?.focus(); return }
      if (event.shiftKey && (document.activeElement === first || !panelRef.current?.contains(document.activeElement))) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && (document.activeElement === last || !panelRef.current?.contains(document.activeElement))) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', keydown)
    return () => { document.removeEventListener('keydown', keydown); document.body.style.overflow = previousOverflow; previousFocus?.focus() }
  }, [open])
  if (!open) return null
  return createPortal(
    <div className="learning-center fixed inset-0 z-[140] grid place-items-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm" onMouseDown={() => { if (!busy) onClose() }}>
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        aria-busy={busy}
        tabIndex={-1}
        initial={{ opacity: 0, y: 18, scale: .97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        onMouseDown={(event) => event.stopPropagation()}
        className="my-auto w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_35px_90px_rgba(15,23,42,.35)]"
      >
        <div className="h-1 bg-blue-600" />
        <div className="p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div><h2 id={titleId} className="text-2xl font-bold tracking-tight text-slate-950">{title}</h2>{description ? <p id={descriptionId} className="mt-2 text-sm leading-6 text-slate-500">{description}</p> : null}</div>
            <button type="button" disabled={busy} aria-label="Close dialog" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 disabled:opacity-50"><X className="h-4 w-4" /></button>
          </div>
          <div className="mt-6">{children}</div>
        </div>
      </motion.div>
    </div>, document.body,
  )
}

export function InvitationLink({ link }: { link: string }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'manual'>('idle')
  const inputRef = useRef<HTMLInputElement>(null)
  async function copy() {
    try { await navigator.clipboard.writeText(link); setStatus('copied') }
    catch { setStatus('manual'); inputRef.current?.focus(); inputRef.current?.select() }
  }
  return <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><p className="text-sm font-bold text-emerald-900">Invitation ready</p><p className="mt-1 text-xs leading-5 text-emerald-800">Share this link with your invitee. It expires in seven days.</p><label className="mt-4 block"><span className="sr-only">Invitation link</span><input ref={inputRef} readOnly value={link} onFocus={(event) => event.target.select()} className={inputClass} /></label><button type="button" onClick={() => void copy()} className={`${secondaryButton} mt-3`}>{status === 'copied' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}{status === 'copied' ? 'Copied!' : 'Copy invitation link'}</button><p role="status" className="mt-2 text-xs text-emerald-800">{status === 'manual' ? 'Copy is unavailable in this browser. Select and copy the link above.' : status === 'copied' ? 'Link copied. You can now share it.' : ''}</p></div>
}

export const inputClass = 'h-11 w-full rounded-xl border border-slate-200 bg-white/90 px-3.5 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100'
export const primaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-700 to-red-600 px-4 text-sm font-bold text-white shadow-[0_10px_22px_rgba(185,28,28,.19)] transition hover:from-red-800 hover:to-red-700 hover:shadow-[0_14px_28px_rgba(185,28,28,.25)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:cursor-wait disabled:opacity-60'
export const secondaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/85 px-4 text-sm font-semibold text-slate-700 shadow-[0_4px_16px_rgba(30,64,175,.04)] transition hover:border-red-200 hover:bg-white hover:text-red-700 disabled:cursor-wait disabled:opacity-60'
