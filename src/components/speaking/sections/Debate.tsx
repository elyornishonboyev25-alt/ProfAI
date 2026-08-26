import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock3, Headphones, Loader2, MessagesSquare, Mic, MicOff, PhoneOff, ShieldCheck, Sparkles, ThumbsDown, ThumbsUp, Users } from 'lucide-react'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { createDebateTransport } from '@/lib/debateSignaling'
import { createDebateMesh, type DebateMeshState } from '@/lib/debateVoice'
import MicVisualizer from '@/components/speaking/MicVisualizer'

type Phase = 'setup' | 'searching' | 'in'

const EMPTY_MESH: DebateMeshState = {
  roomId: '',
  roomNumber: 0,
  capacity: 5,
  topic: null,
  peers: [],
}

function getGuestId(): string {
  let id = localStorage.getItem('smarttest-guest-id')
  if (!id) {
    id = `guest-${Math.random().toString(36).slice(2, 10)}`
    localStorage.setItem('smarttest-guest-id', id)
  }
  return id
}

// "Debate" section — live group voice rooms of up to 5 speakers (WebRTC mesh).
export default function Debate() {
  const user = useAuthStore((state: AuthState) => state.user)

  const [phase, setPhase] = useState<Phase>('setup')
  const [muted, setMuted] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [mesh, setMesh] = useState<DebateMeshState>(EMPTY_MESH)

  const meshRef = useRef<ReturnType<typeof createDebateMesh> | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  const cleanup = useCallback(() => {
    meshRef.current?.leave()
    meshRef.current = null
    localStreamRef.current?.getTracks().forEach((t) => t.stop())
    localStreamRef.current = null
    setLocalStream(null)
    setMesh(EMPTY_MESH)
    setSeconds(0)
    setMuted(false)
  }, [])

  useEffect(() => () => cleanup(), [cleanup])

  useEffect(() => {
    if (phase !== 'in') return
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [phase])

  const join = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      })
      localStreamRef.current = stream
      setLocalStream(stream)
    } catch {
      setError('Microphone access is required to join a debate. Please allow it and try again.')
      return
    }
    const identity = { userId: user?.id ?? getGuestId(), name: user?.nickname ?? user?.fullName ?? 'Guest Speaker' }
    const transport = createDebateTransport(identity)
    const controller = createDebateMesh({
      transport,
      localStream: localStreamRef.current,
      onChange: (state) => {
        setMesh(state)
        setPhase('in')
      },
      onError: (msg) => setError(msg),
      onFatal: (msg) => {
        setError(msg)
        cleanup()
        setPhase('setup')
      },
    })
    meshRef.current = controller
    setPhase('searching')
    controller.start()
  }, [user])

  const toggleMute = useCallback(() => {
    const next = !muted
    setMuted(next)
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = !next))
  }, [muted])

  const leave = useCallback(() => {
    cleanup()
    setPhase('setup')
  }, [cleanup])

  // ── Setup ─────────────────────────────────────────────────────────────────
  if (phase === 'setup') {
    return (
      <div className="community-debate-welcome">
        <div className="community-debate-welcome-copy">
          <span className="community-debate-icon"><MessagesSquare /></span>
          <span className="community-eyebrow"><Sparkles className="h-3.5 w-3.5" /> IELTS speaking club</span>
          <h2>Enter a focused, five-person debate.</h2>
          <p>
            One tap finds the first room with an open seat. When all five seats are full, the next learner automatically
            starts a new room. Every room receives its own IELTS-style motion and follow-up questions.
          </p>
          <div className="community-debate-features">
            <span><Users /> Maximum 5 speakers</span>
            <span><Headphones /> Live voice only</span>
            <span><ShieldCheck /> Mic controls included</span>
          </div>
          {error ? <p className="community-room-error" role="alert">{error}</p> : null}
          <button type="button" onClick={() => void join()} className="community-room-primary">
            <Mic /> Join debate automatically
          </button>
          <small>Your microphone is requested only after you press Join.</small>
        </div>
        <div className="community-debate-seat-preview" aria-label="Five-person room preview">
          {Array.from({ length: 5 }, (_, index) => (
            <span key={index} className={index === 0 ? 'is-ready' : ''}>
              {index === 0 ? <Mic /> : <Users />}
              <b>{index === 0 ? 'You' : `Seat ${index + 1}`}</b>
              <small>{index === 0 ? 'Ready to join' : 'Auto-filled'}</small>
            </span>
          ))}
        </div>
      </div>
    )
  }

  // ── Searching ─────────────────────────────────────────────────────────────
  if (phase === 'searching') {
    return (
      <div className="community-room-searching" aria-live="polite">
        <span><Loader2 /></span>
        <h2>Finding your best available room…</h2>
        <p>We are filling an open seat first. If every room is full, a fresh five-person room opens automatically.</p>
        <div className="community-room-search-steps"><i className="is-done" /><i className="is-active" /><i /></div>
        <button type="button" onClick={leave}>Cancel search</button>
      </div>
    )
  }

  // ── In room ───────────────────────────────────────────────────────────────
  const everyone = mesh.peers.length + 1
  return (
    <div className="community-debate-room">
      {/* Audio sinks for each peer */}
      {mesh.peers.map((p) => (
        <PeerAudio key={p.id} stream={p.stream} />
      ))}

      <header className="community-debate-room-bar">
        <div>
          <span className="community-live-dot" />
          <b>Debate room #{mesh.roomNumber || 1}</b>
          <small>{everyone}/{mesh.capacity} seats filled</small>
        </div>
        <span><Clock3 /> {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</span>
      </header>

      <div className="community-debate-motion">
        <div className="community-debate-motion-main">
          <span className="community-eyebrow"><MessagesSquare className="h-4 w-4" /> Today’s motion</span>
          <h2>“{mesh.topic?.motion || 'Loading motion…'}”</h2>
          <p><b>Warm-up:</b> {mesh.topic?.warmup}</p>
          <div className="community-debate-sides">
            <span><ThumbsUp /> Build the case FOR</span>
            <span><ThumbsDown /> Challenge it AGAINST</span>
          </div>
        </div>
        <aside>
          <b>Take the discussion deeper</b>
          {mesh.topic?.followUps.map((question) => <p key={question}>{question}</p>)}
          <div>{mesh.topic?.vocabulary.map((word) => <span key={word}>{word}</span>)}</div>
        </aside>
      </div>

      <div className="community-debate-speakers">
        <SpeakerTile name={user?.nickname ?? user?.fullName ?? 'You'} stream={localStream} active={!muted} you muted={muted} connected />
        {mesh.peers.map((p) => (
          <SpeakerTile key={p.id} name={p.name} stream={p.stream} active={p.connected} connected={p.connected} />
        ))}
        {Array.from({ length: Math.max(0, mesh.capacity - everyone) }).map((_, i) => (
          <div key={`empty-${i}`} className="community-speaker-tile is-empty">
            <span><Users /></span>
            <b>Open seat</b>
            <small>The next learner joins here</small>
          </div>
        ))}
      </div>

      <footer className="community-debate-controls">
        <div>
          <span className="community-live-dot" />
          <b>Voice room live</b>
          <small>{everyone < mesh.capacity ? `${mesh.capacity - everyone} seat${mesh.capacity - everyone === 1 ? '' : 's'} available` : 'Room is full'}</small>
        </div>
        <div>
          <button type="button" onClick={toggleMute} className={muted ? 'is-muted' : ''}>
            {muted ? <MicOff /> : <Mic />}
            {muted ? 'Unmute' : 'Mute'}
          </button>
          <button type="button" onClick={leave} className="is-leave">
            <PhoneOff /> Leave room
          </button>
        </div>
      </footer>
      {error ? <p className="community-room-error" role="alert">{error}</p> : null}
    </div>
  )
}

function SpeakerTile({
  name,
  stream,
  active,
  connected,
  you,
  muted,
}: {
  name: string
  stream: MediaStream | null
  active: boolean
  connected: boolean
  you?: boolean
  muted?: boolean
}) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="community-speaker-tile">
      <div className="relative">
        <div className={you ? 'community-speaker-avatar is-you' : 'community-speaker-avatar'}>
          {name.slice(0, 1).toUpperCase()}
        </div>
        {muted ? (
          <span className="absolute -bottom-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-white">
            <MicOff className="h-3 w-3" />
          </span>
        ) : null}
      </div>
      <b>{name}{you ? ' (You)' : ''}</b>
      {connected ? (
        <MicVisualizer stream={stream} active={active} bars={14} />
      ) : (
        <small><Loader2 className="animate-spin" /> connecting</small>
      )}
    </motion.div>
  )
}

function PeerAudio({ stream }: { stream: MediaStream | null }) {
  const ref = useRef<HTMLAudioElement | null>(null)
  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream
      void ref.current.play().catch(() => {})
    }
  }, [stream])
  return <audio ref={ref} autoPlay className="hidden" />
}
