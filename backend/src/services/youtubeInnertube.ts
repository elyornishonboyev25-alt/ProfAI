// Free, key-less transcript engine that defeats YouTube's anti-bot wall.
//
// YouTube gates the player API and the caption (timedtext) endpoint behind a
// BotGuard proof-of-origin token (poToken). We mint these locally with
// bgutils-js + jsdom — no API key, no cookie:
//   • a SESSION pot bound to visitorData -> unlocks player metadata (getInfo)
//   • a CONTENT pot bound to the videoId -> unlocks the caption text itself
//
// Reliability detail: minting a token the naive way runs a fresh BotGuard
// challenge + integrity-token round-trip EVERY time, which YouTube rate-limits
// quickly ("works, then stops"). Instead we build ONE WebPoMinter, cache it for
// its TTL (hours), and mint every token (session + each video's content pot)
// from it with NO extra network calls. Sessions and minters self-heal on
// failure, so a transient hiccup never sticks.
import { Innertube } from 'youtubei.js'
import { BG, buildURL, getHeaders } from 'bgutils-js'
import { JSDOM } from 'jsdom'

export type InnertubeCue = { start: number; end: number; text: string }

export type InnertubeResult = {
  title: string
  author: string | null
  durationSec: number
  thumbnailUrl: string | null
  hasEnglishCaptions: boolean
  captionKind: 'manual' | 'auto'
  language: string
  cues: InnertubeCue[]
}

export type YouTubeAudio = {
  bytes: Uint8Array
  mimeType: string
  fileName: string
}

export class YouTubeAudioError extends Error {
  code: 'ENGINE_UNAVAILABLE' | 'AUDIO_UNAVAILABLE' | 'AUDIO_TOO_LARGE'

  constructor(code: YouTubeAudioError['code'], message: string) {
    super(message)
    this.name = 'YouTubeAudioError'
    this.code = code
  }
}

const REQUEST_KEY = 'O43z0dpjhgX20SCx4KAo'
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

let domReady = false
function ensureDom() {
  if (domReady) return
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'https://www.youtube.com/' })
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    location: dom.window.location,
    origin: dom.window.origin,
  })
  domReady = true
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/* ── poToken minter (cached, reused for every token) ─────────────────────── */

type Minter = { mintAsWebsafeString: (identifier: string) => Promise<string> }
let minterCache: { minter: Minter; expiresAt: number } | null = null
let minterInflight: Promise<Minter | null> | null = null

async function buildMinter(): Promise<{ minter: Minter; ttlSec: number } | null> {
  ensureDom()
  const bgConfig = {
    fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
    globalObj: globalThis,
    identifier: '',
    requestKey: REQUEST_KEY,
  }
  const challenge = await BG.Challenge.create(bgConfig as never)
  if (!challenge) return null
  const interpreter = challenge.interpreterJavascript?.privateDoNotAccessOrElseSafeScriptWrappedValue
  if (interpreter) {
    // Runs YouTube's own BotGuard VM. eslint-disable-next-line @typescript-eslint/no-implied-eval
    new Function(interpreter)()
  }
  const botguard = await (BG as any).BotGuardClient.create({
    program: challenge.program,
    globalName: challenge.globalName,
    globalObj: globalThis,
  })
  const webPoSignalOutput: unknown[] = []
  const botguardResponse = await botguard.snapshot({ webPoSignalOutput })
  const integrityRes = await fetch(buildURL('GenerateIT', false), {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify([REQUEST_KEY, botguardResponse]),
  })
  const integrityJson: any = await integrityRes.json()
  const [integrityToken, estimatedTtlSecs] = integrityJson
  if (!integrityToken) return null
  const minter = (await (BG as any).WebPoMinter.create(
    { integrityToken, estimatedTtlSecs },
    webPoSignalOutput,
  )) as Minter
  return { minter, ttlSec: Number(estimatedTtlSecs) || 3600 }
}

async function getMinter(force = false): Promise<Minter | null> {
  if (!force && minterCache && Date.now() < minterCache.expiresAt) return minterCache.minter
  if (minterInflight) return minterInflight
  minterInflight = (async () => {
    try {
      const built = await buildMinter()
      if (!built) return null
      const ttlMs = Math.min(built.ttlSec * 1000, 6 * 60 * 60 * 1000)
      minterCache = { minter: built.minter, expiresAt: Date.now() + ttlMs - 60_000 }
      return built.minter
    } catch (e) {
      console.warn('[shadowing] poToken minter build failed:', (e as Error)?.message)
      return null
    } finally {
      minterInflight = null
    }
  })()
  return minterInflight
}

/** Standalone single-shot mint (heavier) used only if the cached minter path is
 *  unavailable, so the engine still works in a degraded state. */
