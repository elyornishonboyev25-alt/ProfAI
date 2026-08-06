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

const WIDTH = 640
const HEIGHT = 650
const CENTER_X = 320
const CENTER_Y = 292
const GLOBE_RADIUS = 258
const MAP_X = 1.38
const MAP_Y = 2.12

function project([longitude, latitude]: Coordinate) {
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
  const midY = (start.y + end.y) / 2 - Math.min(92, 32 + distance * 0.14)
  return `M ${start.x.toFixed(1)} ${start.y.toFixed(1)} Q ${midX.toFixed(1)} ${midY.toFixed(1)} ${end.x.toFixed(1)} ${end.y.toFixed(1)}`
}

export default function UniversityGlobe({
  location,
  isLocating,
  locationError,
  onRequestPreciseLocation,
}: UniversityGlobeProps) {
  const origin: Coordinate = location ? [location.longitude, location.latitude] : [69.2401, 41.2995]
  const marker = project(origin)
  const locationLabel = location?.country ?? (isLocating ? 'Finding your country…' : 'Location unavailable')
  const flag = location ? getCountryFlag(location.countryCode) : '🌍'
  const precisionLabel = location?.precision === 'device'
    ? 'Precise device location'
    : location?.precision === 'network'
      ? 'Approximate network location'
      : 'Use the target button'
  const countryFontSize = locationLabel.length > 20 ? 21 : locationLabel.length > 14 ? 25 : 30

  return (
    <motion.div
      className="university-globe-card"
      initial={{ opacity: 0, scale: 0.84, rotate: -8, x: -44 }}
      animate={{ opacity: 1, scale: 1, rotate: 0, x: 0 }}
      transition={{ duration: 1.25, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="university-globe-kicker">
        <Navigation className="h-3.5 w-3.5" />
        From your country to the world
      </div>
      <span className="university-globe-red-haze" aria-hidden="true" />

      <svg
        className="university-globe-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Animated university destinations from ${locationLabel}`}
      >
        <defs>
          <radialGradient id="globeSurface" cx="34%" cy="22%" r="78%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
            <stop offset="42%" stopColor="#f5fbff" stopOpacity="0.74" />
            <stop offset="76%" stopColor="#d9e7f0" stopOpacity="0.62" />
            <stop offset="100%" stopColor="#a9bdcc" stopOpacity="0.7" />
          </radialGradient>
          <linearGradient id="landGlass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f8fcff" stopOpacity="0.72" />
            <stop offset="55%" stopColor="#d4e2ec" stopOpacity="0.62" />
            <stop offset="100%" stopColor="#9eb2c2" stopOpacity="0.68" />
          </linearGradient>
          <linearGradient id="routeRed" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fb7185" stopOpacity="0.46" />
            <stop offset="45%" stopColor="#ef4444" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0.62" />
          </linearGradient>
          <linearGradient id="pinRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="42%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>
          <filter id="globeShadow" x="-35%" y="-35%" width="170%" height="190%">
            <feDropShadow dx="0" dy="24" stdDeviation="22" floodColor="#64748b" floodOpacity="0.2" />
          </filter>
          <filter id="landEmboss" x="-20%" y="-20%" width="140%" height="150%">
            <feDropShadow dx="0" dy="3" stdDeviation="2.2" floodColor="#64748b" floodOpacity="0.32" />
            <feDropShadow dx="-1" dy="-2" stdDeviation="1.2" floodColor="#ffffff" floodOpacity="0.9" />
          </filter>
          <filter id="pinGlow" x="-150%" y="-150%" width="400%" height="400%">
            <feDropShadow dx="0" dy="8" stdDeviation="9" floodColor="#ef4444" floodOpacity="0.68" />
          </filter>
          <clipPath id="globeClip">
            <circle cx={CENTER_X} cy={CENTER_Y} r={GLOBE_RADIUS} />
          </clipPath>
        </defs>

        <ellipse cx={CENTER_X} cy="574" rx="205" ry="24" fill="#64748b" opacity="0.1" />
        <g filter="url(#globeShadow)" className="university-globe-drift">
          <circle cx={CENTER_X} cy={CENTER_Y} r={GLOBE_RADIUS} fill="url(#globeSurface)" stroke="#c8d8e4" strokeWidth="2.2" />
          <g clipPath="url(#globeClip)">
            <circle cx={CENTER_X} cy={CENTER_Y} r={GLOBE_RADIUS} fill="#fff" opacity="0.08" />
            <ellipse cx="205" cy="122" rx="230" ry="86" fill="#fff" opacity="0.44" transform="rotate(-16 205 122)" />
            <ellipse cx="485" cy="415" rx="135" ry="195" fill="#94a3b8" opacity="0.08" transform="rotate(-22 485 415)" />

            <g className="university-globe-grid" fill="none" stroke="#91a7b8" strokeWidth="1">
              <ellipse cx={CENTER_X} cy={CENTER_Y} rx={GLOBE_RADIUS} ry="82" />
              <ellipse cx={CENTER_X} cy={CENTER_Y} rx={GLOBE_RADIUS} ry="164" />
              <ellipse cx={CENTER_X} cy={CENTER_Y} rx="90" ry={GLOBE_RADIUS} />
              <ellipse cx={CENTER_X} cy={CENTER_Y} rx="180" ry={GLOBE_RADIUS} />
              <path d={`M${CENTER_X - GLOBE_RADIUS} ${CENTER_Y} H${CENTER_X + GLOBE_RADIUS}`} />
            </g>

            <g className="university-globe-land" filter="url(#landEmboss)">
              {LAND_MASSES.map((mass, index) => (
                <path key={index} d={landPath(mass)} fill="url(#landGlass)" stroke="#8fa6b8" strokeWidth="1.9" strokeLinejoin="round" />
              ))}
            </g>

            {location && (
              <g className="university-route-layer">
                {UNIVERSITY_HUBS.map((hub, index) => (
                  <path
                    key={hub.name}
                    d={routePath(origin, hub.coordinate)}
                    className="university-route"
                    style={{ animationDelay: `${0.4 + index * 0.22}s, ${1.8 + index * 0.22}s` }}
                  />
                ))}
              </g>
            )}
          </g>

          {UNIVERSITY_HUBS.map((hub, index) => {
            const endpoint = project(hub.coordinate)
            return (
              <g key={hub.name} transform={`translate(${endpoint.x} ${endpoint.y})`} filter="url(#pinGlow)">
                <circle r="14" fill="#ef4444" opacity="0.2" className="university-hub-pulse" style={{ animationDelay: `${index * 0.45}s` }} />
                <g className="university-destination-pin" style={{ animationDelay: `${index * 0.32}s` }}>
                  <path d="M0 15 C-15 -4 -18 -15 -18 -25 A18 18 0 1 1 18 -25 C18 -15 15 -4 0 15Z" fill="url(#pinRed)" stroke="#fecaca" strokeWidth="2.5" />
                  <circle cy="-25" r="7" fill="#fff" opacity="0.94" />
                  <ellipse cy="-31" rx="8" ry="4" fill="#fff" opacity="0.34" />
                </g>
              </g>
            )
          })}

          {location && (
            <g transform={`translate(${marker.x} ${marker.y})`} filter="url(#pinGlow)">
              <circle r="12" fill="#ef4444" opacity="0.2" className="university-origin-radar" />
              <circle r="6.5" fill="#ef4444" stroke="#fff" strokeWidth="2.5" />
            </g>
          )}

          <g className="university-country-name" aria-hidden="true">
            <text x={CENTER_X} y={CENTER_Y + 112} textAnchor="middle" style={{ fontSize: countryFontSize }}>
              {locationLabel}
            </text>
            {location?.city && (
              <text x={CENTER_X} y={CENTER_Y + 138} textAnchor="middle" className="university-country-city">
                {location.city}
              </text>
            )}
          </g>
          <circle cx={CENTER_X} cy={CENTER_Y} r={GLOBE_RADIUS - 1} fill="none" stroke="#fff" strokeWidth="4" opacity="0.66" />
        </g>
      </svg>

      <div className="university-location-panel" aria-live="polite">
        <div className="university-location-icon" aria-hidden="true">{flag}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[9px] font-bold uppercase tracking-[0.16em] text-red-500">
            {isLocating ? 'Locating…' : 'Your location'}
          </p>
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
      {locationError && <p className="university-location-note">{locationError}</p>}
    </motion.div>
  )
}
