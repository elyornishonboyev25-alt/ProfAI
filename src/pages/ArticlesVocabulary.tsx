import { ArrowLeft, BookOpenCheck, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CountUp, Reveal, Stagger, StaggerItem, Tilt3D } from '@/components/fx'
import ArticleCover from '@/components/articles/ArticleCover'
import { articles } from '@/data/articles'

export default function ArticlesVocabulary() {
  const navigate = useNavigate()
  const totalTerms = articles.reduce((sum, a) => sum + a.vocabulary.length, 0)

  return (
    <div className="workspace-page relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">

      <div className="relative mx-auto w-full max-w-6xl space-y-6">
        <Reveal>
          <section className="rounded-[2rem] border border-blue-100 bg-white/90 p-6 shadow-[0_30px_70px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="premium-top-controls">
                  <button onClick={() => navigate('/articles')} className="premium-back-btn">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back
                  </button>
                  <span className="premium-top-chip gap-1">
                    <BookOpenCheck className="h-3.5 w-3.5" />
                    Articles Vocabulary
                  </span>
                </div>
                <h1 className="mt-4 text-4xl font-black leading-tight text-slate-900 sm:text-5xl">Article Vocabulary Studio</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  Every article ships with its own set of key words. Pick an article to study its vocabulary with flashcards,
                  matching, quiz, and typing drills — the same way as the IELTS &amp; SAT arenas.
                </p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white px-4 py-3 text-right shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">Article Sets</p>
                <p className="mt-1 text-lg font-extrabold text-slate-900">{articles.length} articles</p>
                <p className="text-sm font-semibold text-blue-700"><CountUp value={totalTerms} /> terms</p>
              </div>
            </div>
          </section>
        </Reveal>

        <Stagger className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {articles.map((article) => (
            <StaggerItem key={article.id} className="h-full">
              <Tilt3D className="h-full rounded-[1.5rem]" max={5}>
                <button
                  onClick={() => navigate(`/vocabulary/articles/${article.slug}`)}
                  className="group flex h-full w-full flex-col overflow-hidden rounded-[1.5rem] border border-blue-100 bg-white text-left shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition hover:border-blue-200 hover:shadow-[0_24px_50px_rgba(37,99,235,0.14)]"
                >
                  <ArticleCover article={article} variant="card" className="h-32 w-full" />
                  <div className="flex flex-1 flex-col p-5">
                    <span className="w-fit rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-700">
                      {article.category}
                    </span>
                    <h2 className="mt-2 text-base font-black leading-snug text-slate-900 line-clamp-2">{article.title}</h2>
                    <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="text-xs font-semibold text-slate-500">{article.vocabulary.length} key terms</span>
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 transition group-hover:gap-2">
                        <Sparkles className="h-3.5 w-3.5" /> Study set
                      </span>
                    </div>
                  </div>
                </button>
              </Tilt3D>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </div>
  )
}
