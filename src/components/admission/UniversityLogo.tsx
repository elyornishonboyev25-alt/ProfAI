import type { UniversityBrand } from '@/data/admission'

// Neutral identity tile. Official university marks require institution-specific
// trademark permission, so ProfAI ships monograms until an approved asset and its
// permitted scope are documented in public/assets/ASSET-LICENSES.md.
export default function UniversityLogo({
  id,
  brand,
  size = 64,
  className = '',
  rounded = '1.1rem',
}: {
  id?: string
  brand: UniversityBrand
  size?: number
  className?: string
  rounded?: string
}) {
  void id
  const len = brand.monogram.length
  const fontSize = len <= 1 ? size * 0.5 : len === 2 ? size * 0.4 : len === 3 ? size * 0.3 : size * 0.24

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
