import { prepareShadowingLesson } from './shadowingLesson.js'
import catalog from '../data/educationalMedia.json' with { type: 'json' }
import { prisma } from '../lib/prisma.js'
import { buildPodcastDraft, buildShadowingDraft } from './shadowing.service.js'

export type MediaKind = 'shadowing' | 'podcasts'
type CatalogEntry = (typeof catalog.shadowing)[number]
const runtime = prisma as unknown as Record<string, any>
const pending = new Map<string, Promise<any>>()
const cached = new Map<string, { expires: number; detail: any }>()

async function within<T>(work: Promise<T>, fallback: T, milliseconds: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try { return await Promise.race([work, new Promise<T>(resolve => { timer = setTimeout(() => resolve(fallback), milliseconds) })]) }
  finally { if (timer) clearTimeout(timer) }
}

export function educationalCatalog(kind: MediaKind) { return catalog[kind] }
export function approvedMedia(kind: MediaKind, id: string) { return educationalCatalog(kind).find(item => item.youtubeId === id) }
export function educationalSummary(item: CatalogEntry) {
  return {
    id: `curated-${item.youtubeId}`, youtubeId: item.youtubeId, title: item.title, author: item.source,
    thumbnailUrl: item.thumbnailUrl, durationSec: item.durationSec,
    level: item.cefr === 'A2' ? 'Beginner' : item.cefr === 'C1' ? 'Advanced' : 'Intermediate',
    cefr: item.cefr, accent: item.source === 'BBC Learning English' ? 'British' : 'American',
    topic: item.category, focus: item.focus, captionKind: 'unavailable', language: 'en',
    segmentCount: 0, wordCount: 0, playCount: 0, createdAt: `${item.verifiedAt}T00:00:00.000Z`,
  }
}

/** Only approved IDs reach extraction or saved caption retrieval. Old submissions stay archived. */
export async function educationalDetail(kind: MediaKind, item: CatalogEntry) {
  const summary = { ...educationalSummary(item), durationSec: kind === 'shadowing' ? Math.min(120, item.durationSec) : item.durationSec }
  const prepare = (detail: any) => {
    if (kind !== 'shadowing') return detail
    const lesson = prepareShadowingLesson(detail.segments, item.durationSec)
    const segments = lesson.segments.map((segment, index) => ({ ...segment, id: `shadowing:${item.youtubeId}:${index}` }))
    return { ...detail, ...lesson, segments, segmentCount: segments.length, wordCount: lesson.captions.reduce((total, cue) => total + cue.text.split(/\s+/).length, 0) }
  }
  const fallback = { ...summary, segments: [] }
  const key = `${kind}:${item.youtubeId}`
  const memory = cached.get(key)
  if (memory && memory.expires > Date.now()) return memory.detail
  const delegate = kind === 'shadowing' ? runtime.shadowingVideo : runtime.podcastVideo
  try {
    const saved = await within<any>(delegate.findUnique({ where: { youtubeId: item.youtubeId }, include: { segments: { orderBy: { orderIndex: 'asc' } } } }), null, 1500)
    if (saved?.segments?.length) return prepare({ ...saved, ...summary, captionKind: saved.captionKind, segmentCount: saved.segments.length, wordCount: saved.wordCount, segments: saved.segments })
  } catch { /* Catalog playback must not depend on database health. */ }

  let job = pending.get(key)
  if (!job) {
    job = (async () => {
      try {
        const draft = await (kind === 'shadowing' ? buildShadowingDraft(item.youtubeId) : buildPodcastDraft(item.youtubeId))
        if (!draft.segments.length) return fallback
        const segments = draft.segments.map((segment, index) => ({ ...segment, id: `${key}:${index}` }))
        const detail = prepare({ ...summary, captionKind: draft.captionKind, segmentCount: segments.length, wordCount: draft.wordCount, segments })
        const data = {
          title: summary.title, author: summary.author, thumbnailUrl: summary.thumbnailUrl,
          durationSec: summary.durationSec, level: summary.level, accent: summary.accent, topic: summary.topic,
          captionKind: draft.captionKind, language: 'en', segmentCount: segments.length, wordCount: draft.wordCount,
          segments: { create: draft.segments },
        }
        // Persistence is best-effort and cannot hold a usable transcript hostage to database latency.
        void delegate.upsert({ where: { youtubeId: item.youtubeId }, create: { youtubeId: item.youtubeId, ...data }, update: { ...data, segments: { deleteMany: {}, create: draft.segments } } }).catch(() => null)
        return detail
      } catch { return fallback }
    })().then(detail => {
      // A failed shadowing download must not make the Retry captions button inert.
      if (kind !== 'shadowing' || detail.captions?.length) cached.set(key, { detail, expires: Date.now() + (detail.segments.length ? 300000 : 120000) })
      return detail
    }).finally(() => pending.delete(key))
    pending.set(key, job)
  }
  // The in-flight extraction may fill the cache later; never leave the player waiting indefinitely.
  return within(job, fallback, 12000)
}
