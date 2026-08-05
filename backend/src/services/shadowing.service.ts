// Shadowing engine.
//
// Given a YouTube link, this turns the clip into a set of sentence-sized
// shadowing segments (each with exact start/end timestamps) the same way a
// shadowing app works: it reads the video's real English subtitle track and
// slices it into natural lines. There is no transcription guesswork — if a
// video has no usable English captions it is rejected, which also enforces the
// "English only" rule for free. A second, separate gate screens out clips that
// are not appropriate for a learning library.
//
// All network calls go YouTube -> our server (never the browser), so there is
// no CORS problem and no API key is required.

import { fetchViaInnertube } from './youtubeInnertube.js'

/** A typed error whose HTTP status + message are safe to show the user. */
export class ShadowingError extends Error {
  statusCode: number
  constructor(message: string, statusCode = 422) {
    super(message)
    this.name = 'ShadowingError'
    this.statusCode = statusCode
  }
}

export type ShadowingSegmentDraft = {
  orderIndex: number
  startSec: number
  endSec: number
  text: string
}

export type ShadowingVideoDraft = {
  youtubeId: string
  title: string
  author: string | null
  thumbnailUrl: string | null
  durationSec: number
  level: string
  accent: string | null
  topic: string | null
  captionKind: 'manual' | 'auto'
  language: string
  wordCount: number
  segments: ShadowingSegmentDraft[]
}

/* ── 1. Parse the YouTube id out of whatever the user pasted ─────────────── */

export function extractYouTubeId(input: string): string | null {
  const raw = input.trim()
  // A bare 11-char id.
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw

  let url: URL
  try {
    url = new URL(raw.startsWith('http') ? raw : `https://${raw}`)
  } catch {
    return null
  }

  const host = url.hostname.replace(/^www\./, '').toLowerCase()
  if (host === 'youtu.be') {
    const id = url.pathname.slice(1).split('/')[0]
    return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null
  }
  if (host.endsWith('youtube.com') || host === 'youtube-nocookie.com') {
    const v = url.searchParams.get('v')
    if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v
    // /embed/ID , /shorts/ID , /live/ID , /v/ID
    const m = url.pathname.match(/\/(?:embed|shorts|live|v)\/([a-zA-Z0-9_-]{11})/)
    if (m) return m[1]
  }
  return null
}

/* ── 2. Fetch the YouTube player response (metadata + caption tracks) ────── */

// Publicly-embedded InnerTube web key (not a secret; it ships in youtube.com).
const INNERTUBE_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8'

// Optional reliability levers (all unset by default — the engine works without
// them, but YouTube's anti-bot measures can block anonymous caption downloads
// from datacenter IPs, in which case one of these makes it dependable):
//  • YOUTUBE_COOKIE   — a logged-in youtube.com cookie string; bypasses the
//                       "Sign in to confirm you're not a bot" wall.
//  • TRANSCRIPT_API_URL + TRANSCRIPT_API_KEY — a transcript provider (e.g.
//                       Supadata) used as the primary, rock-solid source.
const YT_COOKIE = (process.env.YOUTUBE_COOKIE ?? '').trim()
const TRANSCRIPT_API_URL = (process.env.TRANSCRIPT_API_URL ?? '').trim()
const TRANSCRIPT_API_KEY = (process.env.TRANSCRIPT_API_KEY ?? '').trim()
const TRANSCRIPT_API_HEADER = (process.env.TRANSCRIPT_API_HEADER ?? 'x-api-key').trim()

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

function withCookie(headers: Record<string, string>): Record<string, string> {
  return YT_COOKIE ? { ...headers, Cookie: `${headers.Cookie ? headers.Cookie + '; ' : ''}${YT_COOKIE}` } : headers
}

/** oEmbed gives clean title/author/thumbnail without the player API, and it is
 *  far less likely to be blocked — so it is our reliable metadata baseline. */
