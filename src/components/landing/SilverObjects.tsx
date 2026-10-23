import { useId } from 'react'

// Decorative silver "studio" objects for the landing exam cards. Everything is
// drawn in SVG (isometric projection) so it stays crisp and costs no image bytes.
const COS = 0.866
const SIN = 0.5

type Point = [number, number]
const iso = (ox: number, oy: number) => (u: number, v: number, z: number): Point => [ox + (u - v) * COS, oy + (u + v) * SIN - z]
const poly = (points: Point[]) => points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')

function Book({ ox, oy, w, d, h, label, ids }: { ox: number; oy: number; w: number; d: number; h: number; label?: string; ids: Record<string, string> }) {
  const p = iso(ox, oy)
  const top = [p(0, 0, h), p(w, 0, h), p(w, d, h), p(0, d, h)]
  const spine = [p(0, d, 0), p(w, d, 0), p(w, d, h), p(0, d, h)]
  const pages = [p(w, 0, 0), p(w, d, 0), p(w, d, h), p(w, 0, h)]
  const lines = Array.from({ length: 5 }, (_, index) => {
    const z = h * (0.22 + index * 0.14)
    const [x1, y1] = p(w, 6, z)
    const [x2, y2] = p(w, d - 6, z)
    return <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(120,128,140,.28)" strokeWidth=".8" />
  })
  const [tx, ty] = p(w * 0.14, d, h * 0.28)
  return <g>
    <polygon points={poly(spine)} fill={`url(#${ids.spine})`} stroke="rgba(255,255,255,.7)" strokeWidth=".8" />
    <polygon points={poly(pages)} fill={`url(#${ids.pages})`} stroke="rgba(255,255,255,.8)" strokeWidth=".8" />
    {lines}
    <polygon points={poly(top)} fill={`url(#${ids.top})`} stroke="rgba(255,255,255,.95)" strokeWidth="1" />
    {label && <g transform={`matrix(${COS},${SIN},0,1,${tx},${ty})`}>
      <text x="0" y="0" dy={h * 0.5} fontSize={Math.min(h * 0.62, 26)} fontWeight="800" letterSpacing="1.5" fill="rgba(70,76,88,.78)" fontFamily="'Segoe UI', system-ui, sans-serif">{label}</text>
      <text x="0" y="-.8" dy={h * 0.5} fontSize={Math.min(h * 0.62, 26)} fontWeight="800" letterSpacing="1.5" fill="rgba(255,255,255,.6)" fontFamily="'Segoe UI', system-ui, sans-serif">{label}</text>
    </g>}
  </g>
}

function Defs({ ids }: { ids: Record<string, string> }) {
  return <defs>
    <linearGradient id={ids.top} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#ffffff" /><stop offset=".38" stopColor="#dfe2e8" /><stop offset=".62" stopColor="#f6f7f9" /><stop offset="1" stopColor="#b5bbc5" />
    </linearGradient>
    <linearGradient id={ids.spine} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#f2f3f6" /><stop offset=".5" stopColor="#c3c8d0" /><stop offset="1" stopColor="#8f96a2" />
    </linearGradient>
    <linearGradient id={ids.pages} x1="1" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#fbfbfa" /><stop offset="1" stopColor="#c9cdd3" />
    </linearGradient>
    <linearGradient id={ids.bar} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#ffffff" /><stop offset=".55" stopColor="#d3d7de" /><stop offset="1" stopColor="#9aa1ad" />
    </linearGradient>
    <linearGradient id={ids.barSide} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#e6e8ec" /><stop offset="1" stopColor="#a3a9b4" />
    </linearGradient>
    <radialGradient id={ids.globe} cx=".34" cy=".3" r=".78">
      <stop offset="0" stopColor="#ffffff" /><stop offset=".3" stopColor="#eef0f3" /><stop offset=".72" stopColor="#b8bec8" /><stop offset="1" stopColor="#7f8794" />
    </radialGradient>
    <radialGradient id={ids.glow} cx=".5" cy=".5" r=".5">
      <stop offset="0" stopColor="rgba(225,29,52,.5)" /><stop offset="1" stopColor="rgba(225,29,52,0)" />
    </radialGradient>
    <linearGradient id={ids.pen} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stopColor="#8e95a1" /><stop offset=".45" stopColor="#ffffff" /><stop offset="1" stopColor="#9aa1ad" />
    </linearGradient>
  </defs>
}

