import { useDeferredValue, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock3, Search, Sparkles, X } from 'lucide-react'
import ArticleCover from '@/components/articles/ArticleCover'
import { StudyIllustration } from '@/components/visuals/ArenaVisuals'
import { articles, articleCategories, articleWordCount, type ArticleCategory } from '@/data/articles'
import { getArticleProgressMap } from '@/utils/articleProgressStore'
import { useCopy } from '@/i18n/interface'
import '@/styles/articlesArena.css'

type Filter = ArticleCategory | 'All'
export default function Articles() {
  const { c, language } = useCopy()
  const [active, setActive] = useState<Filter>('All')
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const progress = useMemo(() => getArticleProgressMap(), [])
  const categories = useMemo<Filter[]>(() => ['All', ...articleCategories.filter(category => articles.some(article => article.category === category))], [])
  const filtered = useMemo(() => articles.filter(article =>
    (active === 'All' || article.category === active) &&
    (!deferredQuery.trim() || [article.title, article.teaser, c(article.category), ...article.tags].some(value => value.toLowerCase().includes(deferredQuery.trim().toLowerCase())))
  ), [active, deferredQuery, language])
  const completed = articles.filter(article => (progress[article.slug] ?? 0) >= 90).length
  const completionPercent = articles.length ? Math.round(completed / articles.length * 100) : 0
  return <main className="workspace-page liquid-page articles-studio">
    <div className="articles-studio-topline">
      <Link to="/academic-skills" className="articles-studio-back"><ArrowLeft size={16} />{c('Additional practice')}</Link>
      <Link to="/vocabulary/articles" className="articles-studio-vocabulary"><BookOpen size={16} />{c('Vocabulary')}<ArrowRight size={14} /></Link>
    </div>
    <header className="articles-studio-hero">
      <div className="articles-studio-intro">
        <p className="articles-studio-eyebrow"><span /><span>{c('Reading Library')}</span></p>
        <h1>{c('Read something worth your time.')}</h1>
        <p className="articles-studio-lead">{c('Explore a topic, learn new words, and build your reading confidence.')}</p>
        <div className="articles-studio-benefits"><span><BookOpen size={15} />{articles.length} {c('articles')}</span><span><Sparkles size={15} />{c('Vocabulary')}</span><span><CheckCircle2 size={15} />{c('Reading progress')}</span></div>
      </div>
      <div className="articles-studio-hero-side">
        <StudyIllustration variant="academic-reading" className="articles-studio-book" />
        <div className="articles-studio-progress">
          <div className="articles-studio-ring" aria-label={`${c('Completed')}: ${completionPercent}%`}>
            <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26" /><circle className="articles-studio-ring-value" cx="32" cy="32" r="26" pathLength="100" strokeDasharray={`${completionPercent} 100`} /></svg>
            <strong>{completionPercent}<small>%</small></strong>
          </div>
          <div><span>{c('Completed')}</span><p><strong>{completed}</strong><span> / {articles.length}</span></p></div>
        </div>
      </div>
    </header>
    <section className="articles-studio-tools" aria-label={c('Reading tools')}>
      <div className="articles-studio-control-row">
        <label className="articles-studio-search"><Search size={20} /><span className="sr-only">{c('Search articles')}</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={c('Search articles or topics')} /></label>
        {query && <button type="button" className="articles-studio-clear" onClick={() => setQuery('')} aria-label={c('Clear search')}><X size={18} /></button>}
        <label className="articles-studio-select"><span className="sr-only">{c('Topic')}</span><select value={active} onChange={event => setActive(event.target.value as Filter)}>{categories.map(category => <option key={category} value={category}>{c(category)}</option>)}</select></label>
      </div>
      <div className="articles-studio-topics" role="group" aria-label={c('Topic')}>
        {categories.map(category => <button key={category} type="button" aria-pressed={active === category} onClick={() => setActive(category)}><span>{c(category)}</span><small>{category === 'All' ? articles.length : articles.filter(article => article.category === category).length}</small></button>)}
      </div>
    </section>
    <div className="articles-studio-results" role="status"><h2>{c(active === 'All' ? 'All articles' : active)}<span>{filtered.length}</span></h2><p>{c('Articles found')}: {filtered.length}</p></div>
    {!filtered.length ? <section className="glass-surface liquid-university-empty"><Search size={28} /><h2>{c('No matching articles')}</h2><p>{c('Try another topic or clear your search.')}</p><button className="liquid-button secondary" onClick={() => { setQuery(''); setActive('All') }}>{c('Show all articles')}</button></section> :
      <div className="liquid-article-grid">{filtered.map(article => {
        const percent = Math.max(0, Math.min(100, progress[article.slug] ?? 0))
        const read = percent >= 90
        return <Link key={article.id} to={`/articles/${article.slug}`} className={`glass-surface liquid-article-card articles-studio-card${read ? ' is-completed' : ''}`}>
          <div className="articles-studio-cover-wrap"><ArticleCover article={article} variant="card" appearance="silver" className="liquid-article-cover" />{read && <span className="articles-studio-read-badge"><CheckCircle2 size={14} />{c('Completed')}</span>}</div>
          <div className="liquid-article-copy"><div className="liquid-article-meta"><span>{c(article.category)}</span><span><Clock3 size={13} />{article.readMinutes} {c('min')}</span></div>
            <h2>{article.title}</h2><p>{article.teaser}</p>
            <div className="liquid-article-bottom"><span><BookOpen size={14} />{articleWordCount(article).toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US')} {c('words')}</span><span className="liquid-text-link">{read && <CheckCircle2 size={15} />}{c(read ? 'Read again' : percent > 0 ? 'Continue' : 'Read')}<ArrowRight size={15} /></span></div>
            {percent > 0 && <progress max={100} value={percent} aria-label={c('Reading progress')} />}
          </div>
        </Link>
      })}</div>}
  </main>
}
