import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { WORLD_COUNTRIES } from '@/data/countries'
import { useVisitorLocation, getCountryFlag } from '@/hooks/useVisitorLocation'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { useAuthStore } from '@/store/authStore'
import { loadOnboardingProfile } from '@/utils/weeklyPlanner'

type Position = [number, number]

type WorldGeometry =
  | { type: 'Polygon'; coordinates: Position[][] }
  | { type: 'MultiPolygon'; coordinates: Position[][][] }

type WorldFeatureCollection = {
  features: Array<{ geometry: WorldGeometry | null }>
}

type GlobeMarkerStyle = CSSProperties & {
  '--globe-marker-x': string
  '--globe-marker-y': string
}

const DEG = Math.PI / 180
const DEFAULT_LONGITUDE = 69.24
const DEFAULT_LATITUDE = 41.3
const UNIVERSITY_PINS: Position[] = [
  [-122.17, 37.43],
  [-0.13, 51.51],
  [103.82, 1.35],
]

function easeOutQuart(value: number) {
  return 1 - (1 - value) ** 4
}

function nearestRotation(from: number, target: number) {
  return from + ((((target - from) % 360) + 540) % 360) - 180
}

function project(longitude: number, latitude: number, rotation: number, cx: number, cy: number, radius: number) {
  const lambda = (longitude - rotation) * DEG
  const phi = latitude * DEG
  const cosPhi = Math.cos(phi)
  const depth = cosPhi * Math.cos(lambda)

  return {
    x: cx + radius * cosPhi * Math.sin(lambda),
    y: cy - radius * Math.sin(phi),
    visible: depth >= -0.015,
    depth,
  }
}