function useIds() {
  const base = useId().replace(/:/g, '')
  return Object.fromEntries(['top', 'spine', 'pages', 'bar', 'barSide', 'globe', 'glow', 'pen'].map(name => [name, `${base}-${name}`]))
}

export function SilverIeltsObject() {
  const ids = useIds()
  return <svg className="lx-silver-object" viewBox="0 0 340 260" aria-hidden="true">
    <Defs ids={ids} />
    <ellipse cx="172" cy="214" rx="150" ry="34" fill={`url(#${ids.glow})`} opacity=".55" />
    <Book ox={150} oy={92} w={150} d={96} h={30} ids={ids} />
    <Book ox={150} oy={62} w={138} d={90} h={28} label="IELTS" ids={ids} />
    <g transform="translate(212 58)">
      <ellipse cx="0" cy="58" rx="40" ry="9" fill="rgba(60,66,78,.2)" />
      <path d="M-46 -6 A50 50 0 0 0 30 44" fill="none" stroke="#d91e36" strokeWidth="5" strokeLinecap="round" />
      <circle cx="0" cy="0" r="44" fill={`url(#${ids.globe})`} stroke="rgba(255,255,255,.95)" strokeWidth="1.2" />
      {[-22, 0, 22].map(y => <ellipse key={y} cx="0" cy={y} rx={Math.sqrt(44 * 44 - y * y)} ry={4 + Math.abs(y) / 10} fill="none" stroke="rgba(255,255,255,.75)" strokeWidth="1" />)}
      {[12, 26, 38].map(rx => <ellipse key={rx} cx="0" cy="0" rx={rx} ry="44" fill="none" stroke="rgba(255,255,255,.6)" strokeWidth="1" />)}
      <path d="M-26 -18c8-6 18-4 22 2s-2 12 4 16 14-2 16 6-8 14-16 12" fill="none" stroke="rgba(120,128,140,.35)" strokeWidth="5" strokeLinecap="round" />
      <ellipse cx="-14" cy="-18" rx="14" ry="8" fill="rgba(255,255,255,.75)" transform="rotate(-28 -14 -18)" />
      <rect x="-4" y="44" width="8" height="10" rx="2" fill="#c9ced6" />
    </g>
  </svg>
}

export function SilverSatObject() {
  const ids = useIds()
  const p = iso(150, 60)
  const bars = [16, 30, 46, 64].map((height, index) => {
    const u = 18 + index * 30
    const v = 30
    const top = [p(u, v, height + 0), p(u + 20, v, height), p(u + 20, v + 20, height), p(u, v + 20, height)]
    const front = [p(u, v + 20, 0), p(u + 20, v + 20, 0), p(u + 20, v + 20, height), p(u, v + 20, height)]
    const side = [p(u + 20, v, 0), p(u + 20, v + 20, 0), p(u + 20, v + 20, height), p(u + 20, v, height)]
    return <g key={index} transform="translate(0 -28)">
      <polygon points={poly(front)} fill={`url(#${ids.barSide})`} stroke="rgba(255,255,255,.7)" strokeWidth=".7" />
      <polygon points={poly(side)} fill={index === 3 ? '#c51f35' : `url(#${ids.bar})`} stroke="rgba(255,255,255,.7)" strokeWidth=".7" />
      <polygon points={poly(top)} fill={index === 3 ? '#ef4458' : '#fbfbfc'} stroke="rgba(255,255,255,.9)" strokeWidth=".7" />
    </g>
  })
  return <svg className="lx-silver-object" viewBox="0 0 340 260" aria-hidden="true">
    <Defs ids={ids} />
    <ellipse cx="172" cy="214" rx="150" ry="34" fill={`url(#${ids.glow})`} opacity=".55" />
    <Book ox={150} oy={92} w={150} d={96} h={30} ids={ids} />
    <Book ox={150} oy={62} w={138} d={90} h={28} label="SAT" ids={ids} />
    {bars}
    <g transform="translate(266 34) rotate(58)">
      <rect x="0" y="-5" width="138" height="10" rx="5" fill={`url(#${ids.pen})`} stroke="rgba(255,255,255,.8)" strokeWidth=".6" />
      <path d="M138 -5 L156 0 L138 5 Z" fill="#8b929e" />
      <rect x="18" y="-5" width="6" height="10" fill="#c51f35" />
    </g>
  </svg>
}
