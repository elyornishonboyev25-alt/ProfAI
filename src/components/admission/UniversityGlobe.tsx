import { motion } from 'framer-motion'
import { LocateFixed, MapPin, Navigation } from 'lucide-react'
import { getCountryFlag, type VisitorLocation } from '@/hooks/useVisitorLocation'

interface UniversityGlobeProps {
  location: VisitorLocation | null
  isLocating: boolean
  locationError: string | null
  onRequestPreciseLocation: () => void
}

type Coordinate = readonly [longitude: number, latitude: number]

const LAND_MASSES: Coordinate[][] = [
  [[-168, 71], [-145, 70], [-126, 57], [-131, 50], [-124, 40], [-116, 31], [-105, 23], [-96, 17], [-86, 19], [-82, 26], [-79, 35], [-66, 45], [-56, 53], [-74, 59], [-96, 70], [-124, 73]],
  [[-81, 12], [-69, 9], [-50, 12], [-35, -5], [-41, -24], [-55, -52], [-69, -55], [-75, -35], [-80, -10]],
  [[-53, 59], [-45, 61], [-24, 78], [-42, 83], [-65, 75]],
  [[-11, 36], [1, 44], [-8, 56], [-4, 70], [20, 71], [36, 60], [40, 48], [29, 38], [14, 35]],
  [[-17, 35], [10, 37], [32, 31], [45, 12], [40, -15], [25, -35], [10, -35], [-5, -20], [-15, 5]],
  [[30, 70], [70, 78], [110, 70], [145, 57], [178, 51], [169, 37], [140, 30], [125, 10], [105, 5], [85, 20], [70, 25], [55, 15], [40, 35], [35, 55]],
  [[112, -10], [132, -12], [153, -27], [146, -40], [122, -34], [113, -23]],
  [[47, -13], [51, -16], [49, -26], [44, -20]],
  [[130, 33], [136, 36], [143, 44], [145, 39], [139, 34]],
  [[166, -35], [176, -38], [178, -47], [168, -46]],
]

const UNIVERSITY_HUBS = [
  { name: 'Boston', coordinate: [-71.09, 42.36] as Coordinate },
  { name: 'London', coordinate: [-0.18, 51.5] as Coordinate },
  { name: 'Singapore', coordinate: [103.78, 1.3] as Coordinate },
]

const WIDTH = 600
const HEIGHT = 530
const CENTER_X = 300
const CENTER_Y = 250
const MAP_X = 1.22
const MAP_Y = 1.93

function project([longitude, latitude]: Coordinate) {
  // Compress longitudes toward the poles so every real coordinate remains
  // inside the spherical silhouette while preserving its geographic position.
  const polarCompression = Math.cos((latitude * Math.PI / 180) * 0.6)
  return {
    x: CENTER_X + longitude * MAP_X * polarCompression,
    y: CENTER_Y - latitude * MAP_Y,
  }
}

