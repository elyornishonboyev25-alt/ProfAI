import { useEffect, useMemo, useState } from 'react'
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

type CuratedLogo = {
  src: string
  crop?: 'left-square'
  darkBackground?: boolean
}

// Google can only return the tiny icon exposed by some university sites. These
// entries point to a verified vector, high-resolution official-site asset, or
// a Wikimedia copy of the institution's mark. The files remain remote so the
// repository does not redistribute third-party trademarks.
const CURATED_LOGOS: Record<string, CuratedLogo> = {
  'university-of-cambridge': { src: 'https://upload.wikimedia.org/wikipedia/commons/c/c3/Coat_of_Arms_of_the_University_of_Cambridge.svg' },
  'national-university-of-singapore': { src: 'https://upload.wikimedia.org/wikipedia/en/b/b9/NUS_coat_of_arms.svg' },
  'tsinghua-university': { src: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Tsinghua_University_Logo.svg' },
  'mcgill-university': { src: 'https://upload.wikimedia.org/wikipedia/en/2/29/McGill_University_CoA.svg' },
  'chinese-university-of-hong-kong': { src: 'https://www.cuhk.edu.hk/english/images/fav-icons/apple-touch-icon.png' },
  'university-of-edinburgh': { src: 'https://upload.wikimedia.org/wikipedia/en/7/7a/University_of_Edinburgh_ceremonial_roundel.svg' },
  'university-of-manchester': { src: 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Shield_of_the_University_of_Manchester.svg' },
  'university-of-tokyo': { src: 'https://upload.wikimedia.org/wikipedia/commons/d/d6/University_of_Tokyo_logo_%282024%29.svg' },
  'zhejiang-university': { src: 'https://upload.wikimedia.org/wikipedia/en/1/16/Zhejiang_University_Logo.svg' },
  'nanyang-technological-university': { src: 'https://upload.wikimedia.org/wikipedia/en/f/f8/Nanyang_Technological_University_coat_of_arms_vector.svg' },
  'peking-university': {
    src: 'https://english.pku.edu.cn/Uploads/Bden/Picture/2020/11/25/s5fbdbf048bc00.png',
    crop: 'left-square',
  },
  'kings-college-london': { src: 'https://www.kcl.ac.uk/SiteElements/2017/images/kcl-logo.svg' },
  'columbia-university': { src: 'https://visualidentity.columbia.edu/sites/visualidentity.columbia.edu/files/styles/cu_crop/public/private/columbia-200.jpg.webp?itok=yJc12kQH' },
  'university-of-chicago': { src: 'https://upload.wikimedia.org/wikipedia/en/7/79/University_of_Chicago_shield.svg' },
  'university-of-toronto': { src: 'https://upload.wikimedia.org/wikipedia/en/0/04/Utoronto_coa.svg' },
  'yonsei-university': { src: 'https://www.yonsei.ac.kr/sites/en_sc/images/sub/img-symbol1.png' },
  wiut: {
    src: 'https://www.wiut.uz/images/logo/wiut_logo_250.png',
    darkBackground: true,
  },
  ucla: { src: 'https://www.ucla.edu/img/logo-ucla.svg' },
  'hong-kong-polytechnic-university': { src: 'https://www.polyu.edu.hk/assets/img/main-logo-1x.png' },
  'fudan-university': { src: 'https://www.fudan.edu.cn/_upload/tpl/00/06/6/template6/images/logo.png' },
  'seoul-national-university': { src: 'https://en.snu.ac.kr/webdata/uploads/eng/media/2026/02/80emblem_main.svg' },
}

/**
 * Known low-resolution favicons are replaced by a curated high-resolution
 * source. Every entry still falls back through the cached website icon and
 * finally to an instant, text-free landmark.
 */
export default function UniversityLogo({
  id,
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
  const curatedLogo = id ? CURATED_LOGOS[id] : undefined
  const sources = useMemo(() => {
    const favicon = officialLogoUrl(website)
    return Array.from(new Set([curatedLogo?.src, favicon].filter((source): source is string => Boolean(source))))
  }, [curatedLogo?.src, website])
  const [sourceIndex, setSourceIndex] = useState(0)
  const logoUrl = sources[sourceIndex] ?? null

  useEffect(() => {
    setSourceIndex(0)
  }, [id, sources])

  return (
    <span
      className={`university-official-logo relative inline-flex flex-shrink-0 items-center justify-center overflow-hidden bg-white p-2.5 ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        '--university-accent': brand.accent,
        ...(curatedLogo?.darkBackground ? { background: brand.gradient } : {}),
      } as React.CSSProperties}
      aria-label={`${name} identity`}
    >
      <span className="absolute inset-2.5 flex items-center justify-center" aria-hidden="true">
        <Landmark className="h-[64%] w-[64%]" style={{ color: curatedLogo?.darkBackground ? '#fff' : brand.accent }} />
      </span>
      {logoUrl ? (
        <img
          key={logoUrl}
          src={logoUrl}
          alt=""
          className={`relative h-full w-full ${sourceIndex === 0 && curatedLogo?.crop === 'left-square' ? 'object-cover object-left' : 'object-contain'}`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          referrerPolicy="no-referrer"
          onError={() => setSourceIndex((index) => index + 1)}
        />
      ) : null}
    </span>
  )
}