async function fetchOEmbed(
  videoId: string,
): Promise<{ title: string; author: string | null; thumbnailUrl: string | null } | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { headers: { 'User-Agent': BROWSER_UA, 'Accept-Language': 'en' } },
    )
    if (!res.ok) return null
    const json: any = await res.json()
    return {
      title: json?.title ?? '',
      author: json?.author_name ?? null,
      thumbnailUrl: json?.thumbnail_url ?? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    }
  } catch {
    return null
  }
}

type CaptionTrack = {
  baseUrl: string
  languageCode: string
  kind?: string
  name?: { simpleText?: string; runs?: Array<{ text: string }> }
}

type PlayerData = {
  status: string
  reason: string | null
  title: string
  author: string | null
  durationSec: number
  thumbnailUrl: string | null
  captionTracks: CaptionTrack[]
}

// YouTube's bot wall ("Sign in to confirm you're not a bot") increasingly
// blocks the WEB/IOS clients from datacenter IPs. The ANDROID and the embedded
// TV client are the most reliable for pulling caption tracks without auth, so
// they go first. We try every client and keep the first one that yields English
// captions — a single client being gated never sinks the request.
const CLIENT_CONTEXTS = [
  {
    name: 'android',
    body: {
      context: {
        client: {
          clientName: 'ANDROID',
          clientVersion: '19.09.37',
          androidSdkVersion: 30,
          hl: 'en',
          gl: 'US',
        },
      },
    },
    headers: { 'User-Agent': 'com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip' },
  },
  {
    name: 'tv_embedded',
    body: {
      context: {
        client: { clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER', clientVersion: '2.0', hl: 'en', gl: 'US' },
        thirdParty: { embedUrl: 'https://www.youtube.com' },
      },
    },
    headers: {
      'User-Agent':
        'Mozilla/5.0 (PlayStation; PlayStation 4/12.00) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
    },
  },
  {
    name: 'ios',
    body: {
      context: {
        client: { clientName: 'IOS', clientVersion: '19.09.3', deviceModel: 'iPhone14,3', hl: 'en', gl: 'US' },
      },
    },
    headers: { 'User-Agent': 'com.google.ios.youtube/19.09.3 (iPhone14,3; U; CPU iOS 17_4 like Mac OS X)' },
  },
  {
    name: 'mweb',
    body: {
      context: {
        client: { clientName: 'MWEB', clientVersion: '2.20240620.01.00', hl: 'en', gl: 'US' },
      },
    },
    headers: {
      'User-Agent':
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    },
  },
  {
    name: 'web',
    body: {
      context: {
        client: { clientName: 'WEB', clientVersion: '2.20240620.05.00', hl: 'en', gl: 'US' },
      },
    },
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
    },
  },
] as const

function pickThumb(videoDetails: any, videoId: string): string | null {
  const thumbs = videoDetails?.thumbnail?.thumbnails
  if (Array.isArray(thumbs) && thumbs.length > 0) {
    return thumbs[thumbs.length - 1]?.url ?? null
  }
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}

function parsePlayerResponse(json: any, videoId: string): PlayerData {
  const playability = json?.playabilityStatus ?? {}
  const details = json?.videoDetails ?? {}
  const tracks: CaptionTrack[] =
    json?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? []
  return {
    status: playability.status ?? 'UNKNOWN',
    reason: playability.reason ?? playability.errorScreen?.playerErrorMessageRenderer?.reason?.simpleText ?? null,
    title: details.title ?? '',
    author: details.author ?? null,
    durationSec: Number(details.lengthSeconds ?? 0) || 0,
    thumbnailUrl: pickThumb(details, videoId),
    captionTracks: tracks,
  }
}