async function mintStandalone(identifier: string): Promise<string | null> {
  try {
    ensureDom()
    const bgConfig = {
      fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, init),
      globalObj: globalThis,
      identifier,
      requestKey: REQUEST_KEY,
    }
    const challenge = await BG.Challenge.create(bgConfig as never)
    if (!challenge) return null
    const interpreter = challenge.interpreterJavascript?.privateDoNotAccessOrElseSafeScriptWrappedValue
    if (interpreter) new Function(interpreter)()
    const result = await BG.PoToken.generate({
      program: challenge.program,
      globalName: challenge.globalName,
      bgConfig: bgConfig as never,
    })
    return result?.poToken ?? null
  } catch {
    return null
  }
}

async function mintToken(identifier: string, force = false): Promise<string | null> {
  const minter = await getMinter(force)
  if (minter) {
    try {
      return await minter.mintAsWebsafeString(identifier)
    } catch {
      // Minter went stale mid-use — rebuild once and retry.
      const fresh = await getMinter(true)
      if (fresh) {
        try {
          return await fresh.mintAsWebsafeString(identifier)
        } catch {
          /* fall through to standalone */
        }
      }
    }
  }
  return mintStandalone(identifier)
}

/* ── InnerTube session (cached) ──────────────────────────────────────────── */

const SESSION_TTL_MS = 5 * 60 * 60 * 1000
let sessionCache: { yt: Innertube; visitorData: string; expiresAt: number } | null = null
let sessionInflight: Promise<{ yt: Innertube; visitorData: string } | null> | null = null

async function getSession(force = false): Promise<{ yt: Innertube; visitorData: string } | null> {
  if (!force && sessionCache && Date.now() < sessionCache.expiresAt) return sessionCache
  if (sessionInflight) return sessionInflight
  sessionInflight = (async () => {
    try {
      const tmp = await Innertube.create({ retrieve_player: false })
      const visitorData = tmp.session.context.client.visitorData as string
      if (!visitorData) return null
      const sessionPot = await mintToken(visitorData)
      if (!sessionPot) return null
      const yt = await Innertube.create({ po_token: sessionPot, visitor_data: visitorData })
      sessionCache = { yt, visitorData, expiresAt: Date.now() + SESSION_TTL_MS }
      return { yt, visitorData }
    } catch (e) {
      console.warn('[shadowing] InnerTube session init failed:', (e as Error)?.message)
      return null
    } finally {
      sessionInflight = null
    }
  })()
  return sessionInflight
}

/**
 * Download the smallest available original audio stream for AI transcription.
 * Bytes are capped from metadata and while streaming so a missing or forged
 * Content-Length can never exhaust server memory.
 */
export async function downloadYouTubeAudio(videoId: string, maxBytes: number): Promise<YouTubeAudio> {
  const session = await getSession()
  if (!session) {
    throw new YouTubeAudioError('ENGINE_UNAVAILABLE', 'The YouTube audio engine is temporarily unavailable.')
  }

  const contentPot = await mintToken(videoId)
  const clients = ['ANDROID', 'IOS', 'TV_EMBEDDED', 'WEB'] as const
  let lastError: unknown = null

  for (const client of clients) {
    try {
    const audioOptions = {
      type: 'audio',
      quality: 'bestefficiency',
      format: 'any',
      language: 'original',
        client,
        po_token: contentPot ?? undefined,
    } as const
      const format = await session.yt.getStreamingData(videoId, audioOptions)

      if (!format.url) continue
      if (format.content_length && format.content_length > maxBytes) {
        throw new YouTubeAudioError('AUDIO_TOO_LARGE', 'The compressed audio is too large for automatic subtitles.')
      }

      // youtubei.js handles the CDN's range requests and decipher parameters.
      const stream = await session.yt.download(videoId, audioOptions)
      const reader = stream.getReader()
      const chunks: Uint8Array[] = []
      let size = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        if (!value) continue
        size += value.byteLength
        if (size > maxBytes) {
          await reader.cancel().catch(() => undefined)
          throw new YouTubeAudioError('AUDIO_TOO_LARGE', 'The compressed audio is too large for automatic subtitles.')
        }
        chunks.push(value)
      }

      const bytes = new Uint8Array(size)
      let offset = 0
      for (const chunk of chunks) {
        bytes.set(chunk, offset)
        offset += chunk.byteLength
      }

      const mimeType = format.mime_type?.split(';')[0] || 'audio/webm'
      const extension = mimeType.includes('mp4') ? 'm4a' : mimeType.includes('mpeg') ? 'mp3' : 'webm'
      return { bytes, mimeType, fileName: `${videoId}.${extension}` }
    } catch (error) {
      if (error instanceof YouTubeAudioError && error.code === 'AUDIO_TOO_LARGE') throw error
      lastError = error
      console.warn('[video-import] audio client failed', videoId, client, (error as Error)?.message)
    }
  }

  console.warn('[video-import] every audio client failed', videoId, (lastError as Error)?.message)
  throw new YouTubeAudioError('AUDIO_UNAVAILABLE', 'Could not retrieve this video audio for transcription.')
}

