import { motion } from 'framer-motion'
import type { VisitorLocation } from '@/hooks/useVisitorLocation'

interface UniversityGlobeProps {
  location: VisitorLocation | null
  isLocating: boolean
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
}: UniversityGlobeProps) {
  const origin: Coordinate = location ? [location.longitude, location.latitude] : [69.2401, 41.2995]
  const marker = project(origin)
  const locationLabel = location?.country ?? (isLocating ? 'Finding your country…' : 'Location unavailable')
  const countryFontSize = locationLabel.length > 20 ? 20 : locationLabel.length > 14 ? 24 : 29

  return (
    <motion.div
      className="university-globe-card"
      initial={{ opacity: 0, scale: 0.84, rotate: -8, x: -44 }}
      animate={{ opacity: 1, scale: 1, rotate: 0, x: 0 }}
      transition={{ duration: 1.25, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="university-globe-red-haze" aria-hidden="true" />

      <svg
        className="university-globe-svg"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`Animated university destinations from ${locationLabel}`}
      >
        <defs>
          <radialGradient id="globeSurface" cx="31%" cy="20%" r="82%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.52" />
            <stop offset="38%" stopColor="#f7fbff" stopOpacity="0.27" />
            <stop offset="75%" stopColor="#dce8f1" stopOpacity="0.38" />
            <stop offset="100%" stopColor="#a9bdcc" stopOpacity="0.58" />
          </radialGradient>
          <linearGradient id="globeRim" x1="0.12" y1="0.08" x2="0.88" y2="0.9">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.96" />
            <stop offset="38%" stopColor="#c6d7e4" stopOpacity="0.72" />
            <stop offset="68%" stopColor="#8fa8ba" stopOpacity="0.58" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="landGlass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="44%" stopColor="#dce7ef" stopOpacity="0.37" />
            <stop offset="100%" stopColor="#91a7b8" stopOpacity="0.48" />
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
            <feDropShadow dx="0" dy="28" stdDeviation="25" floodColor="#64748b" floodOpacity="0.18" />
          </filter>
          <filter id="landEmboss" x="-20%" y="-20%" width="140%" height="150%">
            <feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves="2" seed="8" result="glassNoise" />
            <feDisplacementMap in="SourceGraphic" in2="glassNoise" scale="1.8" xChannelSelector="R" yChannelSelector="G" result="refractedLand" />
            <feDropShadow in="refractedLand" dx="0" dy="4" stdDeviation="3.2" floodColor="#64748b" floodOpacity="0.3" />
            <feDropShadow dx="-1.2" dy="-2" stdDeviation="1" floodColor="#ffffff" floodOpacity="0.92" />
          </filter>
          <filter id="frostedBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="18" />
          </filter>
          <filter id="pinGlow" x="-150%" y="-150%" width="400%" height="400%">
            <feDropShadow dx="0" dy="8" stdDeviation="9" floodColor="#ef4444" floodOpacity="0.68" />
          </filter>
          <clipPath id="globeClip">
            <circle cx={CENTER_X} cy={CENTER_Y} r={GLOBE_RADIUS} />
          </clipPath>
        </defs>

        <ellipse cx={CENTER_X} cy="576" rx="207" ry="24" fill="#64748b" opacity="0.09" filter="url(#frostedBlur)" />
        <g filter="url(#globeShadow)" className="university-globe-drift">
          <circle cx={CENTER_X} cy={CENTER_Y} r={GLOBE_RADIUS} fill="url(#globeSurface)" stroke="url(#globeRim)" strokeWidth="3" />
          <g clipPath="url(#globeClip)">
            <circle cx={CENTER_X} cy={CENTER_Y} r={GLOBE_RADIUS} fill="#fff" opacity="0.06" />
            <ellipse cx="204" cy="124" rx="230" ry="84" fill="#fff" opacity="0.5" transform="rotate(-16 204 124)" filter="url(#frostedBlur)" />
            <ellipse cx="470" cy="405" rx="148" ry="204" fill="#8299aa" opacity="0.12" transform="rotate(-23 470 405)" filter="url(#frostedBlur)" />
            <ellipse cx="230" cy="430" rx="125" ry="150" fill="#ffffff" opacity="0.2" transform="rotate(20 230 430)" filter="url(#frostedBlur)" />

            <g className="university-globe-grid" fill="none" stroke="#91a7b8" strokeWidth="1">
              <ellipse cx={CENTER_X} cy={CENTER_Y} rx={GLOBE_RADIUS} ry="82" />
              <ellipse cx={CENTER_X} cy={CENTER_Y} rx={GLOBE_RADIUS} ry="164" />
              <ellipse cx={CENTER_X} cy={CENTER_Y} rx="90" ry={GLOBE_RADIUS} />
              <ellipse cx={CENTER_X} cy={CENTER_Y} rx="180" ry={GLOBE_RADIUS} />
              <path d={`M${CENTER_X - GLOBE_RADIUS} ${CENTER_Y} H${CENTER_X + GLOBE_RADIUS}`} />
            </g>

            <g className="university-globe-land" filter="url(#landEmboss)">
              {LAND_MASSES.map((mass, index) => (
                <path key={index} d={landPath(mass)} fill="url(#landGlass)" stroke="#7892a7" strokeOpacity="0.66" strokeWidth="2" strokeLinejoin="round" />
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
            <text x={CENTER_X} y={CENTER_Y + 114} textAnchor="middle" style={{ fontSize: countryFontSize }}>
              {locationLabel}
            </text>
          </g>
          <path d="M 129 179 C 189 63 391 7 502 114" fill="none" stroke="#fff" strokeWidth="8" strokeLinecap="round" opacity="0.3" filter="url(#frostedBlur)" />
          <circle cx={CENTER_X} cy={CENTER_Y} r={GLOBE_RADIUS - 1.5} fill="none" stroke="#fff" strokeWidth="4" opacity="0.56" />
        </g>
      </svg>
    </motion.div>
  )
}
