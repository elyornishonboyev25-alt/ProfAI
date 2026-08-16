import { useEffect, useRef, useState } from 'react'
import { Landmark } from 'lucide-react'
import type { UniversityBrand } from '@/data/admission'
import { hasCachedUniversityLogo, useUniversityLogoImage } from '@/hooks/useUniversityLogoImage'

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
  const rootRef = useRef<HTMLSpanElement>(null)
  const [shouldLoad, setShouldLoad] = useState(() => (
    hasCachedUniversityLogo(name, website)
    || typeof window === 'undefined'
    || !('IntersectionObserver' in window)
  ))
  const [logoFailed, setLogoFailed] = useState(false)
  const officialLogo = useUniversityLogoImage(shouldLoad ? name : '', shouldLoad ? website : undefined)
  useEffect(() => {
    if (shouldLoad) return
    const element = rootRef.current
    if (!element) return
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return
      setShouldLoad(true)
      observer.disconnect()
    }, { rootMargin: '480px' })
    observer.observe(element)
    return () => observer.disconnect()
  }, [shouldLoad])
  useEffect(() => {
    setLogoFailed(false)
  }, [officialLogo])

  if (officialLogo && !logoFailed) {
    return (
      <span
        ref={rootRef}
        className={`university-official-logo relative inline-flex flex-shrink-0 items-center justify-center overflow-hidden bg-white p-2.5 ${className}`}
        style={{ width: size, height: size, borderRadius: rounded, '--university-accent': brand.accent } as React.CSSProperties}
      >
        <img
          src={officialLogo}
          alt={`${name} official logo`}
          className="h-full w-full object-contain"
          loading="eager"
          decoding="async"
          fetchPriority="low"
          referrerPolicy="no-referrer"
          onError={() => setLogoFailed(true)}
        />
      </span>
    )
  }

  if (officialLogo === undefined) {
    return (
      <span
        ref={rootRef}
        className={`university-official-logo relative inline-flex flex-shrink-0 animate-pulse overflow-hidden bg-white/80 ${className}`}
        style={{ width: size, height: size, borderRadius: rounded, '--university-accent': brand.accent } as React.CSSProperties}
        aria-label={`Loading ${name} logo`}
      />
    )
  }

  return (
    <span
      ref={rootRef}
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
