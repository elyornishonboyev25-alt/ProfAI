import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageCircle, Sparkles, Trophy, Wand2 } from 'lucide-react'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useSpeakingStore } from '@/store/speakingStore'
import { saveSpeakingSession } from '@/lib/speakingApi'
import ExaminerSession, { type SessionConfig } from '@/components/speaking/ExaminerSession'

const FREE_TALK_TOPICS = [
  'Travel & cultures',
  'Technology & the future',
  'Your dream job',
  'A film or series you love',
  'Food & cooking',
  'Sport & fitness',
  'Music',
  'Your hometown',
]

// "AI Coach" section — the AI is used ONLY for a Full Mock exam or free open-topic
// conversation (no isolated Part 1/2/3 drills here; those live in IELTS Speaking).
export default function AiCoach() {
  const user = useAuthStore((state: AuthState) => state.user)
  const updateUserProgress = useAuthStore((state: AuthState) => state.updateUserProgress)
  const addSession = useSpeakingStore((s) => s.addSession)

  const [config, setConfig] = useState<SessionConfig | null>(null)
  const [topic, setTopic] = useState('')

  const labelFor = (c: SessionConfig) =>
    c.mode === 'full_mock' ? 'AI Full Mock' : `Free Talk${c.topic ? `: ${c.topic}` : ''}`

  if (config) {
    return (
      <ExaminerSession
        config={config}
        modeLabel={labelFor(config)}
        onExit={() => setConfig(null)}
        onSaved={(evaluation) => {
          const localSession = addSession({
            userId: user?.id ?? null,
            modeLabel: labelFor(config),
            kind: 'examiner',
            overallBand: evaluation.overallBand,
            fluencyBand: evaluation.fluencyBand,
            lexicalBand: evaluation.lexicalBand,
            grammarBand: evaluation.grammarBand,
            pronunciationBand: evaluation.pronunciationBand,
            durationSec: evaluation.stats.durationSec,
            wordCount: evaluation.stats.wordCount,
            fillerCount: evaluation.stats.fillerCount,
            summary: evaluation.summary,
          })
          // Persist to the backend so it powers the real public profile + community.
          if (user) {
            void saveSpeakingSession({
              eventKey: localSession.id,
              mode: config.mode,
              modeLabel: labelFor(config),
              overallBand: evaluation.overallBand,
              fluencyBand: evaluation.fluencyBand,
              lexicalBand: evaluation.lexicalBand,
              grammarBand: evaluation.grammarBand,
              pronunciationBand: evaluation.pronunciationBand,
              durationSec: evaluation.stats.durationSec,
              wordCount: evaluation.stats.wordCount,
            }, user.id).then((reward) => {
              if (reward) updateUserProgress({ xp: reward.totalXp, level: reward.level })
            })
          }
        }}
      />
    )
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Full Mock */}
      <motion.div whileHover={{ y: -4 }} className="surface-card relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-red-100/50 blur-2xl" />
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 text-white shadow-[0_12px_24px_rgba(220,38,38,0.28)]">
          <Trophy className="h-6 w-6" />
        </span>
        <h3 className="mt-4 text-xl font-black text-slate-900">Full IELTS Mock</h3>
        <p className="text-xs font-semibold uppercase tracking-wide text-red-600">~14 min · graded</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          The complete exam — Part 1, 2 and 3 back to back. The AI examiner speaks each question, asks adaptive
          follow-ups, and gives you a full band score with feedback at the end.
        </p>
        <button onClick={() => setConfig({ mode: 'full_mock' })} className="arena-primary-btn cta-sheen mt-5 w-full justify-center py-3">
          <Wand2 className="mr-2 h-5 w-5" /> Start Full Mock
        </button>
      </motion.div>

      {/* Free Talk */}
      <motion.div whileHover={{ y: -4 }} className="surface-card relative overflow-hidden p-6">
        <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-rose-100/50 blur-2xl" />
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-[0_12px_24px_rgba(220,38,38,0.28)]">
          <MessageCircle className="h-6 w-6" />
        </span>
        <h3 className="mt-4 text-xl font-black text-slate-900">Free Talk</h3>
        <p className="text-xs font-semibold uppercase tracking-wide text-red-600">Open conversation</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Just chat naturally with the AI about anything you like. Great for building fluency and confidence — pick a
          topic or type your own, then start talking.
        </p>

        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Type any topic… (optional)"
          className="input mt-4"
          maxLength={60}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {FREE_TALK_TOPICS.map((t) => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                topic === t ? 'border-red-300 bg-red-600 text-white' : 'border-red-200 bg-white text-slate-600 hover:border-red-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button onClick={() => setConfig({ mode: 'free_talk', topic: topic.trim() })} className="arena-primary-btn mt-5 w-full justify-center py-3">
          <Sparkles className="mr-2 h-5 w-5" /> Start Free Talk
        </button>
      </motion.div>
    </div>
  )
}
