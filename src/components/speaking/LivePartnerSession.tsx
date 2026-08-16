import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Mic,
  MicOff,
  PhoneOff,
  RefreshCw,
  Search,
  Star,
  Users,
  Wifi,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { useSpeakerSocialStore } from '@/store/speakerSocialStore'
import { PART1_TOPICS, PART3_THEMES, CUE_CARDS, pickRandom } from '@/data/speakingQuestions'
import {
  createSignalingTransport,
  type SignalEvent,
  type SignalingTransport,
} from '@/lib/speakingSignaling'
import { createVoiceConnection, type VoiceConnection } from '@/lib/webrtcVoice'
import MicVisualizer from './MicVisualizer'

type Phase = 'setup' | 'searching' | 'connecting' | 'connected' | 'rating' | 'done'
type Level = 'beginner' | 'intermediate' | 'advanced'

const LEVELS: Level[] = ['beginner', 'intermediate', 'advanced']
const RATING_TAGS = ['Clear pronunciation', 'Great fluency', 'Rich vocabulary', 'Good listener', 'Confident', 'Needs more detail']

function getGuestId(): string {
  let id = localStorage.getItem('smarttest-guest-id')
  if (!id) {
    id = `guest-${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem('smarttest-guest-id', id)
  }
  return id
}

function livePromptOptions(part: number): string[] {
  if (part === 2) {
    return CUE_CARDS.map(
      (card) => `Cue card: ${card.title}. You should say: ${card.bullets.join('; ')}.`,
    )
  }
  if (part === 3) return PART3_THEMES.flatMap((theme) => theme.questions)
  return PART1_TOPICS.flatMap((topic) => topic.questions)
}

function nextLivePrompt(part: number, usedPrompts: Set<string>): string {
  const options = livePromptOptions(part)
  let available = options.filter((option) => !usedPrompts.has(option))

  // A normal partner session will never exhaust the bank. If it does, start a
  // fresh cycle for this part only instead of repeating an immediate prompt.
  if (available.length === 0) {
    options.forEach((option) => usedPrompts.delete(option))
    available = options
  }

  const prompt = pickRandom(available)
  usedPrompts.add(prompt)
  return prompt
}

export default function LivePartnerSession({ onExit }: { onExit: () => void }) {
  const navigate = useNavigate()
  const user = useAuthStore((state: AuthState) => state.user)
  const addRating = useSpeakerSocialStore((s) => s.addRating)

  const [phase, setPhase] = useState<Phase>('setup')
  const [part, setPart] = useState<number>(1)
  const [level, setLevel] = useState<Level>('intermediate')
  const [queueSeconds, setQueueSeconds] = useState(0)
  const [sessionSeconds, setSessionSeconds] = useState(0)
  const [muted, setMuted] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [peerName, setPeerName] = useState('Partner')
  const [peerUserId, setPeerUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)

  // Peer rating form
  const [rFluency, setRFluency] = useState(0)
  const [rPron, setRPron] = useState(0)
  const [rHelp, setRHelp] = useState(0)
  const [rTags, setRTags] = useState<string[]>([])
  const [rNote, setRNote] = useState('')

  const transportRef = useRef<SignalingTransport | null>(null)
  const voiceRef = useRef<VoiceConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const isCallerRef = useRef(false)
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const partRef = useRef(part)
  const phaseRef = useRef<Phase>('setup')
  const usedPromptsRef = useRef(new Set<string>())
  // Buffer WebRTC signals that arrive before the peer connection is built (race-safe).
  const pendingSignalsRef = useRef<unknown[]>([])

  useEffect(() => { partRef.current = part }, [part])
  useEffect(() => { phaseRef.current = phase }, [phase])

  const cleanup = useCallback((stopMic = true) => {
    transportRef.current?.leave()
    transportRef.current?.close()
    transportRef.current = null
    voiceRef.current?.close()
    voiceRef.current = null
    if (stopMic) {
      localStreamRef.current?.getTracks().forEach((t) => t.stop())
      localStreamRef.current = null
      setLocalStream(null)
    }
    setRemoteStream(null)
  }, [])

  useEffect(() => () => cleanup(), [cleanup])

  // Queue timer
  useEffect(() => {
    if (phase !== 'searching') return
    const id = window.setInterval(() => setQueueSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [phase])

  // Session timer
  useEffect(() => {
    if (phase !== 'connected') return
    const id = window.setInterval(() => setSessionSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [phase])

  // Attach remote audio
  useEffect(() => {
    if (audioElRef.current && remoteStream) {
      audioElRef.current.srcObject = remoteStream
      void audioElRef.current.play().catch(() => {})
    }
  }, [remoteStream])

  // Stable handler (reads live values from refs) so the transport never holds a stale closure.
  const handleEvent = useCallback((event: SignalEvent) => {
    if (event.type === 'matched') {
      isCallerRef.current = event.isCaller
      setPeerName(event.peerName || 'Partner')
      setPeerUserId(event.peerUserId || null)
      setPhase('connecting')

      const voice = createVoiceConnection({
        isCaller: event.isCaller,
        sendSignal: (data) => transportRef.current?.sendSignal(data),
        onRemoteStream: (stream) => setRemoteStream(stream),
        onStateChange: (state) => {
          if (state === 'connected') {
            setPhase('connected')
            // Caller seeds the first shared prompt.
            if (isCallerRef.current) {
              const first = nextLivePrompt(partRef.current, usedPromptsRef.current)
              setPrompt(first)
              transportRef.current?.sendSignal({ app: 'prompt', text: first })
            }
          } else if (state === 'failed') {
            setError('Connection failed. Your network may be blocking peer-to-peer audio.')
          }
        },
      })
      voiceRef.current = voice
      if (localStreamRef.current) {
        void voice.start(localStreamRef.current).then(() => {
          const pending = pendingSignalsRef.current
          pendingSignalsRef.current = []
          pending.forEach((data) => void voice.handleSignal(data))
        })
      }
      return
    }

    if (event.type === 'signal') {
      const data = event.data as { app?: string; text?: string }
      if (data && data.app === 'prompt') {
        const sharedPrompt = data.text ?? ''
        if (sharedPrompt) usedPromptsRef.current.add(sharedPrompt)
        setPrompt(sharedPrompt)
        return
      }
      // If the peer connection isn't built yet, buffer the SDP/ICE for replay.
      if (voiceRef.current) {
        void voiceRef.current.handleSignal(event.data)
      } else {
        pendingSignalsRef.current.push(event.data)
      }
      return
    }

    if (event.type === 'peer_left') {
      if (phaseRef.current === 'connected' || phaseRef.current === 'connecting') {
        setError('Your partner left the session.')
        setPhase('rating')
      }
      return
    }

    if (event.type === 'error') {
      setError(event.message)
    }
  }, [])

  const startSearch = useCallback(async () => {
    setError(null)
    setQueueSeconds(0)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      localStreamRef.current = stream
      setLocalStream(stream)
    } catch {
      setError('Microphone access is required for live speaking. Please allow it and try again.')
      return
    }

    const identity = { userId: user?.id ?? getGuestId(), name: user?.fullName ?? 'Guest Speaker' }
    const transport = createSignalingTransport(identity)
    transport.on(handleEvent)
    transportRef.current = transport
    setPhase('searching')
    transport.queue({ part, level })
  }, [handleEvent, level, part, user])

  const cancelSearch = useCallback(() => {
    cleanup()
    setPhase('setup')
  }, [cleanup])

  const toggleMute = useCallback(() => {
    const next = !muted
    setMuted(next)
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next))
  }, [muted])

  const nextPrompt = useCallback(() => {
    const p = nextLivePrompt(part, usedPromptsRef.current)
    setPrompt(p)
    transportRef.current?.sendSignal({ app: 'prompt', text: p })
  }, [part])

  const endSession = useCallback(() => {
    cleanup()
    setPhase('rating')
  }, [cleanup])

  const submitRating = useCallback(() => {
    if (peerUserId) {
      addRating(peerUserId, {
        fromName: user?.fullName ?? 'Guest Speaker',
        fromUserId: user?.id ?? null,
        fluency: rFluency,
        pronunciation: rPron,
        helpfulness: rHelp,
        tags: rTags,
        note: rNote.trim() || undefined,
      })
    }
    setPhase('done')
  }, [addRating, peerUserId, rFluency, rHelp, rNote, rPron, rTags, user])

  // ── Render ────────────────────────────────────────────────────────────────
  if (phase === 'rating' || phase === 'done') {
    return (
      <RatingScreen
        phase={phase}
        peerName={peerName}
        peerUserId={peerUserId}
        error={error}
        rFluency={rFluency} setRFluency={setRFluency}
        rPron={rPron} setRPron={setRPron}
        rHelp={rHelp} setRHelp={setRHelp}
        rTags={rTags} setRTags={setRTags}
        rNote={rNote} setRNote={setRNote}
        onSubmit={submitRating}
        onViewProfile={() => peerUserId && navigate(`/speaker/${peerUserId}`)}
        onExit={onExit}
      />
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <audio ref={audioElRef} autoPlay className="hidden" />
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => { cleanup(); onExit() }} className="premium-back-btn">
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <span className="soft-chip">Live Partner · voice only</span>
      </div>

      {phase === 'setup' ? (
        <div className="surface-card p-6 sm:p-8">
          <h2 className="inline-flex items-center gap-2 text-2xl font-black text-slate-900">
            <Users className="h-6 w-6 text-red-600" /> Find a speaking partner
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            You’ll be matched with another learner searching at the same time. It’s microphone-only — no camera, no chat.
            Talk through a shared question, then rate each other.
          </p>

          <p className="mt-5 text-xs font-bold uppercase tracking-wide text-red-600">Speaking part</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                onClick={() => setPart(p)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  part === p ? 'border-red-300 bg-gradient-to-r from-red-600 to-rose-600 text-white' : 'border-red-200 bg-white text-slate-700 hover:border-red-300'
                }`}
              >
                Part {p}
              </button>
            ))}
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-wide text-red-600">Your level</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold capitalize transition ${
                  level === l ? 'border-red-300 bg-gradient-to-r from-red-600 to-rose-600 text-white' : 'border-red-200 bg-white text-slate-700 hover:border-red-300'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          {error ? <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <button onClick={() => void startSearch()} className="arena-primary-btn cta-sheen mt-6 w-full justify-center py-3">
            <Search className="mr-2 h-5 w-5" /> Find Partner
          </button>
          <p className="mt-3 text-center text-xs text-slate-500">
            Tip: open this page in a second tab and search there too — you’ll be matched together.
          </p>
        </div>
      ) : null}

      {phase === 'searching' || phase === 'connecting' ? (
        <div className="surface-card flex flex-col items-center p-10 text-center">
          <div className="relative flex h-24 w-24 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-300/50" />
            <span className="relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-rose-600 text-white">
              {phase === 'connecting' ? <Wifi className="h-9 w-9" /> : <Search className="h-9 w-9" />}
            </span>
          </div>
          <h2 className="mt-5 text-xl font-black text-slate-900">
            {phase === 'connecting' ? `Connecting to ${peerName}…` : 'Searching for a partner…'}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {phase === 'connecting' ? 'Setting up the voice channel.' : `Part ${part} · ${level} · ${queueSeconds}s in queue`}
          </p>
          <button onClick={cancelSearch} className="arena-secondary-btn mt-6">Cancel</button>
        </div>
      ) : null}

      {phase === 'connected' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <SpeakerTile name={user?.fullName ?? 'You'} stream={localStream} active={!muted} you muted={muted} />
            <SpeakerTile name={peerName} stream={remoteStream} active />
          </div>

          <div className="surface-card p-5 text-center">
            <p className="text-xs font-bold uppercase tracking-wide text-red-600">Shared question</p>
            <p className="mt-2 text-lg font-bold leading-7 text-slate-900">{prompt || 'Warming up…'}</p>
            <button onClick={nextPrompt} className="arena-secondary-btn mt-3 text-sm">
              <RefreshCw className="mr-1.5 h-4 w-4" /> Next question
            </button>
          </div>

          <div className="surface-card flex items-center justify-between p-4">
            <span className="inline-flex items-center gap-2 text-sm font-bold text-slate-700">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
              Live · {Math.floor(sessionSeconds / 60)}:{String(sessionSeconds % 60).padStart(2, '0')}
            </span>
            <div className="flex gap-2">
              <button onClick={toggleMute} className={`${muted ? 'arena-primary-btn' : 'arena-secondary-btn'} px-4 py-2 text-sm`}>
                {muted ? <MicOff className="mr-1.5 h-4 w-4" /> : <Mic className="mr-1.5 h-4 w-4" />}
                {muted ? 'Unmute' : 'Mute'}
              </button>
              <button onClick={endSession} className="arena-primary-btn bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-2 text-sm">
                <PhoneOff className="mr-1.5 h-4 w-4" /> End
              </button>
            </div>
          </div>
          {error ? <p className="text-center text-sm text-red-600">{error}</p> : null}
        </div>
      ) : null}
    </div>
  )
}

