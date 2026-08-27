import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  AudioLines,
  CheckCircle2,
  Clock,
  Globe,
  Layers,
  Loader2,
  Mic,
  Plus,
  ShieldCheck,
  Sparkles,
  Wand2,
  Youtube,
} from 'lucide-react'
import { AmbientBackdrop, BrandIcon, CountUp, Reveal, Stagger, StaggerItem, Tilt3D } from '@/components/fx'
import { ApiError } from '@/lib/apiClient'
import { formatClock } from '@/lib/youtube'
import ShadowingPlayer from '@/components/shadowing/ShadowingPlayer'
import { useAuthStore, type AuthState } from '@/store/authStore'
import { canSubmitCommunityVideo } from '@/utils/videoSubmissionAccess'
import {
  getShadowingVideo,
  listShadowingVideos,
  submitShadowingVideo,
  type ShadowingVideoDetail,
  type ShadowingVideoSummary,
} from '@/services/shadowing'

// A few hand-picked English clips with clean captions, offered as one-click
// adds so the library is never a dead end on a fresh install.
const SUGGESTED: Array<{ label: string; url: string }> = [
  { label: 'Steve Jobs — Stay Hungry', url: 'https://www.youtube.com/watch?v=UF8uR6Z6KLc' },
  { label: 'Inspiring 3-min talk', url: 'https://www.youtube.com/watch?v=mgmVOuLgFB0' },
  { label: 'Everyday English', url: 'https://www.youtube.com/watch?v=P26AE7NLx4Q' },
]

function levelBadge(level: string) {
  if (level === 'Beginner') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (level === 'Advanced') return 'border-indigo-200 bg-indigo-50 text-indigo-700'
  return 'border-amber-200 bg-amber-50 text-amber-700'
}

