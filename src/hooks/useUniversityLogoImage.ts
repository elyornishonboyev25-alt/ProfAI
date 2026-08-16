import { useEffect, useState } from 'react'

type LogoState = string | null

type QueueEntry = {
  name: string
  resolve: (logo: LogoState) => void
}

type WikiPage = {
  title?: string
  missing?: boolean
  pageprops?: { wikibase_item?: string }
}

type WikiAlias = { from: string; to: string }

type WikidataSearchResult = {
  id: string
  label?: string
  description?: string
}

const logoCache = new Map<string, Promise<LogoState>>()
let queue: QueueEntry[] = []
let queueScheduled = false

const officialLogoOverrides: Record<string, string> = {
  // NUS does not currently expose a P154/P94 logo on Wikidata. Use the full-colour
  // official mark distributed with the university's press material.
  'national university of singapore': 'https://mma.prnewswire.com/media/291548/national_university_of_singapore_logo.jpg',
}

function universityKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function wikipediaTitle(name: string) {
  return name
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/^The\s+/i, '')
    .replace(/,\s*Singapore\s*$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function chunks<T>(items: T[], size: number) {
  const result: T[][] = []
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size))
  return result
}

async function fetchLogos(ids: string[]) {
  const logos = new Map<string, string>()
  for (const group of chunks([...new Set(ids)], 40)) {
    if (group.length === 0) continue
    const query = `SELECT ?item ?coat ?logo WHERE { VALUES ?item { ${group.map((id) => `wd:${id}`).join(' ')} } OPTIONAL { ?item wdt:P94 ?coat. } OPTIONAL { ?item wdt:P154 ?logo. } }`
    const params = new URLSearchParams({
      query,
      format: 'json',
    })
    const response = await fetch(`https://query.wikidata.org/sparql?${params}`)
    if (!response.ok) continue
    const payload = await response.json() as {
      results?: {
        bindings?: Array<{
          item?: { value?: string }
          coat?: { value?: string }
          logo?: { value?: string }
        }>
      }
    }
    for (const binding of payload.results?.bindings ?? []) {
      const id = binding.item?.value?.match(/Q\d+$/)?.[0]
      const image = binding.coat?.value ?? binding.logo?.value
      if (id && image && !logos.has(id)) logos.set(id, image.replace(/^http:/, 'https:'))
    }
  }
  return logos
}

async function searchLogo(name: string): Promise<LogoState> {
  const title = wikipediaTitle(name)
  const params = new URLSearchParams({
    action: 'wbsearchentities',
    format: 'json',
    origin: '*',
    language: 'en',
    uselang: 'en',
    type: 'item',
    limit: '4',
    search: title,
  })
  const response = await fetch(`https://www.wikidata.org/w/api.php?${params}`)
  if (!response.ok) return null
  const payload = await response.json() as { search?: WikidataSearchResult[] }
  const target = universityKey(title)
  const candidates = (payload.search ?? []).sort((a, b) => {
    const score = (result: WikidataSearchResult) => {
      const label = universityKey(result.label ?? '')
      const description = result.description?.toLowerCase() ?? ''
      return (label === target ? 100 : label.includes(target) || target.includes(label) ? 45 : 0)
        + (/university|college|institute|polytechnic|higher education/.test(description) ? 25 : 0)
    }
    return score(b) - score(a)
  })
  const logos = await fetchLogos(candidates.map((candidate) => candidate.id))
  for (const candidate of candidates) {
    const logo = logos.get(candidate.id)
    if (logo) return logo
  }
  return null
}

async function fetchLogoBatch(entries: QueueEntry[]) {
  const titleByKey = new Map(entries.map((entry) => [universityKey(entry.name), wikipediaTitle(entry.name)]))
  const titles = [...new Set(titleByKey.values())]
  const itemByInputKey = new Map<string, string>()

  for (const titleGroup of chunks(titles, 40)) {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      origin: '*',
      redirects: '1',
      converttitles: '1',
      prop: 'pageprops',
      ppprop: 'wikibase_item',
      titles: titleGroup.join('|'),
    })
    const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`)
    if (!response.ok) continue
    const payload = await response.json() as {
      query?: {
        normalized?: WikiAlias[]
        redirects?: WikiAlias[]
        pages?: Record<string, WikiPage>
      }
    }
    const aliases = new Map<string, string>()
    for (const alias of [...(payload.query?.normalized ?? []), ...(payload.query?.redirects ?? [])]) {
      aliases.set(universityKey(alias.from), alias.to)
    }
    const itemByTitle = new Map<string, string>()
    for (const page of Object.values(payload.query?.pages ?? {})) {
      if (!page.missing && page.title && page.pageprops?.wikibase_item) {
        itemByTitle.set(universityKey(page.title), page.pageprops.wikibase_item)
      }
    }
    for (const title of titleGroup) {
      let resolvedTitle = title
      for (let depth = 0; depth < 4; depth += 1) {
        const alias = aliases.get(universityKey(resolvedTitle))
        if (!alias) break
        resolvedTitle = alias
      }
      const item = itemByTitle.get(universityKey(resolvedTitle))
      if (item) itemByInputKey.set(universityKey(title), item)
    }
  }

  const logos = await fetchLogos([...itemByInputKey.values()])
  await Promise.all(entries.map(async (entry) => {
    const title = titleByKey.get(universityKey(entry.name)) ?? wikipediaTitle(entry.name)
    const item = itemByInputKey.get(universityKey(title))
    // An exact Wikipedia/Wikidata match without a published logo should fall
    // straight through to the university's own icon chain. Only title misses
    // need the more expensive entity search fallback.
    entry.resolve(item ? (logos.get(item) ?? null) : await searchLogo(entry.name))
  }))
}

function flushQueue() {
  const entries = queue
  queue = []
  queueScheduled = false
  void fetchLogoBatch(entries).catch(() => entries.forEach((entry) => entry.resolve(null)))
}

function resolveUniversityLogo(name: string) {
  const key = universityKey(name)
  const override = officialLogoOverrides[universityKey(wikipediaTitle(name))]
  if (override) return Promise.resolve(override)
  const cached = logoCache.get(key)
  if (cached) return cached

  const request = new Promise<LogoState>((resolve) => {
    queue.push({ name, resolve })
    if (!queueScheduled) {
      queueScheduled = true
      setTimeout(flushQueue, 0)
    }
  })
  logoCache.set(key, request)
  return request
}

export function useUniversityLogoImage(name: string) {
  const [logo, setLogo] = useState<LogoState | undefined>(undefined)

  useEffect(() => {
    let active = true
    setLogo(undefined)
    if (!name.trim()) return () => { active = false }

    void resolveUniversityLogo(name).then((image) => {
      if (active) setLogo(image)
    })
    return () => { active = false }
  }, [name])

  return logo
}
