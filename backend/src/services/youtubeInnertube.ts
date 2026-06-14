// Free, key-less transcript engine that actually defeats YouTube's anti-bot wall.
//
// The trick: YouTube now gates both the player API and the caption (timedtext)
// endpoint behind a BotGuard proof-of-origin token (poToken). We mint these
// locally with bgutils-js + jsdom — no API key, no cookie:
//   • a SESSION pot bound to visitorData  -> unlocks player metadata (getInfo)
//   • a CONTENT pot bound to the videoId  -> unlocks the caption text itself
// The caption URL is then fetched as `...&fmt=json3&c=WEB&pot=<contentPot>` with
// the visitor id header. This works from datacenter IPs (verified), so it works
// on a normal server without any setup.
import { Innertube } from 'youtubei.js'
import { BG } from 'bgutils-js'
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

const REQUEST_KEY = 'O43z0dpjhgX20SCx4KAo'
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

// BotGuard needs a DOM. We install jsdom globals once; nothing else server-side
// touches window/document, so this is safe.
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

/** Mint a poToken bound to `identifier` (visitorData for the session, videoId for
 *  content). Returns null if BotGuard is unavailable on this host. */
async function mintPoToken(identifier: string): Promise<string | null> {
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
    if (interpreter) {
      // Runs YouTube's own BotGuard VM to mint the token.
      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      new Function(interpreter)()
    }
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

const SESSION_TTL_MS = 5 * 60 * 60 * 1000
let cached: { yt: Innertube; visitorData: string; ts: number } | null = null
let inflight: Promise<{ yt: Innertube; visitorData: string } | null> | null = null

async function getSession(): Promise<{ yt: Innertube; visitorData: string } | null> {
  if (cached && Date.now() - cached.ts < SESSION_TTL_MS) return cached
  if (inflight) return inflight
  inflight = (async () => {
    try {
      const tmp = await Innertube.create({ retrieve_player: false })
      const visitorData = tmp.session.context.client.visitorData as string
      if (!visitorData) return null
      const sessionPot = await mintPoToken(visitorData)
      if (!sessionPot) return null
      const yt = await Innertube.create({ po_token: sessionPot, visitor_data: visitorData })
      cached = { yt, visitorData, ts: Date.now() }
      return { yt, visitorData }
    } catch {
      return null
    } finally {
      inflight = null
    }
  })()
  return inflight
}

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
  const contentPot = await mintPoToken(videoId)
  const headers: Record<string, string> = { 'User-Agent': BROWSER_UA, 'Accept-Language': 'en', 'X-Goog-Visitor-Id': visitorData }
  // The content-pot form is the one that returns text; the others are harmless
  // fallbacks for hosts that behave differently.
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
  return []
}

/** Reliable metadata + caption text via the poToken path. Never throws. */
export async function fetchViaInnertube(videoId: string): Promise<InnertubeResult | null> {
  const session = await getSession()
  if (!session) return null
  const { yt, visitorData } = session

  let info: any
  try {
    info = await yt.getInfo(videoId)
  } catch {
    cached = null // token may have expired; force a fresh one next time
    return null
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
    cues = await fetchCaptionText(en.base_url as string, videoId, visitorData)

    // Native transcript panel as a last resort.
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
