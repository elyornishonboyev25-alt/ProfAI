import { animate, motion, useReducedMotion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

/** Every scene is drawn on a fixed 960×600 canvas and scaled like a video frame. */
export const CANVAS_W = 960
export const CANVAS_H = 600
/** The demo cursor reaches its target and clicks this long after a step starts. */
export const CLICK_MS = 950
export const EASE = [0.22, 1, 0.36, 1] as const

export type SceneProps = { step: number; acted: boolean; playing: boolean }

/** True once the timeline has reached `target` and the cursor has clicked it. */
export const reached = ({ step, acted }: SceneProps, target: number) => step > target || (step === target && acted)
/** True only while `target` is the current, clicked step. */
export const focused = ({ step, acted }: SceneProps, target: number) => step === target && acted

/** Counts whole seconds while the demo plays. */
export function useTick(playing: boolean, ms = 1000) {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => setTick(value => value + 1), ms)
    return () => window.clearInterval(timer)
  }, [ms, playing])
  return tick
}

/** A number that eases to its value without re-rendering React on every frame. */
export function Num({ value, from = 0, duration = 1.3, decimals = 0, prefix = '', suffix = '', replay }: { value: number; from?: number; duration?: number; decimals?: number; prefix?: string; suffix?: string; replay?: unknown }) {
  const ref = useRef<HTMLSpanElement>(null)
  const reducedMotion = useReducedMotion()
  const format = (current: number) => `${prefix}${current.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${suffix}`
  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (reducedMotion) { node.textContent = format(value); return }
    const controls = animate(from, value, { duration, ease: EASE, onUpdate: current => { node.textContent = format(current) } })
    return () => controls.stop()
  }, [value, from, duration, decimals, replay, reducedMotion])
  return <span ref={ref}>{format(reducedMotion ? value : from)}</span>
}

/** Types `text` once `active` turns on; shows it whole once `done`. */
export function Typed({ text, active, done = false, speed = 34, delay = 0, caret = true }: { text: string; active: boolean; done?: boolean; speed?: number; delay?: number; caret?: boolean }) {
  const reducedMotion = useReducedMotion()
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (done || reducedMotion) { setCount(text.length); return }
    if (!active) { setCount(0); return }
    setCount(0)
    let timer = 0
    const begin = window.setTimeout(() => {
      timer = window.setInterval(() => setCount(value => {
        if (value >= text.length) { window.clearInterval(timer); return value }
        return value + 1
      }), speed)
    }, delay)
    return () => { window.clearTimeout(begin); window.clearInterval(timer) }
  }, [active, delay, done, reducedMotion, speed, text])
  const typing = active && !done && count < text.length
  return <>{text.slice(0, count)}{caret && typing && <i className="lxd-caret" />}</>
}

/** A progress ring drawn with a single dash, animated from empty on each replay. */
export function Ring({ value, size, stroke, track = 'rgba(124, 132, 146, .2)', color = 'url(#lxd-red)', replay, delay = 0, className }: { value: number; size: number; stroke: number; track?: string; color?: string; replay?: unknown; delay?: number; className?: string }) {
  const reducedMotion = useReducedMotion()
  const radius = (size - stroke) / 2
  return <svg className={className} width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
    <defs>
      <linearGradient id="lxd-red" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#ff4d67" /><stop offset="55%" stopColor="#df0030" /><stop offset="100%" stopColor="#9e0420" /></linearGradient>
    </defs>
    <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={track} strokeWidth={stroke} />
    <motion.circle key={String(replay)} cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" pathLength={100} strokeDasharray="100 100" transform={`rotate(-90 ${size / 2} ${size / 2})`}
      initial={{ strokeDashoffset: reducedMotion ? 100 - value : 100 }} animate={{ strokeDashoffset: 100 - value }} transition={{ duration: reducedMotion ? 0 : 1.4, delay, ease: EASE }} />
  </svg>
}

/** Small animated equaliser used by audio, voice and recording states. */
export function Wave({ bars = 14, live, className = '' }: { bars?: number; live: boolean; className?: string }) {
  return <span className={`lxd-wave ${live ? 'is-live' : ''} ${className}`} aria-hidden="true">
    {Array.from({ length: bars }, (_, index) => <i key={index} style={{ animationDelay: `${(index * 137) % 900 * -1}ms`, height: `${30 + ((index * 53) % 60)}%` }} />)}
  </span>
}
