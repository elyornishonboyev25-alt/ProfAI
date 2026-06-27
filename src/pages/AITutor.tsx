import { motion } from 'framer-motion'
import { AudioLines, Eye, ImagePlus, Languages, Sparkles, Wand2 } from 'lucide-react'
import AIChatWindow from '@/components/ai/AIChatWindow'
import VoiceOrb from '@/components/ai/VoiceOrb'
import { useAiAssistantStore } from '@/store/aiAssistantStore'
import { useAuthStore, type AuthState } from '@/store/authStore'

const EASE = [0.22, 1, 0.36, 1] as const

const CAPABILITIES = [
  {
    icon: Eye,
    title: 'Ekraningizni ko‘radi',
    desc: 'Reading, savol yoki maqolani belgilab “shuni tushuntir” deng — aniq matnga qarab tushuntiradi.',
  },
  {
    icon: Wand2,
    title: 'Saytni boshqaradi',
    desc: '“Ishlamagan reading testimni och” yoki “Listening test 2 ni 20 daqiqaga qo‘y” — bajaradi.',
  },
  {
    icon: AudioLines,
    title: 'Ovozli muloqot',
    desc: 'Mikrofonni bosing va tirik o‘qituvchidek gaplashing — javobini ovozda eshitasiz.',
  },
  {
    icon: ImagePlus,
    title: 'Rasm/skrinshot',
    desc: 'Savol yoki matn rasmini yuboring — ko‘rib, yechib, tushuntirib beradi.',
  },
  {
    icon: Languages,
    title: 'Har qanday tilda',
    desc: 'O‘zbek, rus yoki ingliz — qaysi tilda yozsangiz, o‘sha tilda muloyim javob beradi.',
  },
]

export default function AITutor() {
  const openTalk = useAiAssistantStore((s) => s.openTalk)
  const voiceState = useAiAssistantStore((s) => s.voiceState)
  const voiceLevel = useAiAssistantStore((s) => s.voiceLevel)
  const user = useAuthStore((state: AuthState) => state.user)
  const firstName = user?.fullName?.split(' ')[0] ?? null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="mx-auto w-full max-w-6xl"
    >
      {/* Hero band */}
      <section className="relative overflow-hidden rounded-[1.9rem] border border-red-100/85 bg-[linear-gradient(142deg,rgba(255,255,255,0.99),rgba(255,244,247,0.95))] p-6 shadow-[0_24px_56px_rgba(190,24,93,0.14)]">
        <div className="pointer-events-none absolute -left-16 -top-16 h-44 w-44 rounded-full bg-rose-200/55 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-16 h-48 w-48 rounded-full bg-orange-200/45 blur-3xl" />
        <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <VoiceOrb state={voiceState} level={voiceLevel} size={84} />
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-rose-700">
                <Sparkles className="h-3.5 w-3.5" />
                Premium AI Tutor
              </span>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Salom{firstName ? `, ${firstName}` : ''}! Men{' '}
                <span className="arena-title-accent-red">ProfAI</span>
              </h1>
              <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
                Shaxsiy o‘qituvchingiz — ekraningizni ko‘radi, testlarni ochadi, rasmni tushunadi va siz bilan ovozli
                gaplashadi.
              </p>
            </div>
          </div>
          <motion.button
            type="button"
            onClick={openTalk}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="cta-sheen inline-flex shrink-0 items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 px-5 py-3 text-sm font-black text-white shadow-[0_16px_32px_rgba(220,38,38,0.34)]"
          >
            <AudioLines className="h-5 w-5" />
            Ovozli gaplashish
          </motion.button>
        </div>
      </section>

      {/* Body: capabilities + chat */}
      <div className="mt-5 grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-2.5">
          {CAPABILITIES.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.06, ease: EASE }}
                className="flex items-start gap-3 rounded-2xl border border-red-100/85 bg-white/90 p-3.5 shadow-[0_12px_28px_rgba(190,24,93,0.08)]"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-600 text-white">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-900">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-slate-600">{item.desc}</p>
                </div>
              </motion.div>
            )
          })}
        </aside>

        <div className="min-h-[34rem]">
          <AIChatWindow variant="page" />
        </div>
      </div>
    </motion.div>
  )
}