function SpeakerTile({ name, stream, active, you, muted }: { name: string; stream: MediaStream | null; active: boolean; you?: boolean; muted?: boolean }) {
  return (
    <div className="surface-card flex flex-col items-center p-4">
      <div className="relative">
        <div className={`flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${you ? 'from-red-600 to-rose-600' : 'from-amber-500 to-orange-600'} text-xl font-black text-white`}>
          {name.slice(0, 1).toUpperCase()}
        </div>
        {muted ? (
          <span className="absolute -bottom-1 -right-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-white">
            <MicOff className="h-3.5 w-3.5" />
          </span>
        ) : null}
      </div>
      <p className="mt-2 truncate text-sm font-bold text-slate-900">{name}{you ? ' (You)' : ''}</p>
      <MicVisualizer stream={stream} active={active} bars={18} />
    </div>
  )
}

function StarRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}>
          <Star className={`h-7 w-7 transition ${n <= value ? 'fill-amber-400 text-amber-500' : 'text-slate-300 hover:text-amber-300'}`} />
        </button>
      ))}
    </div>
  )
}

function RatingScreen({
  phase, peerName, peerUserId, error,
  rFluency, setRFluency, rPron, setRPron, rHelp, setRHelp, rTags, setRTags, rNote, setRNote,
  onSubmit, onViewProfile, onExit,
}: {
  phase: 'rating' | 'done'
  peerName: string
  peerUserId: string | null
  error: string | null
  rFluency: number; setRFluency: (v: number) => void
  rPron: number; setRPron: (v: number) => void
  rHelp: number; setRHelp: (v: number) => void
  rTags: string[]; setRTags: (v: string[]) => void
  rNote: string; setRNote: (v: string) => void
  onSubmit: () => void
  onViewProfile: () => void
  onExit: () => void
}) {
  if (phase === 'done') {
    return (
      <div className="surface-card mx-auto max-w-xl p-8 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
          🎉
        </motion.div>
        <h2 className="mt-4 text-2xl font-black text-slate-900">Thanks for speaking!</h2>
        <p className="mt-2 text-sm text-slate-600">Your feedback for {peerName} was saved. Keep practising to climb the leaderboard.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {peerUserId ? <button onClick={onViewProfile} className="arena-secondary-btn">View {peerName}’s profile</button> : null}
          <button onClick={onExit} className="arena-primary-btn">Back to Speaking Hub</button>
        </div>
      </div>
    )
  }

  return (
    <div className="surface-card mx-auto max-w-xl p-6 sm:p-8">
      <h2 className="text-2xl font-black text-slate-900">Rate {peerName}</h2>
      <p className="mt-1 text-sm text-slate-600">Honest, kind feedback helps everyone improve. {error ? `(${error})` : ''}</p>

      <div className="mt-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Fluency</span>
          <StarRow value={rFluency} onChange={setRFluency} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Pronunciation</span>
          <StarRow value={rPron} onChange={setRPron} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">Helpfulness</span>
          <StarRow value={rHelp} onChange={setRHelp} />
        </div>
      </div>

      <p className="mt-5 text-xs font-bold uppercase tracking-wide text-red-600">Quick tags</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {RATING_TAGS.map((tag) => {
          const on = rTags.includes(tag)
          return (
            <button
              key={tag}
              type="button"
              onClick={() => setRTags(on ? rTags.filter((t) => t !== tag) : [...rTags, tag])}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                on ? 'border-red-300 bg-red-600 text-white' : 'border-red-200 bg-white text-slate-700 hover:border-red-300'
              }`}
            >
              {tag}
            </button>
          )
        })}
      </div>

      <textarea
        value={rNote}
        onChange={(e) => setRNote(e.target.value)}
        placeholder="Optional note (kept private to their profile feedback)…"
        className="input mt-4 min-h-[72px] w-full resize-y"
        maxLength={240}
      />

      <button onClick={onSubmit} disabled={!rFluency && !rPron && !rHelp} className="arena-primary-btn cta-sheen mt-5 w-full justify-center py-3 disabled:opacity-50">
        Submit rating
      </button>
      <button onClick={onExit} className="mt-2 w-full text-center text-xs font-medium text-slate-400 hover:text-red-600">Skip</button>
    </div>
  )
}