/* ── caption parsing ─────────────────────────────────────────────────────── */

function decode(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseJson3(text: string): InnertubeCue[] {
  let json: any
  try {
    json = JSON.parse(text)
  } catch {
    return []
  }
  const events: any[] = json?.events ?? []
  const cues: InnertubeCue[] = []
  for (const ev of events) {
    if (!Array.isArray(ev?.segs)) continue
    const t = decode(ev.segs.map((s: any) => s?.utf8 ?? '').join(''))
    if (!t) continue
    const start = (ev.tStartMs ?? 0) / 1000
    const dur = (ev.dDurationMs ?? 0) / 1000
    cues.push({ start, end: start + (dur || 0), text: t })
  }
  return cues
}

function bestThumb(basic: any, videoId: string): string | null {
  const thumbs = basic?.thumbnail
  if (Array.isArray(thumbs) && thumbs.length) return thumbs[thumbs.length - 1]?.url ?? null
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}

async function fetchCaptionText(baseUrl: string, videoId: string, visitorData: string): Promise<InnertubeCue[]> {
  const headers: Record<string, string> = {
    'User-Agent': BROWSER_UA,
    'Accept-Language': 'en',
    'X-Goog-Visitor-Id': visitorData,
  }
  // Two attempts: the second forces a fresh content pot in case the first was
  // stale or momentarily rate-limited.
  for (let attempt = 0; attempt < 2; attempt++) {
    const contentPot = await mintToken(videoId, attempt === 1)
    const urls = [
      contentPot ? `${baseUrl}&fmt=json3&c=WEB&pot=${contentPot}` : '',
      `${baseUrl}&fmt=json3`,
    ].filter(Boolean)
    for (const url of urls) {
      try {
        const res = await fetch(url, { headers })
        const txt = await res.text()
        if (txt && txt.length > 10) {
          const cues = parseJson3(txt)
          if (cues.length) return cues
        }
      } catch {
        // try the next form
      }
    }
    if (attempt === 0) await sleep(600)
  }
  return []
}

/* ── public entry ────────────────────────────────────────────────────────── */

/** Reliable metadata + caption text via the poToken path. Never throws. */
export async function fetchViaInnertube(videoId: string): Promise<InnertubeResult | null> {
  let session = await getSession()
  if (!session) {
    console.warn('[shadowing] InnerTube session unavailable (poToken/BotGuard could not start)')
    return null
  }

  let info: any
  try {
    info = await session.yt.getInfo(videoId)
  } catch {
    // Session/token may be stale — refresh once and retry.
    session = await getSession(true)
    if (!session) return null
    try {
      info = await session.yt.getInfo(videoId)
    } catch (e) {
      console.warn('[shadowing] getInfo failed for', videoId, '-', (e as Error)?.message)
      return null
    }
  }

  const basic = info?.basic_info ?? {}
  const tracks: any[] = info?.captions?.caption_tracks ?? []
  const en =
    tracks.find((t) => /^en/i.test(t.language_code) && t.kind !== 'asr') ||
    tracks.find((t) => /^en/i.test(t.language_code))

  let cues: InnertubeCue[] = []
  let captionKind: 'manual' | 'auto' = 'auto'
  let language = 'en'

  if (en) {
    captionKind = en.kind === 'asr' ? 'auto' : 'manual'
    language = en.language_code || 'en'
    cues = await fetchCaptionText(en.base_url as string, videoId, session.visitorData)

    if (cues.length === 0) {
      try {
        const tr: any = await info.getTranscript()
        const segs: any[] = tr?.transcript?.content?.body?.initial_segments ?? []
        cues = segs
          .map((s) => {
            const start = Number(s.start_ms ?? 0) / 1000
            const end = Number(s.end_ms ?? 0) / 1000
            return { start, end: end || start + 2, text: decode(String(s.snippet?.text ?? '')) }
          })
          .filter((c) => c.text)
      } catch {
        // no transcript panel
      }
    }
  }

  return {
    title: basic.title ?? '',
    author: basic.author ?? basic.channel?.name ?? null,
    durationSec: Number(basic.duration ?? 0) || 0,
    thumbnailUrl: bestThumb(basic, videoId),
    hasEnglishCaptions: !!en,
    captionKind,
    language,
    cues,
  }
}
