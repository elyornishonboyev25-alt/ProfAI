import UiText from '@/components/common/UiText'
import './catalog-score.css'

export type CatalogResult = { score: number; maximum: number; label: string; detail?: string; completed?: boolean }

export default function CatalogScore({ score, maximum, label, detail, completed = true }: CatalogResult) {
  const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(maximum, score)) : 0
  return <div className="catalog-score" aria-label={`${label}: ${safeScore} / ${maximum}${detail ? `, ${detail}` : ''}`}>
    <div className="catalog-score__value"><span><UiText text={label} /></span><strong>{maximum === 9 ? safeScore.toFixed(1) : safeScore}<small> / {maximum === 9 ? '9.0' : maximum}</small></strong></div>
    {(detail || !completed) && <div className="catalog-score__summary">{!completed && <span className="catalog-score__saved"><UiText text="In progress" /></span>}{detail && <span><UiText text={detail} /></span>}</div>}
  </div>
}