function drawGlobe(
  canvas: HTMLCanvasElement,
  world: WorldFeatureCollection,
  rotation: number,
  origin: Position,
) {
  const bounds = canvas.getBoundingClientRect()
  if (!bounds.width || !bounds.height) return

  // A 1.5x cap keeps the canvas crisp without making the short entrance spin
  // expensive on high-DPI phones and 4K displays.
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5)
  const width = Math.round(bounds.width * pixelRatio)
  const height = Math.round(bounds.height * pixelRatio)
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  ctx.clearRect(0, 0, bounds.width, bounds.height)

  const cx = bounds.width / 2
  const cy = bounds.height / 2
  const radius = Math.min(bounds.width, bounds.height) * 0.425

  ctx.save()
  ctx.shadowColor = 'rgba(100, 116, 139, 0.22)'
  ctx.shadowBlur = radius * 0.16
  ctx.beginPath()
  ctx.arc(cx, cy, radius * 0.985, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(248, 251, 255, 0.7)'
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.beginPath()
  ctx.arc(cx, cy, radius, 0, Math.PI * 2)
  ctx.clip()

  const ocean = ctx.createRadialGradient(
    cx - radius * 0.36,
    cy - radius * 0.42,
    radius * 0.04,
    cx + radius * 0.12,
    cy + radius * 0.08,
    radius * 1.12,
  )
  ocean.addColorStop(0, 'rgba(255, 255, 255, 0.96)')
  ocean.addColorStop(0.42, 'rgba(244, 249, 252, 0.9)')
  ocean.addColorStop(0.76, 'rgba(228, 237, 244, 0.82)')
  ocean.addColorStop(1, 'rgba(211, 222, 232, 0.82)')
  ctx.fillStyle = ocean
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)

  const reflectedGlow = ctx.createRadialGradient(
    cx - radius * 0.72,
    cy + radius * 0.72,
    0,
    cx - radius * 0.72,
    cy + radius * 0.72,
    radius * 1.08,
  )
  reflectedGlow.addColorStop(0, 'rgba(239, 68, 68, 0.38)')
  reflectedGlow.addColorStop(0.42, 'rgba(251, 113, 133, 0.14)')
  reflectedGlow.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = reflectedGlow
  ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2)

  ctx.lineWidth = Math.max(0.55, radius * 0.0022)
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.16)'
  for (const latitude of [-60, -30, 0, 30, 60]) {
    const latitudeRadius = Math.cos(latitude * DEG) * radius
    const y = cy - Math.sin(latitude * DEG) * radius
    ctx.beginPath()
    ctx.ellipse(cx, y, latitudeRadius, latitudeRadius * 0.12, 0, 0, Math.PI * 2)
    ctx.stroke()
  }

  for (let longitude = -150; longitude <= 180; longitude += 30) {
    ctx.beginPath()
    let started = false
    for (let latitude = -90; latitude <= 90; latitude += 4) {
      const point = project(longitude, latitude, rotation, cx, cy, radius)
      if (!point.visible) {
        started = false
        continue
      }
      if (!started) ctx.moveTo(point.x, point.y)
      else ctx.lineTo(point.x, point.y)
      started = true
    }
    ctx.stroke()
  }

  ctx.fillStyle = 'rgba(214, 224, 233, 0.76)'
  ctx.strokeStyle = 'rgba(123, 146, 169, 0.62)'
  ctx.lineWidth = Math.max(0.72, radius * 0.0037)

  const drawPolygon = (rings: Position[][]) => {
    ctx.beginPath()
    for (const ring of rings) {
      let started = false
      for (const [longitude, latitude] of ring) {
        const point = project(longitude, latitude, rotation, cx, cy, radius)
        if (!point.visible) {
          started = false
          continue
        }
        if (!started) ctx.moveTo(point.x, point.y)
        else ctx.lineTo(point.x, point.y)
        started = true
      }
    }
    ctx.fill('evenodd')
    ctx.stroke()
  }

  for (const feature of world.features) {
    const geometry = feature.geometry
    if (!geometry) continue
    if (geometry.type === 'Polygon') drawPolygon(geometry.coordinates)
    else for (const polygon of geometry.coordinates) drawPolygon(polygon)
  }

  const originPoint = project(origin[0], origin[1], rotation, cx, cy, radius)
  ctx.lineCap = 'round'
  for (const [longitude, latitude] of UNIVERSITY_PINS) {
    const destination = project(longitude, latitude, rotation, cx, cy, radius)
    if (!originPoint.visible || !destination.visible) continue

    const controlX = (originPoint.x + destination.x) / 2
    const controlY = Math.min(originPoint.y, destination.y) - radius * 0.16
    ctx.beginPath()
    ctx.moveTo(originPoint.x, originPoint.y)
    ctx.quadraticCurveTo(controlX, controlY, destination.x, destination.y)
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.66)'
    ctx.lineWidth = Math.max(1.2, radius * 0.006)
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(destination.x, destination.y, Math.max(3, radius * 0.014), 0, Math.PI * 2)
    ctx.fillStyle = '#ef4444'
    ctx.shadowColor = 'rgba(239, 68, 68, 0.8)'
    ctx.shadowBlur = radius * 0.045
    ctx.fill()
    ctx.shadowBlur = 0
  }

  ctx.restore()

  const shine = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius)
  shine.addColorStop(0, 'rgba(255, 255, 255, 0.9)')
  shine.addColorStop(0.33, 'rgba(255, 255, 255, 0.14)')
  shine.addColorStop(0.68, 'rgba(255, 255, 255, 0)')
  shine.addColorStop(1, 'rgba(255, 255, 255, 0.34)')
  ctx.beginPath()
  ctx.arc(cx, cy, radius * 0.985, 0, Math.PI * 2)
  ctx.fillStyle = shine
  ctx.fill()
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)'
  ctx.lineWidth = Math.max(1, radius * 0.006)
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(cx, cy, radius * 0.97, 0, Math.PI * 2)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.58)'
  ctx.lineWidth = Math.max(2, radius * 0.014)
  ctx.stroke()
}

