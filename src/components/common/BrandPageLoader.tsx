import { motion } from 'framer-motion'
import { BrandMark } from '@/components/brand/BrandLogo'

export default function BrandPageLoader({ label = 'Preparing your workspace' }: { label?: string }) {
  return (
    <div className="relative flex min-h-[68vh] items-center justify-center overflow-hidden px-5">
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-48 w-48 rounded-full bg-red-300/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-48 w-48 rounded-full bg-orange-200/25 blur-3xl" />
      <div className="relative w-full max-w-md rounded-[2rem] border border-white/90 bg-white/78 p-8 text-center shadow-[0_28px_80px_rgba(127,29,29,0.14)] backdrop-blur-2xl">
        <motion.div
          animate={{ y: [0, -7, 0], rotate: [0, -1.5, 1.5, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="relative mx-auto w-fit"
        >
          <span className="absolute inset-0 rounded-full bg-red-500/35 blur-2xl" />
          <BrandMark size={82} className="relative" />
        </motion.div>
        <p className="mt-5 text-sm font-black text-slate-950">{label}</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">ProfAI is syncing your plan and progress.</p>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-slate-200">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-red-800 via-red-500 to-rose-400"
            initial={{ x: '-100%', width: '46%' }}
            animate={{ x: ['-100%', '225%'] }}
            transition={{ duration: 1.45, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <div className="mt-6 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((item) => (
            <motion.span
              key={item}
              animate={{ opacity: [0.35, 0.9, 0.35] }}
              transition={{ duration: 1.3, repeat: Infinity, delay: item * 0.18 }}
              className="h-14 rounded-xl border border-slate-100 bg-gradient-to-br from-white to-red-50/70"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
