import { useEffect, useMemo, useState } from 'react'
import type { UniversityBrand } from '@/data/admission'
import { getUniversityLogo } from '@/components/admission/universityLogos'

// Prefer the icon published by the university's own website without bundling a
// third-party trademark. A local brand-colour SVG/monogram keeps the UI complete
// when a site has no root favicon or blocks the request.
export default function UniversityLogo({
  id,
  brand,
  size = 64,
  className = '',
  rounded = '1.1rem',
  website,
}: {
  id?: string
  brand: UniversityBrand
  size?: number
  className?: string
  rounded?: string
  website?: string
}) {
  const [officialIconIndex, setOfficialIconIndex] = useState(0)
  const officialIcons = useMemo(() => {
    if (!website) return []
    try {
      const origin = new URL(website).origin
      return [
        `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(origin)}&sz=128`,
        `${origin}/favicon.ico`,
      ]
    } catch {
      return []
    }
  }, [website])
  const vectorLogo = id ? getUniversityLogo(id) : undefined
  const officialIcon = officialIcons[officialIconIndex]
  const len = brand.monogram.length
  const fontSize = len <= 1 ? size * 0.5 : len === 2 ? size * 0.4 : len === 3 ? size * 0.3 : size * 0.24

  useEffect(() => setOfficialIconIndex(0), [website])

  // Use our resolution-independent mark first. University favicons are often only
  // 16–32px even when a larger Google URL is requested, which made Cambridge and
  // NUS visibly soft at card and hero sizes.
  if (vectorLogo) {
    return (
      <span
        className={`university-official-logo relative inline-flex flex-shrink-0 items-center justify-center overflow-hidden bg-white p-2 ${className}`}
        style={{ width: size, height: size, borderRadius: rounded, '--university-accent': brand.accent } as React.CSSProperties}
      >
        {vectorLogo}
      </span>
    )
  }

  if (officialIcon) {
    return (
      <span
        className={`university-official-logo relative inline-flex flex-shrink-0 items-center justify-center overflow-hidden bg-white ${className}`}
        style={{ width: size, height: size, borderRadius: rounded, '--university-accent': brand.accent } as React.CSSProperties}
      >
        <img
          src={officialIcon}
          alt={`${brand.monogram} official website emblem`}
          className="h-[76%] w-[76%] object-contain"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setOfficialIconIndex((index) => index + 1)}
        />
      </span>
    )
  }

  return (
    <span
      className={`relative inline-flex flex-shrink-0 items-center justify-center overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        background: brand.gradient,
        boxShadow: `0 10px 26px ${brand.accent}40, inset 0 1px 0 rgba(255,255,255,0.28)`,
      }}
      aria-label={`${brand.monogram} university identity`}
    >
      <span
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 26% 18%, rgba(255,255,255,0.38), transparent 44%), linear-gradient(145deg, transparent 48%, rgba(255,255,255,0.12) 49%, transparent 76%)',
        }}
      />
      <span
        className="relative font-black leading-none tracking-tight"
        style={{
          color: brand.ink,
          fontSize,
          fontFamily: 'Georgia, "Times New Roman", serif',
          textShadow: '0 1px 2px rgba(0,0,0,0.28)',
        }}
      >
        {brand.monogram}
      </span>
    </span>
  )
}
