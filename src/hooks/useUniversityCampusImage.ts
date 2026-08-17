import { useEffect, useState } from 'react'

export type UniversityCampusImage = {
  src: string
  attributionUrl: string
}

type WikidataSearchResult = {
  id: string
  label?: string
  description?: string
}

type WikidataClaim = {
  rank?: 'preferred' | 'normal' | 'deprecated'
  mainsnak?: {
    datavalue?: {
      value?: unknown
    }
  }
}

type WikidataEntity = {
  claims?: {
    P18?: WikidataClaim[]
  }
}

type CommonsImageInfo = {
  width?: number
  height?: number
  mime?: string
  thumburl?: string
  url?: string
  descriptionurl?: string
}

type CommonsPage = {
  index?: number
  title?: string
  imageinfo?: CommonsImageInfo[]
}

const imageCache = new Map<string, Promise<UniversityCampusImage | null>>()
const warmedImages = new Set<string>()
const SESSION_CACHE_PREFIX = 'profai:campus-image:v2:'
const CAMPUS_IMAGE_WIDTH = '1280'

function normalizedUniversityName(name: string) {
  return name
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/^The\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function commonsImage(filename: string): UniversityCampusImage {
  const encodedFilename = encodeURIComponent(filename).replace(/%2F/gi, '/')
  return {
    src: `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodedFilename}?width=${CAMPUS_IMAGE_WIDTH}`,
    attributionUrl: `https://commons.wikimedia.org/wiki/File:${encodedFilename}`,
  }
}

function resultScore(result: WikidataSearchResult, query: string) {
  const label = result.label?.toLowerCase() ?? ''
  const description = result.description?.toLowerCase() ?? ''
  const target = query.toLowerCase()
  let score = 0

  if (label === target) score += 100
  else if (label.includes(target) || target.includes(label)) score += 45
  if (/university|college|institute|polytechnic|higher education/.test(description)) score += 25

  return score
}

async function fetchWikidataCampusImage(name: string): Promise<UniversityCampusImage | null> {
  const query = normalizedUniversityName(name)
  const searchParams = new URLSearchParams({
    action: 'wbsearchentities',
    format: 'json',
    origin: '*',
    language: 'en',
    uselang: 'en',
    type: 'item',
    limit: '5',
    search: query,
  })
  const searchResponse = await fetch(`https://www.wikidata.org/w/api.php?${searchParams}`, { cache: 'force-cache' })
  if (!searchResponse.ok) return null

  const searchPayload = await searchResponse.json() as { search?: WikidataSearchResult[] }
  const candidates = (searchPayload.search ?? [])
    .sort((a, b) => resultScore(b, query) - resultScore(a, query))
    .slice(0, 4)
  if (candidates.length === 0) return null

  const entityParams = new URLSearchParams({
    action: 'wbgetentities',
    format: 'json',
    origin: '*',
    props: 'claims',
    ids: candidates.map((candidate) => candidate.id).join('|'),
  })
  const entityResponse = await fetch(`https://www.wikidata.org/w/api.php?${entityParams}`, { cache: 'force-cache' })
  if (!entityResponse.ok) return null

  const entityPayload = await entityResponse.json() as { entities?: Record<string, WikidataEntity> }
  for (const candidate of candidates) {
    const claims = entityPayload.entities?.[candidate.id]?.claims?.P18 ?? []
    const imageClaim = claims.find((claim) => claim.rank === 'preferred')
      ?? claims.find((claim) => claim.rank !== 'deprecated')
    const filename = imageClaim?.mainsnak?.datavalue?.value
    if (typeof filename === 'string' && filename.trim()) return commonsImage(filename)
  }

  return null
}

async function fetchCommonsCampusImage(name: string): Promise<UniversityCampusImage | null> {
  const query = normalizedUniversityName(name)
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: `${query} campus`,
    gsrnamespace: '6',
    gsrlimit: '16',
    prop: 'imageinfo',
    iiprop: 'url|mime|size',
    iiurlwidth: CAMPUS_IMAGE_WIDTH,
  })
  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, { cache: 'force-cache' })
  if (!response.ok) return null

  const payload = await response.json() as { query?: { pages?: Record<string, CommonsPage> } }
  const pages = Object.values(payload.query?.pages ?? {})
  const negativeWords = /logo|seal|coat.of.arms|emblem|diagram|map|chart|poster|portrait|team|match|ceremony/i
  const positiveWords = /campus|building|hall|court|college|university|aerial|library/i
  const image = pages
    .map((page) => ({ page, info: page.imageinfo?.[0] }))
    .filter(({ page, info }) => {
      if (!info?.width || !info.height || !info.mime?.startsWith('image/')) return false
      return info.width >= 900 && info.width / info.height >= 1.3 && !negativeWords.test(page.title ?? '')
    })
    .sort((a, b) => {
      const aScore = (positiveWords.test(a.page.title ?? '') ? 20 : 0) - (a.page.index ?? 99)
      const bScore = (positiveWords.test(b.page.title ?? '') ? 20 : 0) - (b.page.index ?? 99)
      return bScore - aScore
    })[0]

  const src = image?.info?.thumburl ?? image?.info?.url
  const attributionUrl = image?.info?.descriptionurl
  return src && attributionUrl ? { src, attributionUrl } : null
}