async function requestInnerTube(
  client: (typeof CLIENT_CONTEXTS)[number],
  videoId: string,
): Promise<PlayerData | null> {
  try {
    const res = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${INNERTUBE_KEY}`, {
      method: 'POST',
      headers: withCookie({ 'Content-Type': 'application/json', 'Accept-Language': 'en', ...client.headers }),
      body: JSON.stringify({ ...client.body, videoId, contentCheckOk: true, racyCheckOk: true }),
    })
    if (!res.ok) return null
    const json = await res.json()
    return parsePlayerResponse(json, videoId)
  } catch {
    return null
  }
}

async function fetchViaWatchPage(videoId: string): Promise<PlayerData | null> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en&bpctr=9999999999&has_verified=1`, {
      headers: withCookie({
        'User-Agent': BROWSER_UA,
        'Accept-Language': 'en-US,en;q=0.9',
        Cookie: 'CONSENT=YES+1; SOCS=CAI',
      }),
    })
    if (!res.ok) return null
    const html = await res.text()
    const marker = 'ytInitialPlayerResponse'
    const start = html.indexOf(marker)
    if (start === -1) return null
    const braceStart = html.indexOf('{', start)
    if (braceStart === -1) return null
    // Walk braces to find the matching close so we capture the whole object.
    let depth = 0
    let end = -1
    let inStr = false
    let escaped = false
    for (let i = braceStart; i < html.length; i++) {
      const ch = html[i]
      if (inStr) {
        if (escaped) escaped = false
        else if (ch === '\\') escaped = true
        else if (ch === '"') inStr = false
        continue
      }
      if (ch === '"') inStr = true
      else if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) {
          end = i + 1
          break
        }
      }
    }
    if (end === -1) return null
    const json = JSON.parse(html.slice(braceStart, end))
    return parsePlayerResponse(json, videoId)
  } catch {
    return null
  }
}

/** Best-effort: returns the richest player response we can get (captions + meta)
 *  without ever throwing, so the orchestrator can decide what to do with it. */
async function gatherPlayer(videoId: string): Promise<PlayerData | null> {
  let meta: PlayerData | null = null

  for (const client of CLIENT_CONTEXTS) {
    const data = await requestInnerTube(client, videoId)
    if (!data) continue
    if (data.captionTracks.length > 0) return data
    if (!meta && data.title) meta = data
  }

  const page = await fetchViaWatchPage(videoId)
  if (page) {
    if (page.captionTracks.length > 0) return page
    if (!meta && page.title) meta = page
  }

  return meta
}

/** Optional transcript provider (Supadata-style). Inert unless TRANSCRIPT_API_URL
 *  + TRANSCRIPT_API_KEY are configured. Tolerant of a few common response shapes
 *  so it can be pointed at different providers. */
