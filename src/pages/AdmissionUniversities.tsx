import { useDeferredValue, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Bookmark, BookOpen, Search, SlidersHorizontal } from 'lucide-react'
import { formatUniversityRank, getUniversities, QS_EDITION, type University } from '@/data/admission'
import { estimateRequirements } from '@/data/admission/match'
import UniversityLogo from '@/components/admission/UniversityLogo'
import { useUniversityShortlist } from '@/hooks/useUniversityShortlist'
import { useCopy } from '@/i18n/interface'
import { useToastStore } from '@/store/toastStore'
import UniversityCampusThumbnail from '@/components/admission/UniversityCampusThumbnail'

function UniversityCard({ university, saved, toggle, returnTo }: { university: University; saved: boolean; toggle: () => void; returnTo: string }) {
  const { c, language } = useCopy()
  const cost = university.costOfLiving
  const budget = cost ? new Intl.NumberFormat(language === 'ru' ? 'ru-RU' : 'en-US', { style: 'currency', currency: cost.currency, maximumFractionDigits: 0 }).format(cost.amount) : null
  return <article className="glass-surface liquid-university-card">
    <UniversityCampusThumbnail university={university} />
    <div className="liquid-university-copy"><div className="liquid-university-top"><UniversityLogo id={university.id} name={university.name} brand={university.brand} website={university.website} size={40} rounded="10px" /><button className="liquid-icon-button" type="button" onClick={toggle} aria-pressed={saved} aria-label={c(saved ? 'Remove from shortlist' : 'Save university') + ': ' + university.name}><Bookmark size={19} fill={saved ? 'currentColor' : 'none'} /></button></div>
      <h2><Link to={`/admission/universities/${university.slug}`} state={{ admissionReturnTo: returnTo }}>{university.name}</Link></h2><p>{university.city}, {c(university.country)}</p>
      <div className="liquid-university-meta"><span>{typeof university.rank === 'number' ? `QS ${QS_EDITION.match(/\d{4}/)?.[0] || ''} · ${formatUniversityRank(university, '#')}` : c('Ranking not listed')}</span><span>{budget ? budget + ' ' + c(cost?.period === 'month' ? '/ month' : '/ year') : c('Budget not published')}</span></div>
      <Link to={`/admission/universities/${university.slug}`} state={{ admissionReturnTo: returnTo }} className="liquid-text-link">{c('View university')}<ArrowRight size={16} /></Link>
    </div>
  </article>
}
export default function AdmissionUniversities({ shortlistOnly = false }: { shortlistOnly?: boolean }) {
  const { c } = useCopy()
  const all = useMemo(()=>getUniversities(),[])
  const countries = useMemo(()=>[...new Set(all.map(u=>u.country))].sort(),[all])
  const { shortlistedSet, shortlistCount, toggleShortlist } = useUniversityShortlist()
  const pushToast = useToastStore(s=>s.pushToast)
  const [query,setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [country,setCountry] = useState('all')
  const [budget,setBudget] = useState('all')
  const [rank,setRank] = useState('all')
  const [ielts,setIelts] = useState('all')
  const [visible,setVisible] = useState(12)
  const [advanced,setAdvanced] = useState(false)
  const filtered = useMemo(()=>all.filter(u=>{
    if(shortlistOnly && !shortlistedSet.has(u.slug)) return false
    const q=deferredQuery.trim().toLowerCase()
    if(q && ![u.name,u.shortName,u.city,u.country].some(value=>value.toLowerCase().includes(q))) return false
    if(country!=='all' && u.country!==country) return false
    const cost=u.costOfLiving
    if(budget==='published' && !cost) return false
    if(budget==='under-20k-usd' && !(cost?.currency==='USD' && cost.period==='academic-year' && (cost.maxAmount??cost.amount)<=20000)) return false
    if(rank==='unranked' && typeof u.rank==='number') return false
    if(rank!=='all' && rank!=='unranked' && !(typeof u.rank==='number' && u.rank<=Number(rank))) return false
    const required=estimateRequirements(u).ielts
    if(ielts==='none' && required!==null) return false
    if(ielts==='7.5+' && !(required!==null && required>=7.5)) return false
    if(['6.5','7'].includes(ielts) && !(required!==null && required<=Number(ielts))) return false
    return true
  }),[all,shortlistOnly,shortlistedSet,deferredQuery,country,budget,rank,ielts])
  function reset(){setQuery('');setCountry('all');setBudget('all');setRank('all');setIelts('all');setVisible(12)}
  const change=(setter:(v:string)=>void)=>(e:React.ChangeEvent<HTMLSelectElement>)=>{setter(e.target.value);setVisible(12)}
  const returnTo=shortlistOnly?'/admission/shortlist':'/admission/universities'
  return <div className="workspace-page liquid-page">
    <header className="liquid-page-heading"><Link to="/admission" className="liquid-text-link">{c('University Applications')}</Link><h1>{c(shortlistOnly?'Saved universities':'Find a place for your ambitions.')}</h1><p>{c(shortlistOnly?'Return to the universities you have saved.':'Compare destinations and discover university profiles.')}</p></header>
    <nav className="liquid-section-tabs" aria-label={c('University Applications')}><Link to="/admission/universities" aria-current={!shortlistOnly?'page':undefined}>{c('Universities')}</Link><Link to="/admission/shortlist" aria-current={shortlistOnly?'page':undefined}>{c('Saved universities')}<span>{shortlistCount}</span></Link><Link to="/admission/lessons">{c('Guides')}</Link></nav>
    <section className="glass-surface liquid-university-search">
      <div className="liquid-search-row"><label className="liquid-search-field"><Search size={19} /><span className="sr-only">{c('Search universities')}</span><input type="search" value={query} onChange={e=>{setQuery(e.target.value);setVisible(12)}} placeholder={c('Search universities')} /></label><label className="liquid-filter"><span className="sr-only">{c('Country')}</span><select value={country} onChange={change(setCountry)}><option value="all">{c('All countries')}</option>{countries.map(name=><option key={name}>{name}</option>)}</select></label><button type="button" className="liquid-button secondary" aria-expanded={advanced} aria-controls="university-filters" onClick={()=>setAdvanced(!advanced)}><SlidersHorizontal size={17} />{c('Filters')}</button></div>
      {advanced && <div id="university-filters" className="liquid-filter-grid"><label className="liquid-form-field">{c('Living-cost budget')}<select value={budget} onChange={change(setBudget)}><option value="all">{c('Any budget')}</option><option value="published">{c('Published cost')}</option><option value="under-20k-usd">{c('Under $20k / year')}</option></select></label><label className="liquid-form-field">{c('IELTS requirement')}<select value={ielts} onChange={change(setIelts)}><option value="all">{c('Any IELTS')}</option><option value="6.5">IELTS ≤ 6.5</option><option value="7">IELTS ≤ 7.0</option><option value="7.5+">IELTS ≥ 7.5</option><option value="none">{c('No numeric cutoff')}</option></select></label><label className="liquid-form-field">{c('QS rank')}<select value={rank} onChange={change(setRank)}><option value="all">{c('Any QS rank')}</option>{[10,25,50].map(n=><option key={n} value={n}>QS Top {n}</option>)}<option value="unranked">{c('Ranking not listed')}</option></select></label></div>}
      <div className="liquid-search-meta"><span>{filtered.length} {c('universities found')}</span><button className="liquid-text-link" onClick={reset}>{c('Reset filters')}</button></div>
    </section>
    {!filtered.length ? <section className="glass-surface liquid-university-empty"><Bookmark size={30} /><h2>{c(shortlistOnly&&!shortlistCount?'Your shortlist is empty':'No universities found')}</h2><p>{c(shortlistOnly&&!shortlistCount?'Save universities you want to compare and revisit.':'Try a wider country, score, budget or ranking filter.')}</p>{shortlistOnly&&!shortlistCount?<Link className="liquid-button primary" to="/admission/universities">{c('Explore universities')}</Link>:<button className="liquid-button secondary" onClick={reset}>{c('Reset filters')}</button>}</section> :
      <div className="liquid-university-grid">{filtered.slice(0,visible).map(u=><UniversityCard key={u.slug} university={u} saved={shortlistedSet.has(u.slug)} returnTo={returnTo} toggle={()=>{const added=toggleShortlist(u.slug);pushToast({type:added?'success':'info',title:c(added?'Added to shortlist':'Removed from shortlist'),message:u.name})}} />)}</div>}
    {visible<filtered.length && <div className="liquid-load-more"><button className="liquid-button secondary" onClick={()=>setVisible(visible+12)}>{c('Show more universities')}<ArrowRight size={16} /></button></div>}
    <Link to="/admission/lessons" className="glass-surface liquid-resource-row"><div><h3>{c('Learn the application process')}</h3><p>{c('Follow the existing lessons, from research to preparation.')}</p></div><BookOpen size={22} /></Link>
    <p className="liquid-catalog-note">{c('Rankings')}: {QS_EDITION}. {c('Confirm current requirements and costs on each university’s official website.')} {shortlistOnly && c('Your shortlist is saved on this device.')}</p>
  </div>
}
