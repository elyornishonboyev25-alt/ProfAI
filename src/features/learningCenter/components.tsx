import { type ComponentType, type ReactNode } from 'react'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Minus, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/components/ui/utils'
import type { StudentStatus } from './types'

export function CenterPanel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn(
      'relative overflow-hidden rounded-[1.6rem] border border-white/80 bg-white/90 shadow-[0_18px_55px_rgba(15,23,42,.07)] backdrop-blur-xl',
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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="text-[10px] font-black uppercase tracking-[.22em] text-blue-600">{eyebrow}</p> : null}
        <h1 className="mt-1 text-3xl font-black tracking-[-.045em] text-slate-950 sm:text-[2.35rem]">{title}</h1>
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
      className="group relative overflow-hidden rounded-[1.45rem] border border-white/80 bg-white/90 p-4 shadow-[0_16px_44px_rgba(15,23,42,.07)]"
    >
      <div className="absolute -right-7 -top-7 h-24 w-24 rounded-full bg-blue-50 transition-transform duration-500 group-hover:scale-125" />
      <div className="relative flex items-start justify-between gap-3">
        <span className={cn('grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br text-white shadow-lg', styles[accent])}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        {typeof trend === 'number' ? <Trend value={trend} compact /> : null}
      </div>
      <p className="relative mt-4 text-[11px] font-black uppercase tracking-[.12em] text-slate-400">{label}</p>
      <p className="relative mt-1 text-[1.75rem] font-black tracking-[-.04em] text-slate-950">{value}</p>
      <p className="relative mt-1 text-[11px] font-semibold text-slate-500">{note}</p>
    </motion.article>
  )
}

export function Trend({ value, compact = false }: { value: number; compact?: boolean }) {
  const Icon = value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full font-black',
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
  return <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[.08em]', meta.className)}>{meta.label}</span>
}

export function Avatar({ name, url, size = 'md' }: { name: string; url?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'h-14 w-14 text-base' : size === 'sm' ? 'h-8 w-8 text-[10px]' : 'h-10 w-10 text-xs'
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  return (
    <span className={cn('grid shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 font-black text-blue-700 ring-1 ring-blue-100', sizeClass)}>
      {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : initials}
    </span>
  )
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="grid min-h-56 place-items-center px-5 py-10 text-center">
      <div>
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600"><Sparkles className="h-6 w-6" /></span>
        <h3 className="mt-4 text-lg font-black text-slate-900">{title}</h3>
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
      <button type="button" onClick={onRetry} className="mt-4 rounded-xl bg-slate-950 px-4 py-2 text-xs font-black text-white">Try again</button>
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

export function Modal({ open, title, description, onClose, children }: {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[140] grid place-items-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-md" onMouseDown={onClose}>
      <motion.div
        initial={{ opacity: 0, y: 18, scale: .97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        onMouseDown={(event) => event.stopPropagation()}
        className="my-auto w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_35px_90px_rgba(15,23,42,.35)]"
      >
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-red-500" />
        <div className="p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div><h2 className="text-2xl font-black tracking-[-.04em] text-slate-950">{title}</h2>{description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null}</div>
            <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-lg text-slate-500 hover:bg-slate-200">×</button>
          </div>
          <div className="mt-6">{children}</div>
        </div>
      </motion.div>
    </div>
  )
}

export const inputClass = 'h-11 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100'
export const primaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 text-sm font-black text-white shadow-[0_12px_28px_rgba(37,99,235,.24)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-wait disabled:opacity-60'
export const secondaryButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700'
