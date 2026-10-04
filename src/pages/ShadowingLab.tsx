import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, AudioLines, Clock, Headphones, Mic, Repeat, ShieldCheck } from 'lucide-react'
import { useCopy } from '@/i18n/interface'
import StudyObject from '@/components/visuals/StudyObject'
import ShadowingPlayer from '@/components/shadowing/ShadowingPlayer'
import { LibraryControls, LibraryPagination, LIBRARY_PAGE_SIZE } from '@/components/learning/LibraryControls'
import { filterMedia, guidedShadowing, SHADOWING_CATALOG } from '@/data/educationalMedia'
import { getShadowingVideo, type ShadowingVideoDetail } from '@/services/shadowing'
import { formatClock } from '@/lib/youtube'
import '@/styles/educational-library.css'

const categories = [...new Set(SHADOWING_CATALOG.map(item => item.category))]
export default function ShadowingLab() {
  const { c } = useCopy()
  const [params, setParams] = useSearchParams()
  const plannedVideo = params.get('video')
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('All')
  const [category, setCategory] = useState('All')
  const [page, setPage] = useState(1)
  const [active, setActive] = useState<ShadowingVideoDetail | null>(null)
  const [loadingCaptions, setLoadingCaptions] = useState(false)
  const requestRef = useRef<AbortController | null>(null)
  const filtered = useMemo(() => filterMedia(SHADOWING_CATALOG, item => item, query, level, category), [query, level, category])
  useEffect(() => setPage(1), [query, level, category])
  const openVideo = useCallback(async (id: string) => {
    const item = SHADOWING_CATALOG.find(video => video.youtubeId === id)
    if (!item) return
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    setActive(guidedShadowing(item))
    setLoadingCaptions(true)
    try {
      const video = await getShadowingVideo(id, controller.signal)
      if (!controller.signal.aborted && (video.captions?.length || video.segments.length)) setActive(video)
    } catch { /* Preview stays available; speech sections require real timed captions. */ }
    finally { if (!controller.signal.aborted) setLoadingCaptions(false) }
  }, [])
  useEffect(() => { if (plannedVideo) void openVideo(plannedVideo) }, [plannedVideo, openVideo])
  useEffect(() => () => requestRef.current?.abort(), [])
  if (active) return <div className="workspace-page learning-page shadowing-studio">
    {loadingCaptions && <p className="learning-caption-status" role="status">{c('Checking for a synced transcript')}</p>}
    {!loadingCaptions && !active.captions?.length && !active.segments.length && <div className="mb-4"><button type="button" className="learning-secondary" onClick={() => void openVideo(active.youtubeId)}>{c('Retry captions')}</button></div>}
    <ShadowingPlayer key={active.youtubeId} video={active} onBack={() => { requestRef.current?.abort(); setLoadingCaptions(false); setActive(null); if (plannedVideo) setParams({}, { replace: true }) }} />
  </div>
  return <div className="workspace-page learning-page"><div className="learning-frame">
    <header className="learning-hero">
      <div className="learning-hero-copy">
        <Link to="/academic-skills" className="learning-back"><ArrowLeft size={16} />{c('Academic Skills')}</Link>
        <p className="learning-eyebrow"><AudioLines size={16} />{c('Shadowing Lab')}</p>
        <h1>{c('Find your rhythm.')}<br /><span>{c('Make English your own.')}</span></h1>
        <p className="learning-intro">{c('Short, focused lessons to train pronunciation, sentence rhythm and confident academic English.')}</p>
        <div className="learning-hero-actions"><a href="#shadowing-library" className="learning-primary"><Mic size={17} />{c('Start shadowing')}<ArrowRight size={16} /></a><Link to="/podcast" className="learning-secondary"><Headphones size={17} />{c('Explore podcasts')}</Link></div>
        <div className="learning-trust"><ShieldCheck size={15} />{c('Curated educational sources')}<span>•</span>100 {c('lessons')}<span>•</span>{c('Up to 2 minutes')}</div>
      </div>
      <div className="learning-hero-visual"><div className="learning-visual-halo" /><StudyObject kind="microphone" /><div className="learning-visual-caption"><AudioLines size={20} /><span>{c('Listen. Repeat. Record.')}</span></div><div className="learning-wave" aria-hidden="true">{[14,26,18,40,54,32,66,44,30,48,24,40,18,28,14].map((height, index) => <i key={index} style={{ height }} />)}</div></div>
    </header>
    <div className="learning-method">{[{ icon: Headphones, title: 'Listen closely', detail: 'Notice sounds, stress and pauses.' }, { icon: Repeat, title: 'Repeat in rhythm', detail: 'Prepare with short audio sections.' }, { icon: Mic, title: 'Record & compare', detail: 'Hear your progress, one phrase at a time.' }].map(({ icon: Icon, title, detail }, index) => <div key={title}><span className="learning-step-icon"><Icon size={20} /></span><div><span className="learning-step-number">0{index + 1}</span><h2>{c(title)}</h2><p>{c(detail)}</p></div></div>)}</div>
    <section id="shadowing-library" className="learning-library">
      <div className="learning-section-heading"><div><p className="learning-eyebrow">{c('Your daily speaking practice')}</p><h2>{c('Shadowing library')}</h2></div><span className="learning-count">{filtered.length} / 100 {c('lessons')}</span></div>
      <LibraryControls query={query} onQuery={setQuery} level={level} onLevel={setLevel} category={category} onCategory={setCategory} categories={categories} />
      <div className="learning-card-grid">{filtered.slice((page - 1) * LIBRARY_PAGE_SIZE, page * LIBRARY_PAGE_SIZE).map(item => <button key={item.youtubeId} type="button" onClick={() => void openVideo(item.youtubeId)} className="learning-card">
        <div className="learning-card-image"><img src={item.thumbnailUrl} alt="" loading="lazy" onError={event => { event.currentTarget.style.visibility = 'hidden' }} /><span className="learning-card-duration"><Clock size={12} />{formatClock(item.durationSec)}</span><span className="learning-card-level">{item.cefr}</span><span className="learning-card-play"><Mic size={23} /></span></div>
        <div className="learning-card-copy"><p className="learning-card-category">{c(item.category)}</p><h3>{item.title}</h3><p className="learning-card-source">{item.source}</p><p className="learning-card-focus">{c(item.focus)}</p><span className="learning-card-action">{c('Practise this lesson')}<ArrowRight size={15} /></span></div>
      </button>)}</div>
      {!filtered.length && <div className="learning-empty"><p>{c('No matching lessons')}{query ? `: “${query}”` : ''}</p><button type="button" className="learning-secondary" onClick={() => { setQuery(''); setLevel('All'); setCategory('All') }}>{c('Reset filters')}</button></div>}
      <LibraryPagination page={page} total={filtered.length} onPage={setPage} />
    </section>
  </div></div>
}
