import { accountStorageFor } from './accountStorage'

function cacheKey(answer: string) {
  let hash = 2166136261
  for (let index = 0; index < answer.length; index++) hash = Math.imul(hash ^ answer.charCodeAt(index), 16777619)
  return `profai:speaking:improved:v1:${hash >>> 0}`
}

export function readSpeakingRewrite(owner: string, original: string): string {
  try {
    const saved = JSON.parse(accountStorageFor(owner).getItem(cacheKey(original)) ?? 'null')
    return saved?.original === original && typeof saved.improved === 'string' ? saved.improved : ''
  } catch { return '' }
}

export function saveSpeakingRewrite(owner: string, original: string, improved: string) {
  try { accountStorageFor(owner).setItem(cacheKey(original), JSON.stringify({ original, improved })) }
  catch { /* Coaching remains visible if optional local storage is unavailable. */ }
}
