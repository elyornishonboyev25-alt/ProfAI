import { useMemo, useState } from 'react'
import { Landmark } from 'lucide-react'
import type { UniversityBrand } from '@/data/admission'

function officialLogoUrl(website?: string) {
  if (!website) return null

  try {
    const domain = new URL(website).hostname.replace(/^www\./, '')
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=256`
  } catch {
    return null
  }
}

/**
 * University sites expose their official symbol as a favicon. Google serves a
 * cached 256px copy, which gives every catalog entry a consistent, crisp logo
 * without hot-linking dozens of differently-sized files from university sites.
 * A neutral landmark remains underneath as an instant, text-free fallback.
 */
export default function UniversityLogo({
  name,
  brand,
  website,
  size = 64,
  className = '',
  rounded = '1.1rem',
  priority = false,
}: {
  id?: string
  name: string
  brand: UniversityBrand
  size?: number
  className?: string
  rounded?: string
  website?: string
  priority?: boolean
}) {
  const logoUrl = useMemo(() => officialLogoUrl(website), [website])
  const [logoFailed, setLogoFailed] = useState(false)

  return (
    <span
      className={`university-official-logo relative inline-flex flex-shrink-0 items-center justify-center overflow-hidden bg-white p-2.5 ${className}`}
      style={{ width: size, height: size, borderRadius: rounded, '--university-accent': brand.accent } as React.CSSProperties}
      aria-label={`${name} identity`}
    >
      <span className="absolute inset-2.5 flex items-center justify-center" aria-hidden="true">
        <Landmark className="h-[64%] w-[64%]" style={{ color: brand.accent }} />
      </span>
      {logoUrl && !logoFailed ? (
        <img
          src={logoUrl}
          alt=""
          className="relative h-full w-full object-contain"
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          referrerPolicy="no-referrer"
          onError={() => setLogoFailed(true)}
        />
      ) : null}
    </span>
  )
}
