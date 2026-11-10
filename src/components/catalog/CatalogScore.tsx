import UiText from '@/components/common/UiText'
import './catalog-score.css'

export type CatalogResult = { score: number; maximum: number; label: string; detail?: string; band?: boolean }

export default function CatalogScore({ score, maximum, label, detail, band = maximum === 9 }: CatalogResult) {
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(maximum, score)) : 0
  return <div className="catalog-score">
    <div className="catalog-score__value"><span><UiText text={label} /></span>{' '}<strong>{band ? safeScore.toFixed(1) : safeScore}<small>/{band ? maximum.toFixed(1) : maximum}</small></strong></div>
    {detail && <span className="catalog-score__summary"><UiText text={detail} /></span>}
  </div>
}
