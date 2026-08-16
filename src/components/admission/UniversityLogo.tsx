import { useEffect, useMemo, useState } from 'react'
import { Landmark } from 'lucide-react'
import type { UniversityBrand } from '@/data/admission'
import { useUniversityLogoImage } from '@/hooks/useUniversityLogoImage'

// Prefer the icon published by the university's own website without bundling a
// third-party trademark. A local brand-colour SVG/monogram keeps the UI complete
// when a site has no root favicon or blocks the request.
export default function UniversityLogo({
  name,
  brand,
  size = 64,
  className = '',
  rounded = '1.1rem',
  website,
}: {
  name: string
  brand: UniversityBrand
  size?: number
  className?: string
  rounded?: string
  website?: string
}) {
  const [officialIconIndex, setOfficialIconIndex] = useState(0)
  const [wikimediaLogoFailed, setWikimediaLogoFailed] = useState(false)
  const wikimediaLogo = useUniversityLogoImage(name)
  const officialIcons = useMemo(() => {
    if (!website) return []
    try {
      const origin = new URL(website).origin
      return [
        `${origin}/favicon.svg`,
        `${origin}/apple-touch-icon.png`,
        `${origin}/apple-touch-icon-precomposed.png`,
        `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(origin)}&sz=256`,
        `${origin}/favicon.ico`,
      ]
    } catch {
      return []
    }
  }, [website])
  const officialIcon = officialIcons[officialIconIndex]
  useEffect(() => {
    setOfficialIconIndex(0)
    setWikimediaLogoFailed(false)
  }, [website, wikimediaLogo])

  if (wikimediaLogo && !wikimediaLogoFailed) {
    return (
      <span
        className={`university-official-logo relative inline-flex flex-shrink-0 items-center justify-center overflow-hidden bg-white p-2.5 ${className}`}
        style={{ width: size, height: size, borderRadius: rounded, '--university-accent': brand.accent } as React.CSSProperties}
      >
        <img
          src={wikimediaLogo}
          alt={`${name} official logo`}
          className="h-full w-full object-contain"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setWikimediaLogoFailed(true)}
        />
      </span>
    )
  }

  if (wikimediaLogo === undefined) {
    return (
      <span
        className={`university-official-logo relative inline-flex flex-shrink-0 animate-pulse overflow-hidden bg-white/80 ${className}`}
        style={{ width: size, height: size, borderRadius: rounded, '--university-accent': brand.accent } as React.CSSProperties}
        aria-label={`Loading ${name} logo`}
      />
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
          alt={`${name} official website logo`}
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
      <Landmark className="relative h-[46%] w-[46%]" style={{ color: brand.ink }} aria-hidden="true" />
    </span>
  )
}
