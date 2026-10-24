import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Pause, Play } from 'lucide-react'
import { type ComponentType, type CSSProperties, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CANVAS_W, CLICK_MS, EASE, type SceneProps } from './primitives'
import { ListeningScene, MocksScene, ReadingScene, SatScene, SpeakingScene, WritingScene } from './scenesExam'
import { AdmissionsScene, DashboardScene, NovaScene, PodcastScene, VocabularyScene } from './scenesApp'

/** Live, coded product scenes keyed by tour feature id. */
export const demoScenes: Record<string, ComponentType<SceneProps>> = {
  dashboard: DashboardScene,
  reading: ReadingScene,
  listening: ListeningScene,
  writing: WritingScene,
  speaking: SpeakingScene,
  mocks: MocksScene,
  sat: SatScene,
  vocabulary: VocabularyScene,
  nova: NovaScene,
  'listen-speak': PodcastScene,
  admissions: AdmissionsScene,
}

/** One beat of a demo: which scene, which of its steps, and where the cursor clicks (canvas %). */
export type DemoClip = { scene: string; step: number; x: number; y: number; label: string; title: string; body: string; address: string }

/** Plays clips one after another while `active`; seeking restarts the clip. */
export function useDemoTimeline(count: number, active: boolean, stepMs: number) {
  const reducedMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [nonce, setNonce] = useState(0)
  const [wantsPlay, setWantsPlay] = useState(!reducedMotion)
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || !document.hidden)
  useEffect(() => {
    const update = () => setVisible(!document.hidden)
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [])
  const playing = active && wantsPlay && visible
  useEffect(() => {
    if (!playing) return
    const timer = window.setTimeout(() => setIndex(value => (value + 1) % count), stepMs)
    return () => window.clearTimeout(timer)
  }, [count, index, nonce, playing, stepMs])
  return {
    index,
    nonce,
    playing,
    seek: (next: number) => { setIndex(next); setNonce(value => value + 1) },
    toggle: () => setWantsPlay(value => !value),
  }
}

const seconds = (value: number) => `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}`

type PlayerProps = {
  clips: DemoClip[]
  index: number
  nonce: number
  playing: boolean
  stepMs: number
  onSeek: (index: number) => void
  onToggle: () => void
  subtitles?: boolean
  chapterLabels?: boolean
  className?: string
  label: string
  style?: CSSProperties
}

/** A browser-framed "video" of the real product: coded scenes, a moving cursor and video controls. */
export function DemoPlayer({ clips, index, nonce, playing, stepMs, onSeek, onToggle, subtitles = false, chapterLabels = false, className = '', label, style }: PlayerProps) {
  const reducedMotion = useReducedMotion()
  const viewport = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  const [acted, setActed] = useState(!!reducedMotion)
  const [inClip, setInClip] = useState(0)
  const clip = clips[index]
  const Scene = demoScenes[clip.scene]

  useLayoutEffect(() => {
    const node = viewport.current
    if (!node) return
    const update = () => setScale(node.clientWidth / CANVAS_W)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  // The cursor travels first; the scene reacts once it "clicks".
  useEffect(() => {
    if (reducedMotion) { setActed(true); return }
    setActed(false)
    const timer = window.setTimeout(() => setActed(true), CLICK_MS)
    return () => window.clearTimeout(timer)
  }, [index, nonce, reducedMotion])
  useEffect(() => { setInClip(0) }, [index, nonce])
  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => setInClip(value => Math.min(value + 1, Math.floor(stepMs / 1000))), 1000)
    return () => window.clearInterval(timer)
  }, [playing, stepMs, index, nonce])

  const total = (clips.length * stepMs) / 1000
  const elapsed = (index * stepMs) / 1000 + inClip
  return <div className={`lxd-frame ${playing ? 'is-playing' : 'is-paused'} ${className}`} style={style}>
    <div className="lx-browser-bar" aria-hidden="true"><span /><span /><span /><em>{clip.address}</em><b className="lxd-live"><i />{playing ? 'LIVE DEMO' : 'PAUSED'}</b></div>
    <div ref={viewport} className="lxd-viewport">
      <div className="lxd-canvas" style={{ transform: `scale(${scale})`, opacity: scale ? 1 : 0 }} role="img" aria-label={`${label}: ${clip.title}. ${clip.body}`}>
        <AnimatePresence initial={false}>
          <motion.div key={clip.scene} className="lxd-scene-wrap" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .985 }} transition={{ duration: .7, ease: EASE }}>
            <Scene step={clip.step} acted={acted} playing={playing} />
          </motion.div>
        </AnimatePresence>
      </div>
      {!reducedMotion && <motion.div className="lxd-cursor" aria-hidden="true" initial={false} animate={{ left: `${clip.x}%`, top: `${clip.y}%` }} transition={{ duration: .85, ease: [0.45, 0, 0.2, 1] }}>
        <motion.svg key={`${index}-${nonce}`} viewBox="0 0 24 24" initial={{ scale: 1 }} animate={{ scale: [1, 1, .78, 1] }} transition={{ duration: CLICK_MS / 1000 + .25, times: [0, .78, .86, 1] }}><path d="M4 2.5 L19.5 12.6 L12.4 13.7 L8.6 20.6 Z" /></motion.svg>
        {acted && <span key={`click-${index}-${nonce}`} className="lxd-click" />}
      </motion.div>}
      <div className="lxd-scrim" aria-hidden="true" />
      {subtitles && <AnimatePresence mode="wait"><motion.div key={`${index}-${nonce}`} className="lxd-subtitle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: .45, ease: EASE }}>
        <strong>{clip.title}</strong><span>{clip.body}</span>
      </motion.div></AnimatePresence>}
      <div className="lxd-controls">
        <button type="button" className="lxd-play" onClick={onToggle} aria-label={playing ? 'Pause demo' : 'Play demo'}>{playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}</button>
        <span className="lxd-segments">{clips.map((item, itemIndex) => <button key={itemIndex} type="button" onClick={() => onSeek(itemIndex)} className={`lxd-seg ${itemIndex < index ? 'is-done' : itemIndex === index ? 'is-active' : ''}`} aria-label={item.label} aria-current={itemIndex === index ? 'step' : undefined}>
          <i key={itemIndex === index ? `${index}-${nonce}` : 'idle'} style={{ animationDuration: `${stepMs}ms` }} />
          {chapterLabels && <small>{item.label}</small>}
        </button>)}</span>
        <span className="lxd-time">{seconds(elapsed)} / {seconds(total)}</span>
      </div>
    </div>
  </div>
}
