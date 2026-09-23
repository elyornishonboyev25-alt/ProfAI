import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ArrowLeft, Bookmark, Building2, ExternalLink, MapPin } from 'lucide-react'
import UniversityLogo from '@/components/admission/UniversityLogo'
import UniversityRadar from '@/components/admission/UniversityRadar'
import AdmissionScoreComparison from '@/components/admission/AdmissionScoreComparison'
import { getUniversityBySlug, presentIndicators, QS_EDITION } from '@/data/admission'
import { useAdmissionScores } from '@/hooks/useAdmissionScores'
import { useUniversityCampusImage } from '@/hooks/useUniversityCampusImage'
import { useUniversityShortlist } from '@/hooks/useUniversityShortlist'
import { useToastStore } from '@/store/toastStore'
import { useCopy } from '@/i18n/interface'

export default function AdmissionUniversity() {
  const { c, language } = useCopy()
  const { slug } = useParams<{ slug: string }>()
  const location = useLocation()
  const university = slug ? getUniversityBySlug(slug) : undefined
  const { scores } = useAdmissionScores()
  const image = useUniversityCampusImage(university?.name ?? '')
  const [imageFailed, setImageFailed] = useState(false)
  const [analyticsOpen, setAnalyticsOpen] = useState(false)
  const { isShortlisted, toggleShortlist } = useUniversityShortlist()
  const pushToast = useToastStore(state => state.pushToast)
  useEffect(() => { setImageFailed(false); setAnalyticsOpen(false) }, [slug, image?.src])
  const back = (location.state as { admissionReturnTo?: unknown } | null)?.admissionReturnTo === '/admission/shortlist' ? '/admission/shortlist' : '/admission/universities'
  const locale = language === 'ru' ? 'ru-RU' : 'en-US'
  const number = (value: number | undefined) => typeof value === 'number' ? value.toLocaleString(locale) : '—'
  const money = (amount: number, currency: string) => new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
  if (!university) return <main className="workspace-page liquid-page"><section className="glass-surface liquid-university-empty"><Building2 size={34} /><h1>{c('University not found')}</h1><p>{c('This profile doesn’t exist or hasn’t been added yet.')}</p><Link to="/admission/universities" className="liquid-button primary">{c('Explore universities')}</Link></section></main>
  const u = university
  const cost = u.costOfLiving
  const saved = isShortlisted(u.slug)
  const indicators = presentIndicators(u.indicators)
  const students = u.students
  const period = cost ? c(cost.period === 'month' ? '/ month' : cost.period === 'academic-year' ? '/ academic year' : '/ year') : ''
  const costRange = cost ? money(cost.amount, cost.currency) + (cost.maxAmount ? '–' + money(cost.maxAmount, cost.currency) : '') : ''
  function save() {
    const added = toggleShortlist(u.slug)
    pushToast({ type: added ? 'success' : 'info', title: c(added ? 'Added to shortlist' : 'Removed from shortlist'), message: u.name })
  }
  return <main className="workspace-page liquid-page liquid-university-detail">
    <Link to={back} className="liquid-text-link mb-6"><ArrowLeft size={16} />{c(back.endsWith('shortlist') ? 'Saved universities' : 'Universities')}</Link>
    <section className="glass-surface liquid-university-intro">
      <div className="liquid-university-banner">{image && !imageFailed ? <><img src={image.src} alt={u.name} onError={() => setImageFailed(true)} /><a className="liquid-photo-credit" href={image.attributionUrl} target="_blank" rel="noopener noreferrer">{c('Photo source')}</a></> : <div className="liquid-campus-placeholder"><Building2 size={54} strokeWidth={1} /><span>{u.shortName}</span></div>}</div>
      <div className="liquid-university-intro-copy">
        <div className="liquid-university-top"><UniversityLogo id={u.id} name={u.name} brand={u.brand} website={u.website} size={60} rounded="16px" priority /><button type="button" onClick={save} aria-pressed={saved} className="liquid-button secondary"><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} />{c(saved ? 'Saved' : 'Save university')}</button></div>
        <header className="liquid-page-heading"><p className="liquid-eyebrow">{c('University profile')}</p><h1>{u.name}</h1><p><MapPin size={16} className="inline mr-2" />{u.city}, {c(u.country)}</p></header>
        <div className="liquid-actions"><a className="liquid-button primary" href={u.website} target="_blank" rel="noopener noreferrer">{c('Visit official website')}<ExternalLink size={16} /></a><span className="liquid-catalog-note">{c('Founded')}: {u.founded} · {c(u.type)}</span></div>
      </div>
    </section>
    <nav className="liquid-section-tabs mt-7" aria-label={c('University profile')}><a href="#university-overview">{c('Overview')}</a><a href="#university-requirements">{c('Entry requirements')}</a>{cost && <a href="#university-costs">{c('Living costs')}</a>}<a href="#university-sources">{c('Sources')}</a></nav>
    <section id="university-overview" className="glass-surface liquid-detail-section"><h2>{c('About the university')}</h2><p>{u.about}</p><p>{u.tagline}</p><dl className="liquid-fact-grid"><div><dt>{c('QS rank')}</dt><dd>{typeof u.rank === 'number' ? '#' + (u.rankTied ? '=' : '') + u.rank : '—'}</dd><small>{QS_EDITION}</small></div><div><dt>{c('Students')}</dt><dd>{number(students?.total)}</dd></div><div><dt>{c('International students')}</dt><dd>{number(students?.international)}</dd></div>{cost && <div><dt>{c('Living costs')}</dt><dd>{costRange}</dd><small>{period}</small></div>}</dl></section>
    <section id="university-requirements" className="glass-surface liquid-detail-section"><h2>{c('Entry requirements')}</h2><p>{c('Confirm requirements for your course and intake on the official university website.')}</p>
      {u.admission?.bachelor?.length ? <><p>{u.admission.note}</p><AdmissionScoreComparison university={u} scores={scores} /><div className="liquid-requirement-grid">{u.admission.bachelor.map((requirement, index) => <article key={requirement.label + index}><h3>{requirement.label}</h3><strong>{requirement.value}</strong>{requirement.detail && <p>{requirement.detail}</p>}{requirement.sourceUrl && <a className="liquid-text-link" href={requirement.sourceUrl} target="_blank" rel="noopener noreferrer">{c('Official source')}<ExternalLink size={13} /></a>}</article>)}</div>{u.admission.verifiedAt && <p className="liquid-catalog-note">{c('Last verified')}: {u.admission.verifiedAt}</p>}</> : <p className="liquid-empty">{c('Course-specific requirements are available on the official website.')}</p>}
    </section>
    {cost && <section id="university-costs" className="glass-surface liquid-detail-section"><h2>{c('Living costs')}</h2><p className="liquid-cost-total">{costRange} <small>{period}</small></p><h3>{cost.label}</h3><ul className="liquid-detail-list">{cost.includes.map(item => <li key={item}>{c(item)}</li>)}</ul>{cost.note && <p>{cost.note}</p>}<p className="liquid-catalog-note">{c('Published period')}: {cost.academicYear || '—'} · {c('Last verified')}: {cost.verifiedAt}</p><a className="liquid-text-link" href={cost.sourceUrl} target="_blank" rel="noopener noreferrer">{c('Official cost source')}<ExternalLink size={15} /></a></section>}
    {u.campus && <section className="glass-surface liquid-detail-section"><h2>{c('Campus location')}</h2><h3>{u.campus.name}</h3><p>{u.campus.address}</p><a className="liquid-text-link" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(u.campus.mapsQuery)}`} target="_blank" rel="noopener noreferrer">{c('Open in Maps')}<ExternalLink size={15} /></a></section>}
    <details className="glass-surface liquid-detail-section liquid-detail-disclosure" open={analyticsOpen} onToggle={event => setAnalyticsOpen(event.currentTarget.open)}><summary>{c('Rankings, indicators & student statistics')}</summary>
      {analyticsOpen && <>
        <dl className="liquid-fact-grid"><div><dt>{c('Overall Score')}</dt><dd>{number(u.overallScore)}</dd><small>{c('out of 100')}</small></div><div><dt>{c('Subject Ranking')}</dt><dd>{typeof u.subjectRank === 'number' ? '#' + u.subjectRank : '—'}</dd></div><div><dt>{c('Sustainability Ranking')}</dt><dd>{typeof u.sustainabilityRank === 'number' ? '#' + u.sustainabilityRank : '—'}</dd></div></dl>
        {indicators.length ? <><div className="liquid-university-radar"><UniversityRadar indicators={u.indicators} accent={u.brand.accent} /></div><dl className="liquid-indicator-list">{indicators.map(({ meta, value }) => <div key={meta.key}><dt>{c(meta.label)}</dt><dd>{value} / 100</dd></div>)}</dl></> : <p>{c('QS indicator breakdown is not included for this profile.')}</p>}
        {u.rankHistory?.length ? <><h3>{c('QS rank over time')}</h3><div className="liquid-rank-history">{u.rankHistory.map(point => <div key={point.year}><span>{point.year}</span><strong>#{point.rank}</strong></div>)}</div></> : null}
        {students && <><h3>{c('Students & Staff')}</h3><dl className="liquid-fact-grid">{[
          ['Undergraduate', students.undergraduate], ['Postgraduate', students.postgraduate], ['Total faculty staff', students.facultyStaff],
          ['International undergraduate', students.internationalUndergraduate], ['International postgraduate', students.internationalPostgraduate],
        ].map(([label, value]) => <div key={String(label)}><dt>{c(String(label))}</dt><dd>{number(typeof value === 'number' ? value : undefined)}</dd></div>)}</dl></>}
      </>}
    </details>
    <section id="university-sources" className="glass-surface liquid-detail-section"><h2>{c('Official sources')}</h2><div className="liquid-source-list">{u.sources?.map(source => <a key={source.url} className="liquid-text-link" href={source.url} target="_blank" rel="noopener noreferrer">{source.label}<ExternalLink size={15} /></a>)}<a href={u.website} target="_blank" rel="noopener noreferrer" className="liquid-text-link">{c('University website')}<ExternalLink size={15} /></a></div><p className="liquid-catalog-note">{c('Confirm current requirements and costs on each university’s official website.')}</p></section>
  </main>
}