async function fetchViaTranscriptApi(videoId: string): Promise<Cue[] | null> {
  if (!TRANSCRIPT_API_URL || !TRANSCRIPT_API_KEY) return null
  try {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`
    const url = TRANSCRIPT_API_URL.includes('{')
      ? TRANSCRIPT_API_URL.replace('{videoId}', videoId).replace('{url}', encodeURIComponent(watchUrl))
      : `${TRANSCRIPT_API_URL}${TRANSCRIPT_API_URL.includes('?') ? '&' : '?'}url=${encodeURIComponent(watchUrl)}&videoId=${videoId}&lang=en`
    const res = await fetch(url, { headers: { [TRANSCRIPT_API_HEADER]: TRANSCRIPT_API_KEY, Accept: 'application/json' } })
    if (!res.ok) return null
    const json: any = await res.json()
    const rows: any[] =
      (Array.isArray(json) && json) ||
      json?.content ||
      json?.transcript ||
      json?.segments ||
      json?.data ||
      []
    if (!Array.isArray(rows) || rows.length === 0) return null
    const cues: Cue[] = rows
      .map((r) => {
        const text = decodeEntities(String(r.text ?? r.content ?? r.snippet ?? ''))
        const startMs = Number(r.offset ?? r.start ?? r.startMs ?? r.tStartMs ?? 0)
        const durMs = Number(r.duration ?? r.dur ?? r.dDurationMs ?? 0)
        // Heuristic: values over ~1000 are milliseconds, otherwise seconds.
        const start = startMs > 1000 ? startMs / 1000 : startMs
        const dur = durMs > 1000 ? durMs / 1000 : durMs
        return { start, end: start + (dur || 2), text }
      })
      .filter((c) => c.text)
    return cues.length ? cues : null
  } catch {
    return null
  }
}

/* ── 3. Pick the English caption track + download its lines ──────────────── */

function isEnglishCode(code: string) {
  return /^en(-|$)/i.test(code)
}

function pickEnglishTrack(tracks: CaptionTrack[]): { track: CaptionTrack; kind: 'manual' | 'auto' } | null {
  if (tracks.length === 0) return null
  // Manual English captions are cleaner (punctuation, casing) — prefer them.
  const manual = tracks.find((t) => isEnglishCode(t.languageCode) && t.kind !== 'asr')
  if (manual) return { track: manual, kind: 'manual' }
  const auto = tracks.find((t) => isEnglishCode(t.languageCode) && t.kind === 'asr')
  if (auto) return { track: auto, kind: 'auto' }
  return null
}

type Cue = { start: number; end: number; text: string }

function decodeEntities(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchCues(baseUrl: string): Promise<Cue[]> {
  // json3 is the most parseable caption format.
  const url = baseUrl.includes('fmt=') ? baseUrl : `${baseUrl}&fmt=json3`
  const res = await fetch(url, {
    headers: withCookie({ 'User-Agent': BROWSER_UA, 'Accept-Language': 'en', Origin: 'https://www.youtube.com' }),
  })
  if (!res.ok) return []
  const json = await res.json().catch(() => null)
  const events: any[] = json?.events ?? []
  const cues: Cue[] = []
  for (const ev of events) {
    if (!Array.isArray(ev?.segs)) continue
    const text = decodeEntities(ev.segs.map((s: any) => s?.utf8 ?? '').join(''))
    if (!text) continue
    const start = (ev.tStartMs ?? 0) / 1000
    const dur = (ev.dDurationMs ?? 0) / 1000
    cues.push({ start, end: start + (dur || 0), text })
  }
  // Drop the rolling-duplicate artifacts auto-captions sometimes emit (a cue whose
  // text is identical to the previous one or fully repeats it).
  const cleaned: Cue[] = []
  for (const cue of cues) {
    const prev = cleaned[cleaned.length - 1]
    if (prev && (prev.text === cue.text || cue.text.startsWith(prev.text + ' '))) {
      // Extend the previous cue instead of duplicating.
      prev.end = Math.max(prev.end, cue.end)
      if (cue.text.length > prev.text.length) prev.text = cue.text
      continue
    }
    cleaned.push({ ...cue })
  }
  return cleaned
}

/* ── 4. Appropriateness gate ─────────────────────────────────────────────── */

// Conservative: clear slurs + explicit sexual terms. A single mild swear in a
// talk or movie clip should not block it, so we reject on these terms in the
// TITLE, or when they appear repeatedly in the transcript.
const BLOCK_TERMS = [
  'porn',
  'pornhub',
  'xxx',
  'nude',
  'nudes',
  'blowjob',
  'handjob',
  'cumshot',
  'creampie',
  'masturbat',
  'dildo',
  'hentai',
  'nigger',
  'faggot',
  'rape',
  'raping',
  'pedophile',
  'molest',
]

function screenContent(title: string, transcript: string) {
  const t = title.toLowerCase()
  for (const term of BLOCK_TERMS) {
    if (t.includes(term)) {
      throw new ShadowingError('This video does not look appropriate for the learning library.')
    }
  }
  const body = transcript.toLowerCase()
  let hits = 0
  for (const term of BLOCK_TERMS) {
    const matches = body.split(term).length - 1
    hits += matches
    if (term === 'nigger' || term === 'faggot' || term === 'rape' || term === 'pedophile') {
      if (matches > 0) {
        throw new ShadowingError('This video does not look appropriate for the learning library.')
      }
    }
  }
  if (hits >= 4) {
    throw new ShadowingError('This video does not look appropriate for the learning library.')
  }
}

/* ── 5. Slice the caption lines into shadowing segments ──────────────────── */

const MAX_WORDS = 14
const MIN_WORDS = 3
const MAX_DURATION = 7.5
const PAUSE_GAP = 0.8

function collapseRepeats(text: string): string {
  // Auto-captions occasionally double a word at a join ("the the"). Drop the dup.
  return text.replace(/\b(\w+)(\s+\1\b)+/gi, '$1').replace(/\s+/g, ' ').trim()
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length
}

function endsSentence(text: string): boolean {
  return /[.!?]["')\]]?$/.test(text.trim())
}

export function segmentCues(cues: Cue[]): ShadowingSegmentDraft[] {
  const segments: ShadowingSegmentDraft[] = []
  let buffer: Cue[] = []
  let order = 0

  const flush = (forced = false) => {
    if (buffer.length === 0) return
    const text = collapseRepeats(buffer.map((c) => c.text).join(' '))
    const words = countWords(text)
    if (!forced && words < MIN_WORDS) return // keep accumulating tiny fragments
    const startSec = Math.max(0, buffer[0].start)
    const endSec = Math.max(startSec + 0.5, buffer[buffer.length - 1].end)
    if (text) {
      segments.push({ orderIndex: order++, startSec, endSec, text })
    }
    buffer = []
  }

  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i]
    buffer.push(cue)
    const text = buffer.map((c) => c.text).join(' ')
    const words = countWords(text)
    const duration = cue.end - buffer[0].start
    const next = cues[i + 1]
    const gapAhead = next ? next.start - cue.end : Infinity

    const hitSentence = endsSentence(cue.text) && words >= MIN_WORDS
    const hitWords = words >= MAX_WORDS
    const hitDuration = duration >= MAX_DURATION && words >= MIN_WORDS
    const hitPause = gapAhead >= PAUSE_GAP && words >= MIN_WORDS + 1

    if (hitSentence || hitWords || hitDuration || hitPause) {
      flush()
    }
  }
  flush(true)

  // Re-number defensively (skipped tiny flushes can leave gaps).
  return segments.map((seg, index) => ({ ...seg, orderIndex: index }))
}

/* ── 6. Difficulty heuristic from speaking rate ──────────────────────────── */

function estimateLevel(wordCount: number, durationSec: number): string {
  if (durationSec <= 0) return 'Intermediate'
  const wpm = wordCount / (durationSec / 60)
  if (wpm < 110) return 'Beginner'
  if (wpm > 155) return 'Advanced'
  return 'Intermediate'
}

/* ── 7. Orchestrator ─────────────────────────────────────────────────────── */

const MIN_VIDEO_SECONDS = 15
const MAX_SHADOWING_SECONDS = 30 * 60
const MAX_PODCAST_SECONDS = 3 * 60 * 60

type VideoImportMode = 'shadowing' | 'podcast'

function importCopy(mode: VideoImportMode) {
  return mode === 'podcast'
    ? {
        noun: 'podcast',
        engine: 'podcast transcript engine',
        maxSeconds: MAX_PODCAST_SECONDS,
        maxDurationError: 'This podcast is too long. Choose an episode under 3 hours.',
      }
    : {
        noun: 'shadowing video',
        engine: 'shadowing engine',
        maxSeconds: MAX_SHADOWING_SECONDS,
        maxDurationError: 'This video is too long for shadowing. Pick a clip under 30 minutes.',
      }

async function buildVideoDraft(youtubeId: string, mode: VideoImportMode): Promise<ShadowingVideoDraft> {
  const copy = importCopy(mode)
  // Run independent metadata sources together: oEmbed is a strong public-video
  // signal, while the bot-token InnerTube path also brings captions where
  // YouTube allows them.
  const [oembed, innertube] = await Promise.all([
    fetchOEmbed(youtubeId),
    fetchViaInnertube(youtubeId).catch(() => null),
  ])
  const engineRan = innertube !== null

  let cues: Cue[] = []
  let captionKind: 'manual' | 'auto' = 'auto'
  let language = 'en'
  let englishTrackFound = innertube?.hasEnglishCaptions ?? false
  let durationSec = innertube?.durationSec ?? 0
  let fallbackPlayer: PlayerData | null = null

  // 1) Reliable transcript provider, if an admin configured one.
  const apiCues = await fetchViaTranscriptApi(youtubeId)
  if (apiCues && apiCues.length > 0) {
    cues = apiCues
    captionKind = 'manual'
  }

  // 2) Bot-token InnerTube captions (best free path).
  if (cues.length === 0 && innertube && innertube.cues.length > 0) {
    cues = innertube.cues.map((c) => ({ start: c.start, end: c.end, text: c.text }))
    captionKind = innertube.captionKind
    language = innertube.language
  }

  // 3) Legacy free fallback: anonymous multi-client + watch-page caption fetch.
  if (cues.length === 0) {
    fallbackPlayer = await gatherPlayer(youtubeId)
    if (fallbackPlayer) {
      if (!durationSec) durationSec = fallbackPlayer.durationSec
      const english = pickEnglishTrack(fallbackPlayer.captionTracks)
      if (english) {
        englishTrackFound = true
        captionKind = english.kind
        language = english.track.languageCode || 'en'
        cues = await fetchCues(english.track.baseUrl)
      }
    }
  }

  if (cues.length === 0) {
    // Some unavailable/private videos still make youtubei.js return an empty
    // info object. Treating that as a successful engine run produced the very
    // misleading "no English subtitles" message. Require real metadata from at
    // least one independent source before blaming captions.
    const hasMetadata = Boolean(oembed?.title || innertube?.title || fallbackPlayer?.title)
    if (!hasMetadata) {
      console.warn(
        '[video-import] unavailable YouTube source',
        youtubeId,
        fallbackPlayer?.status ?? 'UNKNOWN',
        fallbackPlayer?.reason ?? '',
      )
      throw new ShadowingError(
        'This YouTube video is unavailable. It may be private, removed, region/age restricted, or the link may be incorrect. Open the link in YouTube first, then choose a public embeddable video.',
        422,
      )
    }
    if (englishTrackFound) {
      // The video HAS English captions but YouTube refused to hand the text to
      // this server (anti-bot / proof-of-origin wall).
      throw new ShadowingError(
        `YouTube is temporarily blocking this ${copy.noun}'s subtitle download. The video has English captions; please retry shortly.`,
        502,
      )
    }
    if (!engineRan) {
      // The poToken/BotGuard engine never started — almost always a stale
      // deployment (missing youtubei.js/bgutils/jsdom deps or old code) or a
      // server that just booted. This is NOT a problem with the video itself.
      throw new ShadowingError(
        `The ${copy.engine} is temporarily unavailable. Please retry in a minute.`,
        503,
      )
    }
    throw new ShadowingError(
      `This ${copy.noun} has no readable English subtitles. Turn on English CC in YouTube first, or choose another public video with captions.`,
    )
  }

  const lastEnd = cues[cues.length - 1]?.end ?? 0
  if (!durationSec) durationSec = Math.round(lastEnd)

  if (durationSec && durationSec > copy.maxSeconds) {
    throw new ShadowingError(copy.maxDurationError)
  }
  if (durationSec && durationSec < MIN_VIDEO_SECONDS) {
    throw new ShadowingError('This clip is too short to shadow. Pick a video of at least 15 seconds.')
  }

  const title = innertube?.title || oembed?.title || 'Untitled clip'
  const fullText = cues.map((c) => c.text).join(' ')
  screenContent(title, fullText)

  const segments = segmentCues(cues)
  if (segments.length < 2) {
    throw new ShadowingError(`This ${copy.noun} does not contain enough spoken English to build a transcript.`)
  }

  const wordCount = countWords(segments.map((s) => s.text).join(' '))
  const finalDuration = Math.round(durationSec || segments[segments.length - 1].endSec || lastEnd)

  return {
    youtubeId,
    title,
    author: innertube?.author || oembed?.author || null,
    thumbnailUrl: innertube?.thumbnailUrl || oembed?.thumbnailUrl || `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
    durationSec: finalDuration,
    level: estimateLevel(wordCount, finalDuration),
    accent: null,
    topic: null,
    captionKind,
    language,
    wordCount,
    segments,
  }
}

export function buildShadowingDraft(youtubeId: string): Promise<ShadowingVideoDraft> {
  return buildVideoDraft(youtubeId, 'shadowing')
}

export function buildPodcastDraft(youtubeId: string): Promise<ShadowingVideoDraft> {
  return buildVideoDraft(youtubeId, 'podcast')
}