export default function UniversityGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const currentRotationRef = useRef(DEFAULT_LONGITUDE - 360)
  const hasSpunRef = useRef(false)
  const [world, setWorld] = useState<WorldFeatureCollection | null>(null)
  const userId = useAuthStore((state) => state.user?.id)
  const { location, isLocating } = useVisitorLocation()
  const { minimalMotion } = useMotionPreferences()

  const profileCountry = useMemo(() => loadOnboardingProfile(userId)?.country?.trim(), [userId])
  const resolvedCountry = location?.country || profileCountry || 'Your country'
  const profileCountryOption = useMemo(
    () => WORLD_COUNTRIES.find((country) => country.name.toLowerCase() === profileCountry?.toLowerCase()),
    [profileCountry],
  )
  const flag = location?.countryCode
    ? getCountryFlag(location.countryCode)
    : profileCountryOption?.flag ?? '🌍'
  const targetLongitude = location?.longitude ?? DEFAULT_LONGITUDE
  const targetLatitude = location?.latitude ?? DEFAULT_LATITUDE
  const markerStyle: GlobeMarkerStyle = {
    '--globe-marker-x': '50%',
    '--globe-marker-y': `${50 - Math.sin(targetLatitude * DEG) * 46}%`,
  }

  useEffect(() => {
    const controller = new AbortController()
    fetch('/assets/countries.geo.json', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('World map could not be loaded')
        return response.json() as Promise<WorldFeatureCollection>
      })
      .then(setWorld)
      .catch(() => undefined)
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !world) return

    const origin: Position = [targetLongitude, targetLatitude]
    const firstSpin = !hasSpunRef.current
    const from = firstSpin ? targetLongitude - 360 : currentRotationRef.current
    const to = firstSpin ? targetLongitude : nearestRotation(from, targetLongitude)
    const duration = minimalMotion ? 1 : firstSpin ? 2600 : 850
    let frame = 0
    let start = 0

    hasSpunRef.current = true
    currentRotationRef.current = from

    const render = (time: number) => {
      if (!start) start = time
      const progress = Math.min(1, (time - start) / duration)
      const rotation = from + (to - from) * easeOutQuart(progress)
      currentRotationRef.current = rotation
      drawGlobe(canvas, world, rotation, origin)
      if (progress < 1) frame = window.requestAnimationFrame(render)
    }

    frame = window.requestAnimationFrame(render)
    const observer = new ResizeObserver(() => drawGlobe(canvas, world, currentRotationRef.current, origin))
    observer.observe(canvas)

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [minimalMotion, targetLatitude, targetLongitude, world])

  return (
    <motion.figure
      className="university-globe-card"
      initial={{ opacity: 0, scale: 0.92, x: minimalMotion ? 0 : -28 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ duration: minimalMotion ? 0.01 : 0.72, ease: [0.16, 1, 0.3, 1] }}
      aria-label={`Animated university globe focused on ${resolvedCountry}`}
    >
      <div className="university-globe-visual">
        <img
          src="/assets/university-globe-glass-clean.png"
          alt=""
          className={`university-globe-reference-image ${world ? 'university-globe-reference-image-hidden' : ''}`}
          draggable={false}
          decoding="async"
        />
        <canvas ref={canvasRef} className="university-globe-canvas" aria-hidden="true" />

        <motion.span
          className="university-globe-user-marker"
          style={markerStyle}
          initial={{ opacity: 0, scale: 0.3, y: -16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: minimalMotion ? 0.01 : 0.45, delay: minimalMotion ? 0 : 2.35, ease: [0.16, 1, 0.3, 1] }}
          aria-hidden="true"
        >
          <span className="university-globe-user-marker-ring" />
          <span className="university-globe-user-marker-pin">
            <MapPin />
          </span>
          <span className="university-globe-country-readout">
            <span aria-hidden="true">{flag}</span>
            <span>{isLocating && !profileCountry ? 'Locating you…' : resolvedCountry}</span>
          </span>
        </motion.span>
      </div>
    </motion.figure>
  )
}