function readSessionImage(cacheKey: string) {
  try {
    const stored = window.sessionStorage.getItem(`${SESSION_CACHE_PREFIX}${cacheKey}`)
    if (!stored) return null
    const parsed = JSON.parse(stored) as UniversityCampusImage
    return parsed.src && parsed.attributionUrl ? parsed : null
  } catch {
    return null
  }
}

function writeSessionImage(cacheKey: string, image: UniversityCampusImage) {
  try {
    window.sessionStorage.setItem(`${SESSION_CACHE_PREFIX}${cacheKey}`, JSON.stringify(image))
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

function firstAvailable(requests: Array<Promise<UniversityCampusImage | null>>) {
  return new Promise<UniversityCampusImage | null>((resolve) => {
    let remaining = requests.length
    for (const request of requests) {
      void request
        .catch(() => null)
        .then((image) => {
          if (image) {
            resolve(image)
            return
          }
          remaining -= 1
          if (remaining === 0) resolve(null)
        })
    }
  })
}

function warmImage(image: UniversityCampusImage | null) {
  if (!image || warmedImages.has(image.src) || typeof Image === 'undefined') return
  warmedImages.add(image.src)
  const preload = new Image()
  preload.decoding = 'async'
  preload.src = image.src
}

function resolveUniversityCampusImage(name: string) {
  const cacheKey = normalizedUniversityName(name).toLowerCase()
  const cached = imageCache.get(cacheKey)
  if (cached) return cached

  const stored = readSessionImage(cacheKey)
  if (stored) {
    const request = Promise.resolve(stored)
    imageCache.set(cacheKey, request)
    return request
  }

  // Wikidata usually provides the canonical institutional image, while the
  // Commons search is a fast fallback. Running them together removes an entire
  // network round trip from profile navigation.
  const request = firstAvailable([
    fetchWikidataCampusImage(name),
    fetchCommonsCampusImage(name),
  ]).then((image) => {
    if (image) writeSessionImage(cacheKey, image)
    return image
  })
  imageCache.set(cacheKey, request)
  return request
}

export function prefetchUniversityCampusImage(name: string) {
  if (!name.trim()) return
  void resolveUniversityCampusImage(name).then(warmImage)
}

export function useUniversityCampusImage(name: string) {
  const [image, setImage] = useState<UniversityCampusImage | null>(null)

  useEffect(() => {
    let active = true
    setImage(null)
    if (!name.trim()) return () => { active = false }

    void resolveUniversityCampusImage(name).then((nextImage) => {
      warmImage(nextImage)
      if (active) setImage(nextImage)
    })

    return () => {
      active = false
    }
  }, [name])

  return image
}
