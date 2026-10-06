import {
  BookOpen,
  Brain,
  Compass,
  Crown,
  Flame,
  Gem,
  GraduationCap,
  Library,
  Lightbulb,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { coverPalettes } from '@/data/articles'
import type { Article } from '@/data/articles'

const ICONS: Record<string, LucideIcon> = {
  BookOpen,
  Brain,
  Compass,
  Crown,
  Flame,
  Gem,
  GraduationCap,
  Library,
  Lightbulb,
  Rocket,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
}

type ArticleCoverProps = {
  article: Article
  variant?: 'card' | 'hero'
  className?: string
  appearance?: 'original' | 'silver'
}

// Generated, watermark-free cover art. Pure CSS + a single icon motif so it always looks
// premium and never carries a channel handle. If `article.cover.image` is provided we use the
// real photo instead and keep a soft gradient scrim for legibility.
export function ArticleCover({ article, variant = 'card', className = '', appearance = 'original' }: ArticleCoverProps) {
  const palette = appearance === 'silver' ? {
    gradient: 'linear-gradient(125deg, #f8fafc 0%, #e3e8ef 48%, #c5ceda 100%)',
    glow: 'radial-gradient(ellipse at 88% 18%, rgba(255,255,255,.9), transparent 55%), radial-gradient(ellipse at 10% 100%, rgba(220,38,38,.09), transparent 60%)',
    accent: '#c52b3e', kicker: '#9f2639', ink: '#202633',
  } : coverPalettes[article.cover.theme]
  const Icon = ICONS[article.cover.icon] ?? BookOpen
  const isHero = variant === 'hero'

  if (article.cover.image) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <img src={article.cover.image} alt="" className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(2,6,23,0) 35%, rgba(2,6,23,0.55) 100%)' }} />
      </div>
    )
  }

  return (
    <div
      className={`relative isolate overflow-hidden ${appearance === 'silver' ? 'article-cover-silver' : ''} ${className}`}
      style={{ background: palette.gradient }}
      aria-hidden="true"
    >
      {/* warm glow */}
      <div className="pointer-events-none absolute inset-0" style={{ background: palette.glow }} />
      {/* faint grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.7) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.7) 1px, transparent 1px)',
          backgroundSize: isHero ? '46px 46px' : '32px 32px',
        }}
      />
      {/* oversized motif icon */}
      <Icon
        className="pointer-events-none absolute -bottom-6 -right-4 opacity-[0.16]"
        style={{ color: palette.accent }}
        strokeWidth={1.1}
        size={isHero ? 220 : 150}
      />

      <div className={`relative flex h-full w-full flex-col justify-between ${isHero ? 'p-6 sm:p-8' : 'p-5'}`}>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center justify-center rounded-2xl ${isHero ? 'h-12 w-12' : 'h-10 w-10'}`}
            style={{ background: 'rgba(255,255,255,0.12)', color: palette.accent, boxShadow: `inset 0 0 0 1px ${palette.accent}33` }}
          >
            <Icon size={isHero ? 26 : 20} strokeWidth={2} />
          </span>
          {article.cover.motif ? (
            <span
              className={`font-black tracking-[0.2em] ${isHero ? 'text-sm' : 'text-[11px]'}`}
              style={{ color: palette.kicker }}
            >
              {article.cover.motif}
            </span>
          ) : null}
        </div>

        <div>
          <p
            className={`font-black leading-tight ${isHero ? 'text-2xl sm:text-3xl' : 'text-lg'}`}
            style={{ color: palette.ink }}
          >
            {article.title}
          </p>
        </div>
      </div>
    </div>
  )
}

export default ArticleCover
