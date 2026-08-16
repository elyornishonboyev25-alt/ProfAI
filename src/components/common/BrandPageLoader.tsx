import { BrandMark } from '@/components/brand/BrandLogo'

export default function BrandPageLoader({ label = 'Preparing your workspace' }: { label?: string }) {
  return (
    <div className="relative flex min-h-[68vh] w-full min-w-0 items-center justify-center overflow-hidden px-5">
      <div className="relative min-w-0 w-full max-w-md rounded-[2rem] border border-white/90 bg-white/78 p-6 text-center shadow-[0_28px_70px_rgba(30,41,59,0.13)] backdrop-blur-xl sm:p-8">
        <div className="relative mx-auto w-fit">
          <BrandMark size={82} className="relative" />
        </div>
        <p className="mt-5 text-sm font-black text-slate-950">{label}</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">ProfAI is syncing your plan and progress.</p>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-slate-200">
          <div className="arena-loader-progress h-full w-[42%] rounded-full bg-gradient-to-r from-red-800 via-red-500 to-blue-500" />
        </div>
        <div className="mt-6 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((item) => (
            <span
              key={item}
              className="h-14 rounded-xl border border-slate-100 bg-gradient-to-br from-white to-blue-50/60"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