function landPath(points: Coordinate[]) {
  return points.map((point, index) => {
    const { x, y } = project(point)
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ') + ' Z'
}

function routePath(from: Coordinate, to: Coordinate) {
  const start = project(from)
  const end = project(to)
  const midX = (start.x + end.x) / 2
  const distance = Math.hypot(end.x - start.x, end.y - start.y)
  const midY = (start.y + end.y) / 2 - Math.min(76, 24 + distance * 0.12)
  return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`
}

export default function UniversityGlobe({
  location,
  isLocating,
  locationError,
  onRequestPreciseLocation,
}: UniversityGlobeProps) {
  const origin: Coordinate = location
    ? [location.longitude, location.latitude]
    : [69.2401, 41.2995]
  const marker = project(origin)
  const locationLabel = location?.country ?? (isLocating ? 'Finding your country…' : 'Location unavailable')
  const flag = location ? getCountryFlag(location.countryCode) : '🌍'
  const precisionLabel = location?.precision === 'device'
    ? 'Precise device location'
    : location?.precision === 'network'
      ? 'Approximate network location'
      : 'Use the location button'

  return (
    <motion.div
      className="university-globe-card"
      initial={{ opacity: 0, scale: 0.88, rotate: -7, x: 28 }}
      animate={{ opacity: 1, scale: 1, rotate: 0, x: 0 }}
      transition={{ duration: 1.15, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="university-globe-kicker">
        <Navigation className="h-3.5 w-3.5" />
        Your global starting point
      </div>

      <svg
        className="university-globe-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Animated university destinations from ${locationLabel}`}
      >
        <defs>
          <radialGradient id="globeSurface" cx="36%" cy="25%" r="76%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="48%" stopColor="#eef6fb" stopOpacity="0.87" />
            <stop offset="82%" stopColor="#cedde8" stopOpacity="0.76" />
            <stop offset="100%" stopColor="#aebfcd" stopOpacity="0.7" />
          </radialGradient>
          <linearGradient id="landGlass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#eff7fc" />
            <stop offset="100%" stopColor="#aebfcd" />
          </linearGradient>
          <linearGradient id="routeRed" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fb7185" stopOpacity="0.45" />
            <stop offset="45%" stopColor="#ef4444" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0.5" />
          </linearGradient>
          <filter id="globeShadow" x="-30%" y="-30%" width="160%" height="180%">
            <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#881337" floodOpacity="0.18" />
          </filter>
          <filter id="pinGlow" x="-120%" y="-120%" width="340%" height="340%">
            <feDropShadow dx="0" dy="5" stdDeviation="7" floodColor="#ef4444" floodOpacity="0.72" />
          </filter>
          <clipPath id="globeClip">
            <circle cx={CENTER_X} cy={CENTER_Y} r="226" />
          </clipPath>
        </defs>

        <ellipse cx="300" cy="477" rx="166" ry="19" fill="#be123c" opacity="0.09" />
        <g filter="url(#globeShadow)" className="university-globe-drift">
          <circle cx={CENTER_X} cy={CENTER_Y} r="226" fill="url(#globeSurface)" stroke="#dbe7ef" strokeWidth="2" />
          <g clipPath="url(#globeClip)">
            <ellipse cx="190" cy="111" rx="195" ry="74" fill="#fff" opacity="0.38" transform="rotate(-15 190 111)" />

            <g className="university-globe-grid" fill="none" stroke="#9db2c2" strokeWidth="1">
              <ellipse cx={CENTER_X} cy={CENTER_Y} rx="226" ry="70" />
              <ellipse cx={CENTER_X} cy={CENTER_Y} rx="226" ry="142" />
              <ellipse cx={CENTER_X} cy={CENTER_Y} rx="80" ry="226" />
              <ellipse cx={CENTER_X} cy={CENTER_Y} rx="158" ry="226" />
              <path d="M74 250 H526" />
            </g>

            <g className="university-globe-land">
              {LAND_MASSES.map((mass, index) => (
                <path key={index} d={landPath(mass)} fill="url(#landGlass)" stroke="#8ca3b5" strokeWidth="1.7" strokeLinejoin="round" />
              ))}
            </g>

            {location && (
              <g className="university-route-layer">
                {UNIVERSITY_HUBS.map((hub, index) => {
                  const endpoint = project(hub.coordinate)
                  return (
                    <g key={hub.name}>
                      <path
                        d={routePath(origin, hub.coordinate)}
                        className="university-route"
                        style={{ animationDelay: `${0.42 + index * 0.24}s, ${1.8 + index * 0.24}s` }}
                      />
                      <circle cx={endpoint.x} cy={endpoint.y} r="4" fill="#fff" stroke="#ef4444" strokeWidth="2" />
                      <circle cx={endpoint.x} cy={endpoint.y} r="9" fill="none" stroke="#fb7185" opacity="0.34" className="university-hub-pulse" style={{ animationDelay: `${index * 0.45}s` }} />
                    </g>
                  )
                })}
              </g>
            )}
          </g>

          {location && (
            <g transform={`translate(${marker.x} ${marker.y})`} filter="url(#pinGlow)">
              <g className="university-origin-marker">
                <circle r="15" fill="#ef4444" opacity="0.16" className="university-origin-radar" />
                <path d="M0 7 C-10 -5 -12 -12 -12 -18 A12 12 0 1 1 12 -18 C12 -12 10 -5 0 7Z" fill="#dc2626" stroke="#fff" strokeWidth="2" />
                <circle cy="-18" r="4.5" fill="#fff" />
              </g>
            </g>
          )}
          <circle cx={CENTER_X} cy={CENTER_Y} r="225" fill="none" stroke="#fff" strokeWidth="3" opacity="0.72" />
        </g>
      </svg>

      <div className="university-location-panel" aria-live="polite">
        <div className="university-location-icon" aria-hidden="true">{flag}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-red-500">
            {isLocating ? 'Locating…' : 'Your country'}
          </p>
          <p className="truncate text-base font-black tracking-tight text-slate-900">{locationLabel}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-[10px] font-semibold text-slate-500">
            <MapPin className="h-3 w-3 shrink-0 text-red-500" />
            {location?.city ? `${location.city} · ` : ''}{precisionLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={onRequestPreciseLocation}
          disabled={isLocating}
          className="university-locate-btn"
          aria-label="Use precise device location"
          title="Use precise device location"
        >
          <LocateFixed className={`h-4 w-4 ${isLocating ? 'animate-pulse' : ''}`} />
        </button>
      </div>
      {locationError && <p className="university-location-note">{locationError} The current map location is unchanged.</p>}
    </motion.div>
  )
}
