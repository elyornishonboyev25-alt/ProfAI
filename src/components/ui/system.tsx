import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/components/ui/utils'

export function AppShell({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('ui-page-shell', className)} {...props} />
}

export function FocusShell({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('ui-focus-shell', className)} {...props} />
}

export function Surface({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn('ui-surface', className)} {...props} />
}

export function PageHeader({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <header className={cn('ui-page-header', className)} {...props} />
}

export function PageHero({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={cn('ui-page-hero', className)} {...props} />
}

type ActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger'
}

export function ActionButton({ className, variant = 'primary', type = 'button', ...props }: ActionButtonProps) {
  return <button type={type} className={cn('ui-action', `ui-action-${variant}`, className)} {...props} />
}

export function StatusChip({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('ui-status-chip', className)} {...props} />
}

export function Metric({ label, value, className }: { label: ReactNode; value: ReactNode; className?: string }) {
  return (
    <div className={cn('ui-metric', className)}>
      <span className="ui-metric-label">{label}</span>
      <strong className="ui-metric-value">{value}</strong>
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('ui-empty-state', className)}>
      {icon ? <div className="ui-empty-icon">{icon}</div> : null}
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
