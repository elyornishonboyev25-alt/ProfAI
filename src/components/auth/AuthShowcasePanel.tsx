import { motion } from 'framer-motion'
import { BrainCircuit, CheckCircle2, GraduationCap, MapPin, Sparkles, Target } from 'lucide-react'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { BrandMark } from '@/components/brand/BrandLogo'

const journey = [
  { icon: Target, label: 'Your score', detail: 'IELTS + SAT' },
  { icon: BrainCircuit, label: 'AI roadmap', detail: 'Daily focus' },
  { icon: GraduationCap, label: 'University', detail: 'Best-fit path' },
] as const

const stats = [
  { value: '30+', label: 'Full mocks' },
  { value: '24/7', label: 'AI feedback' },
  { value: '1', label: 'Clear path' },
] as const

export default function AuthShowcasePanel({ quote = 'Your university journey continues here.' }: { quote?: string }) {
  const { minimalMotion } = useMotionPreferences()

  return (
    <aside className="auth-showcase relative hidden min-h-[720px] overflow-hidden rounded-[2.5rem] bg-[#090d1a] p-9 text-white shadow-[0_34px_90px_rgba(15,23,42,.34)] lg:flex lg:flex-col lg:justify-between xl:p-11">
      <img
        src="/assets/auth/students-collaborating.webp"
        alt="Students building their university application together"
        className="absolute inset-0 h-full w-full object-cover opacity-45"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,9,20,.58)_0%,rgba(9,13,26,.84)_52%,rgba(18,7,14,.98)_100%),linear-gradient(118deg,rgba(30,64,175,.7),transparent_58%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_15%,rgba(251,113,133,.25),transparent_30%),radial-gradient(circle_at_18%_76%,rgba(59,130,246,.18),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/80 to-transparent" />

      <div className="relative flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-white/10 shadow-[0_14px_34px_rgba(59,130,246,.28)] backdrop-blur-xl">
            <BrandMark size={38} />
          </span>
          <div>
            <p className="text-sm font-black tracking-tight">Prof<span className="text-blue-400">AI</span></p>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">Learning cockpit</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/25 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-200 backdrop-blur-xl">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.9)]" />
          Progress saved
        </span>
      </div>

      <div className="relative py-8">
        <motion.span
          initial={minimalMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-blue-200 backdrop-blur-xl"
        >
          <Sparkles className="h-3.5 w-3.5" /> One account. Your entire journey.
        </motion.span>
        <motion.h2
          initial={minimalMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 max-w-lg text-[2.65rem] font-black leading-[1.02] tracking-[-0.045em] xl:text-5xl"
        >
          {quote}
        </motion.h2>
        <p className="mt-4 max-w-md text-sm leading-7 text-slate-300">
          Return to the exact plan, practice history and university targets you left behind.
        </p>

        <div className="relative mt-8 overflow-hidden rounded-[1.8rem] border border-white/15 bg-white/[.08] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_24px_48px_rgba(0,0,0,.24)] backdrop-blur-2xl">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-200">Your live route</p>
              <p className="mt-1 text-sm font-bold text-white">From today’s score to your dream campus</p>
            </div>
            <MapPin className="h-5 w-5 text-blue-300" />
          </div>
          <div className="relative grid grid-cols-3 gap-3">
            <div className="absolute left-[16%] right-[16%] top-5 h-px bg-gradient-to-r from-blue-400/60 via-orange-300/70 to-emerald-300/60" />
            {journey.map(({ icon: Icon, label, detail }, index) => (
              <motion.div
                key={label}
                initial={minimalMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.09, duration: 0.4 }}
                className="relative text-center"
              >
                <span className={`relative mx-auto flex h-10 w-10 items-center justify-center rounded-2xl border shadow-lg backdrop-blur-xl ${index === 1 ? 'border-blue-300/60 bg-blue-500 text-white shadow-blue-900/40' : 'border-white/20 bg-white/10 text-white'}`}>
                  <Icon className="h-4 w-4" />
                  {index === 1 && !minimalMotion ? (
                    <motion.span
                      className="absolute inset-0 rounded-2xl border border-blue-300/70"
                      animate={{ scale: [1, 1.35], opacity: [0.8, 0] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
                    />
                  ) : null}
                </span>
                <p className="mt-2 text-[11px] font-black text-white">{label}</p>
                <p className="mt-0.5 text-[9px] font-semibold text-white/45">{detail}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/12 bg-black/15 px-4 py-3 backdrop-blur-xl">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-200">
            <CheckCircle2 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-xs font-black text-white">Everything is exactly where you left it</p>
            <p className="mt-0.5 text-[10px] text-white/45">Study history syncs securely across every device.</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[.06] px-3 py-3 text-center backdrop-blur-xl">
              <p className="text-lg font-black text-blue-300">{stat.value}</p>
              <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-white/50">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
