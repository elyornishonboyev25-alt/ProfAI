import { useDeferredValue, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock3, Search } from 'lucide-react'
import ArticleCover from '@/components/articles/ArticleCover'
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
  return <main className="workspace-page liquid-page">
    <Link to="/academic-skills" className="liquid-text-link mb-6"><ArrowLeft size={16} />{c('Additional practice')}</Link>
    <header className="liquid-page-heading"><p className="liquid-eyebrow">{c('Reading Library')}</p><h1>{c('Read something worth your time.')}</h1><p>{c('Explore a topic, learn new words, and build your reading confidence.')}</p></header>
    <section className="glass-surface liquid-library-controls" aria-label={c('Reading tools')}>
      <label className="liquid-search-field"><Search size={18} /><span className="sr-only">{c('Search articles')}</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={c('Search articles or topics')} /></label>
      <label className="liquid-filter"><span className="sr-only">{c('Topic')}</span><select value={active} onChange={event => setActive(event.target.value as Filter)}>{categories.map(category => <option key={category} value={category}>{c(category)}</option>)}</select></label>
    </section>
    <div className="liquid-library-meta" role="status"><span>{c('Articles found')}: {filtered.length}</span><span>{c('Completed')}: {completed} / {articles.length}</span></div>
    {!filtered.length ? <section className="glass-surface liquid-university-empty"><Search size={28} /><h2>{c('No matching articles')}</h2><p>{c('Try another topic or clear your search.')}</p><button className="liquid-button secondary" onClick={() => { setQuery(''); setActive('All') }}>{c('Show all articles')}</button></section> :
      <div className="liquid-article-grid">{filtered.map(article => {
        const percent = Math.max(0, Math.min(100, progress[article.slug] ?? 0))
        const read = percent >= 90
        return <Link key={article.id} to={`/articles/${article.slug}`} className="glass-surface liquid-article-card">
          <ArticleCover article={article} variant="card" className="liquid-article-cover" />
          <div className="liquid-article-copy"><div className="liquid-article-meta"><span>{c(article.category)}</span><span><Clock3 size={13} />{article.readMinutes} {c('min')}</span></div>
            <h2>{article.title}</h2><p>{article.teaser}</p>
            <div className="liquid-article-bottom"><span><BookOpen size={14} />{articleWordCount(article).toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US')} {c('words')}</span><span className="liquid-text-link">{read && <CheckCircle2 size={15} />}{c(read ? 'Read again' : percent > 0 ? 'Continue' : 'Read')}<ArrowRight size={15} /></span></div>
            {percent > 0 && <progress max={100} value={percent} aria-label={c('Reading progress')} />}
          </div>
        </Link>
      })}</div>}
  </main>
}
