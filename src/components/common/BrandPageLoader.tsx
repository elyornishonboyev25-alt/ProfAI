import { BrandMark } from '@/components/brand/BrandLogo'
import { useCopy } from '@/i18n/interface'

export default function BrandPageLoader({
  label = 'Preparing your workspace',
  compact = false,
  detail,
}: {
  label?: string
  compact?: boolean
  detail?: string
}) {
  const { c } = useCopy()
  return (
    <div className={`relative flex w-full min-w-0 items-center justify-center px-5 ${compact ? 'min-h-[70vh]' : 'min-h-[56vh]'}`} role="status" aria-live="polite">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <BrandMark size={36} />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{c(label)}</p>
        {detail ? <p className="text-xs text-slate-500">{c(detail)}</p> : null}
        <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-red-600 motion-reduce:animate-none" />
      </div>
    </div>
  )
}
