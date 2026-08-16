import { useDeferredValue, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, Bookmark, CheckCircle2, Clock3, Search, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BrandMark } from '@/components/brand/BrandLogo'
import ArticleCover from '@/components/articles/ArticleCover'
import { ProgressRing } from '@/components/fx'
import { articles, articleCategories, articleWordCount } from '@/data/articles'
import type { ArticleCategory } from '@/data/articles'
import { getArticleProgressMap } from '@/utils/articleProgressStore'
import '@/styles/articlesArena.css'

type Filter = ArticleCategory | 'All'

export default function Articles() {
  const navigate = useNavigate()
  const [active, setActive] = useState<Filter>('All')
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const progressMap = useMemo(() => getArticleProgressMap(), [])

  const availableCategories = useMemo<Filter[]>(() => {
    const present = new Set(articles.map((article) => article.category))
    return ['All', ...articleCategories.filter((category) => present.has(category))]
  }, [])

  const categoryCount = useMemo(() => {
    const counts = new Map<Filter, number>([['All', articles.length]])
    for (const article of articles) counts.set(article.category, (counts.get(article.category) ?? 0) + 1)
    return counts
  }, [])

  const filtered = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase()
    return articles.filter((article) => {
      const matchesCategory = active === 'All' || article.category === active
      const matchesQuery = !normalizedQuery || [article.title, article.teaser, ...article.tags]
        .some((value) => value.toLowerCase().includes(normalizedQuery))
      return matchesCategory && matchesQuery
    })
  }, [active, deferredQuery])

  const completedCount = Object.values(progressMap).filter((progress) => progress >= 90).length

  return (
    <div className="articles-arena-page workspace-page min-h-screen overflow-x-clip px-3 py-3 sm:px-5 sm:py-5 lg:px-7">
      <div className="articles-arena-shell mx-auto max-w-[112rem]">
        <header className="articles-arena-hero">
          <div className="articles-arena-topline">
            <button type="button" onClick={() => navigate('/dashboard')} className="articles-arena-back">
              <ArrowLeft /> Dashboard
            </button>
            <div className="articles-arena-brand" aria-label="ProfAI Reading Library">
              <BrandMark size={48} />
              <span>Prof<span>AI</span></span>
              <i />
              <small>Reading Library</small>
            </div>
          </div>

          <div className="articles-arena-hero-grid">
            <div className="articles-arena-intro">
              <span className="articles-arena-kicker"><Sparkles /> Read. Understand. Grow.</span>
              <h1>Reading <em>Library</em></h1>
              <p>{articles.length} focused articles with instant AI word help and vocabulary practice.</p>
            </div>

            <div className="articles-arena-search-stack">
              <label className="articles-arena-search">
                <Search aria-hidden="true" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search articles or topics" aria-label="Search articles" />
                {query ? <button type="button" onClick={() => setQuery('')}>Clear</button> : null}
              </label>
              <div className="articles-arena-benefits" aria-label="Reading tools">
                <span><BookOpen /> Level-matched</span>
                <span><Sparkles /> AI word help</span>
                <span><Bookmark /> Vocabulary sets</span>
              </div>
            </div>

            <div className="articles-arena-summary">
              <span className="articles-arena-summary-mark"><BookOpen /></span>
              <div>
                <small>Your library</small>
                <strong>{completedCount > 0 ? `${completedCount} completed` : `${articles.length} ready to read`}</strong>
                <p>{completedCount > 0 ? 'Keep your reading rhythm moving.' : 'Choose one article and start today.'}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="articles-arena-layout">
          <aside className="articles-topic-panel" aria-label="Article topics">
            <div className="articles-topic-heading">
              <div><small>Browse by</small><h2>Topic</h2></div>
              <span>{articles.length}</span>
            </div>
            <div className="articles-topic-list">
              {availableCategories.map((category) => (
                <button key={category} type="button" onClick={() => setActive(category)} className={active === category ? 'is-active' : ''}>
                  <span>{category}</span><small>{categoryCount.get(category) ?? 0}</small>
                </button>
              ))}
            </div>
          </aside>

          <section className="articles-results" aria-labelledby="articles-results-title">
            <div className="articles-results-head">
              <div><small>{active === 'All' ? 'Curated for focused practice' : active}</small><h2 id="articles-results-title">{filtered.length} {filtered.length === 1 ? 'article' : 'articles'}</h2></div>
              <span>Open any card to enter the distraction-free reader</span>
            </div>

            {filtered.length === 0 ? (
              <div className="articles-empty-state">
                <Search />
                <h2>No matching articles</h2>
                <p>Try another topic or clear your search.</p>
                <button type="button" onClick={() => { setQuery(''); setActive('All') }}>Show all articles</button>
              </div>
            ) : (
              <div className="articles-card-grid">
                {filtered.map((article, index) => {
                  const readPct = progressMap[article.slug] ?? 0
                  const isRead = readPct >= 90
                  return (
                    <button key={article.id} type="button" onClick={() => navigate(`/articles/${article.slug}`)} className={`articles-library-card ${index === 0 ? 'is-featured' : ''}`}>
                      <ArticleCover article={article} variant="card" className="articles-library-cover" />
                      <div className="articles-library-card-body">
                        <div className="articles-library-meta">
                          <span>{article.category}</span>
                          <small><Clock3 /> {article.readMinutes} min</small>
                          {isRead ? <b><CheckCircle2 /> Read</b> : readPct > 0 ? <ProgressRing value={readPct} size={30} stroke={3.5}><span>{readPct}</span></ProgressRing> : null}
                        </div>
                        <h3>{article.title}</h3>
                        <p>{article.teaser}</p>
                        <div className="articles-library-footer">
                          <small><BookOpen /> {articleWordCount(article).toLocaleString()} words · {article.vocabulary.length} vocab</small>
                          <strong>{isRead ? 'Read again' : readPct > 0 ? 'Continue' : 'Read'} <ArrowRight /></strong>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}