export default function ShadowingLab() {
  const navigate = useNavigate()
  const user = useAuthStore((state: AuthState) => state.user)
  const canSubmitVideo = canSubmitCommunityVideo(user)

  const [videos, setVideos] = useState<ShadowingVideoSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [url, setUrl] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [openingId, setOpeningId] = useState<string | null>(null)
  const [active, setActive] = useState<ShadowingVideoDetail | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const list = await listShadowingVideos()
      setVideos(list)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load the shadowing library.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const upsertIntoList = useCallback((video: ShadowingVideoDetail) => {
    setVideos((prev) => {
      const without = prev.filter((v) => v.youtubeId !== video.youtubeId)
      const summary: ShadowingVideoSummary = { ...video }
      return [summary, ...without]
    })
  }, [])

  const handleSubmit = useCallback(
    async (rawUrl?: string) => {
      const target = (rawUrl ?? url).trim()
      if (!canSubmitVideo || !target || submitting) return
      setSubmitting(true)
      setSubmitError(null)
      setNotice(null)
      try {
        const { video, created } = await submitShadowingVideo(target)
        upsertIntoList(video)
        setActive(video)
        setUrl('')
        setNotice(
          created
            ? 'Saved to the shared library — everyone can shadow it now.'
            : 'This clip was already in the library — opening it.',
        )
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Something went wrong. Try another link.'
        setSubmitError(message)
      } finally {
        setSubmitting(false)
      }
    },
    [canSubmitVideo, url, submitting, upsertIntoList],
  )

  const openVideo = useCallback(async (youtubeId: string) => {
    setOpeningId(youtubeId)
    setSubmitError(null)
    try {
      const detail = await getShadowingVideo(youtubeId)
      setActive(detail)
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not open this clip.')
    } finally {
      setOpeningId(null)
    }
  }, [])

  const stats = useMemo(() => {
    const lines = videos.reduce((sum, v) => sum + (v.segmentCount || 0), 0)
    return { clips: videos.length, lines }
  }, [videos])

  // ── Player view ──────────────────────────────────────────────────────
  if (active) {
    return (
      <div className="workspace-page relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
        <AmbientBackdrop variant="red" />
        <div className="relative">
          <ShadowingPlayer video={active} onBack={() => setActive(null)} />
        </div>
      </div>
    )
  }

  // ── Library view ─────────────────────────────────────────────────────
  return (
    <div className="workspace-page relative min-h-screen overflow-hidden px-4 py-8 sm:px-6 lg:px-10">
      <AmbientBackdrop variant="red" />

      <div className="relative mx-auto w-full max-w-6xl space-y-6">
        {/* Hero */}
        <Reveal>
          <section className="premium-hero p-6 sm:p-9">
            <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start">
              <div>
                <div className="premium-top-controls">
                  <button onClick={() => navigate('/academic-skills')} className="premium-back-btn">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Academic Skills
                  </button>
                  <span className="premium-top-chip">
                    <AudioLines className="h-3.5 w-3.5" />
                    Shadowing Lab
                  </span>
                </div>
                <h1 className="premium-section-title mt-4">
                  Shadow any <span className="arena-title-accent-red">English video</span>
                </h1>
                <p className="premium-section-subtitle max-w-2xl">
                  Paste a YouTube link and we split it into sentence-by-sentence shadowing lines — loop each line,
                  slow it down, record yourself and compare. Every clip you add is saved for the whole community.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 xl:w-full">
                <div className="hero-metric-card interactive-lift">
                  <p className="hero-metric-label">Clips</p>
                  <p className="hero-metric-value-sm">
                    <CountUp value={stats.clips} />
                  </p>
                  <p className="hero-metric-note">In the library</p>
                </div>
                <div className="hero-metric-card interactive-lift">
                  <p className="hero-metric-label">Lines</p>
                  <p className="hero-metric-value-sm">
                    <CountUp value={stats.lines} />
                  </p>
                  <p className="hero-metric-note">To shadow</p>
                </div>
                <div className="hero-metric-card interactive-lift">
                  <p className="hero-metric-label">Source</p>
                  <p className="hero-metric-value-sm hero-metric-value-compact">YouTube</p>
                  <p className="hero-metric-note">English only</p>
                </div>
              </div>
            </div>
          </section>
        </Reveal>

        {/* Adding shared clips is intentionally limited to the authorised curators. */}
        {canSubmitVideo ? (
          <Reveal delay={0.05}>
            <section className="surface-card p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <BrandIcon icon={Wand2} soft />
              <div>
                <h2 className="text-lg font-bold text-slate-900">Add a video to shadow</h2>
                <p className="text-xs text-slate-500">
                  English videos with subtitles only — we check the language and screen the content automatically.
                </p>
              </div>
            </div>

            <form
              className="mt-4 flex flex-col gap-2 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault()
                void handleSubmit()
              }}
            >
              <div className="relative flex-1">
                <Youtube className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-500" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste a YouTube link — youtube.com/watch?v=… or youtu.be/…"
                  disabled={submitting}
                  className="w-full rounded-2xl border border-blue-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 disabled:opacity-60"
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !url.trim()}
                className="cta-sheen inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#1D4ED8] px-6 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(37,99,235,0.3)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {submitting ? 'Analyzing…' : 'Add & shadow'}
              </button>
            </form>

            {submitting ? (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs font-semibold text-blue-700">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Reading the English captions and slicing them into shadowing lines… this can take a few seconds.
              </div>
            ) : null}
            {submitError ? (
              <p className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700">
                {submitError}
              </p>
            ) : null}
            {notice ? (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {notice}
              </p>
            ) : null}

            {/* Suggested + safety note */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Try:</span>
              {SUGGESTED.map((s) => (
                <button
                  key={s.url}
                  type="button"
                  disabled={submitting}
                  onClick={() => void handleSubmit(s.url)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-white px-3 py-1.5 text-[11px] font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50"
                >
                  <Sparkles className="h-3 w-3" />
                  {s.label}
                </button>
              ))}
            </div>
            <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Only English, embeddable, appropriate videos are accepted. Inappropriate or caption-less links are rejected.
            </p>
            </section>
          </Reveal>
        ) : null}

        {/* Library */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="inline-flex items-center gap-2 text-xl font-bold text-slate-900">
              <Layers className="h-5 w-5 text-blue-600" />
              Community library
            </h2>
            <span className="soft-chip">{videos.length} clip{videos.length === 1 ? '' : 's'}</span>
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-60 animate-pulse rounded-2xl border border-blue-100 bg-white/70" />
              ))}
            </div>
          ) : loadError ? (
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-6 text-center">
              <p className="text-sm font-semibold text-indigo-700">{loadError}</p>
              <button onClick={() => void refresh()} className="premium-back-btn-sm mt-3">
                <Loader2 className="h-3.5 w-3.5" />
                Retry
              </button>
            </div>
          ) : videos.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-blue-200 bg-white/70 p-10 text-center">
              <BrandIcon icon={AudioLines} soft />
              <h3 className="mt-3 text-base font-bold text-slate-900">The library is empty.</h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                {canSubmitVideo
                  ? 'Paste an English YouTube link above (or tap a suggestion) to add the first shadowing clip.'
                  : 'New shadowing clips will appear here when they are published.'}
              </p>
            </div>
          ) : (
            <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((v) => {
                const isOpening = openingId === v.youtubeId
                return (
                  <StaggerItem key={v.id} className="h-full">
                    <Tilt3D className="h-full rounded-2xl" max={5}>
                      <button
                        type="button"
                        onClick={() => void openVideo(v.youtubeId)}
                        disabled={isOpening}
                        className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-blue-100 bg-white text-left shadow-[0_10px_26px_rgba(225,29,72,0.08)] transition hover:border-blue-200 hover:shadow-[0_16px_34px_rgba(225,29,72,0.14)]"
                      >
                        <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                          {v.thumbnailUrl ? (
                            <img
                              src={v.thumbnailUrl}
                              alt={v.title}
                              loading="lazy"
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
                              <AudioLines className="h-8 w-8 text-blue-400" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/30">
                            <span className="flex h-12 w-12 scale-90 items-center justify-center rounded-full bg-white/90 text-blue-600 opacity-0 shadow-lg transition group-hover:scale-100 group-hover:opacity-100">
                              {isOpening ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />}
                            </span>
                          </div>
                          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-bold text-white">
                            <Clock className="h-3 w-3" />
                            {formatClock(v.durationSec)}
                          </span>
                          <span className={`absolute right-2 top-2 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${levelBadge(v.level)}`}>
                            {v.level}
                          </span>
                        </div>
                        <div className="flex flex-1 flex-col p-4">
                          <h3 className="line-clamp-2 text-sm font-bold text-slate-900">{v.title}</h3>
                          {v.author ? <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-slate-500">{v.author}</p> : null}
                          <div className="mt-auto flex items-center gap-3 pt-3 text-[11px] font-semibold text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Layers className="h-3.5 w-3.5 text-blue-500" />
                              {v.segmentCount} lines
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Globe className="h-3.5 w-3.5 text-blue-500" />
                              {v.captionKind === 'manual' ? 'Subtitles' : 'Auto'}
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
        </section>
      </div>
    </div>
  )
}
