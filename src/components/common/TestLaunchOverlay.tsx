import { motion } from 'framer-motion'
import { BrandMark } from '@/components/brand/BrandLogo'

type TestLaunchOverlayProps = {
  title?: string
  subtitle?: string
}

/**
 * Full-screen "Your test will begin shortly" loader, shown for a short beat when a
 * learner launches any test (Reading / Listening / Writing / Speaking) so the jump
 * into the exam environment feels deliberate and calm.
 */
export default function TestLaunchOverlay({
  title = 'Your test will begin shortly',
  subtitle = 'Please wait',
}: TestLaunchOverlayProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[linear-gradient(160deg,#ffffff_0%,#fff5f5_52%,#fffaf8_100%)]"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-red-200/40 blur-3xl" />
        <div className="absolute bottom-[-7rem] right-0 h-96 w-96 rounded-full bg-rose-200/35 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center px-6 text-center">
        <div className="relative grid h-24 w-24 place-items-center">
          <motion.span
            className="absolute inset-0 rounded-full border-[3px] border-red-100 border-t-red-600"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
          />
          <BrandMark size={56} />
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-7 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl"
        >
          {title}
        </motion.h2>
        <p className="mt-2 text-sm font-medium text-slate-500">{subtitle}</p>

        <div className="mt-6 h-1 w-44 overflow-hidden rounded-full bg-red-100">
          <motion.div
            className="h-full w-1/2 rounded-full bg-gradient-to-r from-red-600 via-rose-500 to-orange-400"
            animate={{ x: ['-65%', '175%'] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </div>
    </motion.div>
  )
}
