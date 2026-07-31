import { useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Clock3, Search, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AmbientBackdrop, CountUp, ProgressRing, Reveal, Stagger, StaggerItem, Tilt3D } from '@/components/fx'
import ArticleCover from '@/components/articles/ArticleCover'
import { articles, articleCategories, ARTICLE_LIBRARY_TARGET, articleWordCount } from '@/data/articles'
import type { ArticleCategory } from '@/data/articles'
import { getArticleProgressMap } from '@/utils/articleProgressStore'

type Filter = ArticleCategory | 'All'

export default function Articles() {
  const navigate = useNavigate()
  const [active, setActive] = useState<Filter>('All')
  const [query, setQuery] = useState('')
  // Reading progress per slug (written by the reader as you scroll).
  const progressMap = useMemo(() => getArticleProgressMap(), [])

  // Only show category chips that actually have at least one article, plus "All".
  const availableCategories = useMemo<Filter[]>(() => {
    const present = new Set(articles.map((a) => a.category))
    return ['All', ...articleCategories.filter((c) => present.has(c))]
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return articles.filter((article) => {
      const matchesCategory = active === 'All' || article.category === active
      const matchesQuery =
        !q ||
        article.title.toLowerCase().includes(q) ||
        article.teaser.toLowerCase().includes(q) ||
        article.tags.some((tag) => tag.toLowerCase().includes(q))
      return matchesCategory && matchesQuery
    })
  }, [active, query])

  return (
    <div className="workspace-page relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <AmbientBackdrop variant="red" />

      <div className="relative mx-auto w-full max-w-6xl space-y-6">
        <Reveal>
          <section className="premium-hero p-6 sm:p-9">
            <div className="relative grid gap-4 xl:grid-cols-[minmax(0,1fr)_25rem] xl:items-start">
              <div>
                <div className="premium-top-controls">
                  <button onClick={() => navigate('/dashboard')} className="premium-back-btn">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Dashboard
                  </button>
                  <span className="premium-top-chip">
                    <Sparkles className="h-3.5 w-3.5" />
                    Reading Library
                  </span>
                </div>
                <h1 className="premium-section-title mt-4">
                  Real <span className="arena-title-accent-red">Articles</span> to read &amp; grow
                </h1>
                <p className="premium-section-subtitle max-w-3xl">
                  Carefully selected English articles with a calm, distraction-free reader — adjust text size and contrast,
                  highlight ideas, take notes, and tap any word to get an instant AI explanation.
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-3 xl:w-full">
                <div className="hero-metric-card interactive-lift">
                  <p className="hero-metric-label">Articles</p>
                  <p className="hero-metric-value-sm">
                    <CountUp value={articles.length} />
                  </p>
                  <p className="hero-metric-note">Live to read now</p>
                </div>
                <div className="hero-metric-card interactive-lift">
                  <p className="hero-metric-label">Growing to</p>
                  <p className="hero-metric-value-sm">
                    <CountUp value={ARTICLE_LIBRARY_TARGET} />
                  </p>
                  <p className="hero-metric-note">Curated reads</p>
                </div>
                <div className="hero-metric-card interactive-lift">
                  <p className="hero-metric-label">Per article</p>
                  <p className="hero-metric-value-sm hero-metric-value-compact">AI + Vocab</p>
                  <p className="hero-metric-note">Word help &amp; study set</p>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((category) => {
                const isActive = active === category
                return (
                  <button
                    key={category}
                    onClick={() => setActive(category)}
                    className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? 'border-red-300 bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_10px_22px_rgba(220,38,38,0.28)]'
                        : 'border-red-200 bg-white text-slate-700 hover:border-red-300 hover:text-red-700'
                    }`}
                  >
                    {category}
                  </button>
                )
              })}
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search articles…"
                className="h-11 w-full rounded-xl border border-red-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            </div>
          </div>
        </Reveal>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-red-100 bg-white p-10 text-center text-slate-500">
            No articles match your search yet.
          </div>
        ) : (
          <Stagger key={`${active}-${query}`} className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((article) => {
              const readPct = progressMap[article.slug] ?? 0
              const isRead = readPct >= 90
              return (
              <StaggerItem key={article.id} className="h-full">
                <Tilt3D className="h-full rounded-[1.5rem]" max={5}>
                  <button
                    onClick={() => navigate(`/articles/${article.slug}`)}
                    className="group flex h-full w-full flex-col overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white text-left shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition hover:border-red-200 hover:shadow-[0_24px_50px_rgba(220,38,38,0.14)]"
                  >
                    <ArticleCover article={article} variant="card" className="h-40 w-full" />
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-red-700">
                          {article.category}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                          <Clock3 className="h-3 w-3" />
                          {article.readMinutes} min
                        </span>
                        {/* Reading progress (concept: 21-Reading-Catalog) */}
                        {isRead ? (
                          <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Read
                          </span>
                        ) : readPct > 0 ? (
                          <span className="ml-auto">
                            <ProgressRing value={readPct} size={26} stroke={3.5}>
                              <span className="text-[8px] font-black text-red-600">{readPct}</span>
                            </ProgressRing>
                          </span>
                        ) : null}
                      </div>
                      <h2 className="mt-3 text-lg font-black leading-snug tracking-tight text-slate-900 line-clamp-2">
                        {article.title}
                      </h2>
                      <p className="mt-2 flex-1 text-[13px] leading-6 text-slate-600 line-clamp-3">{article.teaser}</p>
                      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                          <BookOpen className="h-3.5 w-3.5" />
                          {articleWordCount(article).toLocaleString()} words · {article.vocabulary.length} vocab
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 transition group-hover:gap-2">
                          {isRead ? 'Read again' : readPct > 0 ? 'Continue' : 'Read'}
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </button>
                </Tilt3D>
              </StaggerItem>
              )
            })}
          </Stagger>
        )}
      </div>
    </div>
  )
}
