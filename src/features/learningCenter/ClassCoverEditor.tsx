import { useEffect, useRef, useState } from 'react'
import { Camera, Check, Move, ZoomIn } from 'lucide-react'
import { COVER_RATIO, coverCrop, drawCoverCrop, exportCoverCrop } from '@/utils/imageCompress'
import { secondaryButton } from './components'

type Props = {
  value: string | null
  onChange: (value: string | null) => void
  onPendingChange: (pending: boolean) => void
  onError: (message: string) => void
}

export default function ClassCoverEditor({ value, onChange, onPendingChange, onError }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragRef = useRef<{ x: number; y: number; centerX: number; centerY: number } | null>(null)
  const [sourceUrl, setSourceUrl] = useState<string | null>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [centerX, setCenterX] = useState(0.5)
  const [centerY, setCenterY] = useState(0.5)
  const [zoom, setZoom] = useState(1)
  const [pending, setPending] = useState(false)

  useEffect(() => onPendingChange(pending), [onPendingChange, pending])

  useEffect(() => {
    if (!sourceUrl) return
    let active = true
    const selected = new Image()
    selected.onload = () => {
      if (!active) return
      setImage(selected)
      try {
        onChange(exportCoverCrop(selected, 0.5, 0.5, 1))
        setPending(false)
      } catch (error) { onError(error instanceof Error ? error.message : 'Could not prepare photo.') }
    }
    selected.onerror = () => { if (active) { onError('Could not open this photo.'); setPending(false) } }
    selected.src = sourceUrl
    return () => { active = false; URL.revokeObjectURL(sourceUrl) }
  }, [sourceUrl, onChange, onError])

  useEffect(() => {
    if (image && canvasRef.current) drawCoverCrop(canvasRef.current, image, centerX, centerY, zoom)
  }, [image, centerX, centerY, zoom])

  function choose(file?: File) {
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) { onError('Choose a PNG, JPEG or WEBP image.'); return }
    onError('')
    setImage(null)
    setCenterX(0.5); setCenterY(0.5); setZoom(1)
    setPending(true)
    setSourceUrl(URL.createObjectURL(file))
    if (inputRef.current) inputRef.current.value = ''
  }

  function move(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!dragRef.current || !image) return
    const rect = event.currentTarget.getBoundingClientRect()
    const crop = coverCrop(image, centerX, centerY, zoom)
    setCenterX(Math.max(0, Math.min(1, dragRef.current.centerX - (event.clientX - dragRef.current.x) * crop.width / rect.width / image.naturalWidth)))
    setCenterY(Math.max(0, Math.min(1, dragRef.current.centerY - (event.clientY - dragRef.current.y) * crop.height / rect.height / image.naturalHeight)))
    setPending(true)
  }

  function apply() {
    if (!image) return
    try { onChange(exportCoverCrop(image, centerX, centerY, zoom)); setPending(false) }
    catch (error) { onError(error instanceof Error ? error.message : 'Could not prepare photo.') }
  }

  return <div className="lc-cover-editor">
    <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Choose class cover photo" onChange={(event) => choose(event.target.files?.[0])} />
    {image ? <>
      <canvas ref={canvasRef} width={1440} height={560} className="lc-cover-canvas" style={{ aspectRatio: String(COVER_RATIO) }} aria-label="Class cover crop preview. Drag to reposition." onPointerDown={(event) => { dragRef.current = { x: event.clientX, y: event.clientY, centerX, centerY }; event.currentTarget.setPointerCapture(event.pointerId) }} onPointerMove={move} onPointerUp={() => { dragRef.current = null }} onPointerCancel={() => { dragRef.current = null }} />
      <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500"><Move className="h-3.5 w-3.5" /> Drag the photo to choose what appears in the banner.</p>
      <label className="mt-3 flex items-center gap-3 text-xs font-semibold text-slate-600"><ZoomIn className="h-4 w-4" /> Zoom <input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => { setZoom(Number(event.target.value)); setPending(true) }} className="min-w-0 flex-1 accent-red-700" aria-label="Cover photo zoom" /><span>{Math.round(zoom * 100)}%</span></label>
      <div className="mt-2 grid gap-2 sm:grid-cols-2"><label className="flex items-center gap-2 text-xs font-semibold text-slate-600">Horizontal <input type="range" min="0" max="1" step="0.01" value={centerX} onChange={(event) => { setCenterX(Number(event.target.value)); setPending(true) }} className="min-w-0 flex-1 accent-red-700" /></label><label className="flex items-center gap-2 text-xs font-semibold text-slate-600">Vertical <input type="range" min="0" max="1" step="0.01" value={centerY} onChange={(event) => { setCenterY(Number(event.target.value)); setPending(true) }} className="min-w-0 flex-1 accent-red-700" /></label></div>
      <div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={apply} disabled={!pending} className={secondaryButton}><Check className="h-4 w-4" />{pending ? 'Apply crop' : 'Crop applied'}</button><button type="button" onClick={() => inputRef.current?.click()} className={secondaryButton}>Choose another photo</button><button type="button" onClick={() => { setSourceUrl(null); setImage(null); setPending(false); onChange(null) }} className="px-3 text-sm font-semibold text-red-700">Remove photo</button></div>
    </> : <>
      <button type="button" onClick={() => inputRef.current?.click()} className="lc-cover-picker">{value ? <img src={value} alt="Class cover preview" /> : <><Camera className="h-6 w-6" /> Choose a photo</>}</button>
      {value && <div className="mt-2 flex gap-3"><button type="button" onClick={() => inputRef.current?.click()} className="text-sm font-semibold text-red-700">Change and adjust crop</button><button type="button" onClick={() => onChange(null)} className="text-sm font-semibold text-slate-500">Remove photo</button></div>}
    </>}
  </div>
}
