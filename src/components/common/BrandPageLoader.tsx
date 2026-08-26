import { BrandMark } from '@/components/brand/BrandLogo'

export default function BrandPageLoader({
  label = 'Preparing your workspace',
  compact = false,
}: {
  label?: string
  compact?: boolean
}) {
  return (
    <div className={`relative flex w-full min-w-0 items-center justify-center px-5 ${compact ? 'min-h-[70vh]' : 'min-h-[56vh]'}`} role="status" aria-live="polite">
      <div className={`route-loader-card relative min-w-0 w-full text-center ${compact ? 'max-w-xs p-5' : 'max-w-sm p-6 sm:p-7'}`}>
        <div className="relative mx-auto w-fit">
          <BrandMark size={compact ? 54 : 70} className="relative" />
        </div>
        <p className={`${compact ? 'mt-3' : 'mt-4'} text-sm font-black text-slate-950`}>{label}</p>
        {!compact ? <p className="mt-1 text-xs font-semibold text-slate-500">Syncing your plan and progress.</p> : null}
        <div className={`${compact ? 'mt-4' : 'mt-5'} h-1 overflow-hidden rounded-full bg-slate-200/90`}>
          <div className="arena-loader-progress h-full w-[42%] rounded-full bg-gradient-to-r from-red-800 via-red-500 to-blue-500" />
        </div>
      </div>
    </div>
  )
}
