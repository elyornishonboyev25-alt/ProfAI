import { useEffect, useRef } from 'react'

// Live microphone activity bars are updated directly on their DOM nodes. Keeping
// this high-frequency visual outside React prevents a full component render on
// every animation frame while preserving the same analyser-driven feedback.
export default function MicVisualizer({
  stream,
  active,
  bars = 28,
}: {
  stream: MediaStream | null
  active: boolean
  bars?: number
}) {
  const barRefs = useRef<Array<HTMLSpanElement | null>>([])
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const resetBars = () => {
      for (const bar of barRefs.current) {
        if (bar) bar.style.height = '8%'
      }
    }

    if (!active || !stream) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      resetBars()
      return
    }

    const AudioCtx =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return

    const context = new AudioCtx()
    const analyser = context.createAnalyser()
    analyser.fftSize = 64
    analyser.smoothingTimeConstant = 0.8
    const source = context.createMediaStreamSource(stream)
    source.connect(analyser)
    const data = new Uint8Array(analyser.frequencyBinCount)
    let lastPaint = 0

    const tick = (now: number) => {
      if (now - lastPaint >= 33) {
        analyser.getByteFrequencyData(data)
        for (let index = 0; index < bars; index += 1) {
          const dataIndex = Math.floor((index / bars) * data.length)
          const level = Math.max(0.08, data[dataIndex] / 255)
          const bar = barRefs.current[index]
          if (bar) bar.style.height = `${Math.round(level * 100)}%`
        }
        lastPaint = now
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
      try {
        source.disconnect()
        analyser.disconnect()
      } catch {
        // The browser may already have disconnected a stopped stream.
      }
      void context.close().catch(() => {})
    }
  }, [active, stream, bars])

  return (
    <div className="flex h-14 items-center justify-center gap-[3px]" aria-hidden>
      {Array.from({ length: bars }, (_, index) => (
        <span
          key={index}
          ref={(element) => {
            barRefs.current[index] = element
          }}
          className={`w-[3px] rounded-full transition-[height,background-color] duration-75 ${
            active ? 'bg-gradient-to-t from-red-500 to-rose-400' : 'bg-slate-300'
          }`}
          style={{ height: '8%', minHeight: 4 }}
        />
      ))}
    </div>
  )
}
