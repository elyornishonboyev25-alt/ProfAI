import { Landmark } from 'lucide-react'
import type { UniversityBrand } from '@/data/admission'
import { getUniversityLogo } from '@/components/admission/universityLogos'

function slugFromName(name: string) {
  return name.toLowerCase().replace(/\([^)]*\)/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/**
 * Synchronous, network-free university identity. Known institutions use the
 * hand-built local SVG mark; every other catalog record gets its own branded
 * monogram tile immediately, so cards never render an empty loading box.
 */
export default function UniversityLogo({
  id,
  name,
  brand,
  size = 64,
  className = '',
  rounded = '1.1rem',
}: {
  id?: string
  name: string
  brand: UniversityBrand
  size?: number
  className?: string
  rounded?: string
  website?: string
}) {
  const localLogo = getUniversityLogo(id ?? slugFromName(name))

  if (localLogo) {
    return (
      <span
        className={`university-official-logo relative inline-flex flex-shrink-0 items-center justify-center overflow-hidden bg-white p-2.5 ${className}`}
        style={{ width: size, height: size, borderRadius: rounded, '--university-accent': brand.accent } as React.CSSProperties}
        aria-label={`${name} identity`}
      >
        {localLogo}
      </span>
    )
  }

  return (
    <span
      className={`relative inline-flex flex-shrink-0 items-center justify-center overflow-hidden ${className}`}
      style={{ width: size, height: size, borderRadius: rounded, background: brand.gradient, boxShadow: `0 10px 26px ${brand.accent}35, inset 0 1px 0 rgba(255,255,255,.34)` }}
      aria-label={`${name} identity`}
    >
      <span className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 25% 18%,rgba(255,255,255,.42),transparent 38%),linear-gradient(145deg,transparent 48%,rgba(255,255,255,.13) 49%,transparent 76%)' }} />
      <Landmark className="absolute h-[68%] w-[68%] opacity-15" style={{ color: brand.ink }} aria-hidden="true" />
      <strong className="relative max-w-[88%] text-center font-black tracking-[-.05em]" style={{ color: brand.ink, fontSize: `${Math.max(11, Math.min(22, size / Math.max(3, brand.monogram.length * .82)))}px` }}>{brand.monogram}</strong>
    </span>
  )
}
