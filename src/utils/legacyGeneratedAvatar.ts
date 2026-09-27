import signatures from './legacyAvatarSignatures.json'

const LEGACY_ASSET = /\/assets\/avatars\/(?:learner(?:-v[23])?-\d\d\.png|profai-(?:female-atlas|male-atlas|neutral)\.jpg)(?:[?#]|$)/i
const SIGNATURE_SIZE = 12
const MAX_AVERAGE_DIFFERENCE = 16
const cache = new Map<string, Promise<boolean>>()

const referencePixels = signatures.map(({ pixels }) => {
  const colors = new Uint8Array(pixels.length / 2)
  for (let index = 0; index < colors.length; index += 1) {
    colors[index] = Number.parseInt(pixels.slice(index * 2, index * 2 + 2), 16)
  }
  return colors
})

export function isLegacyAvatarAsset(src: string) {
  return LEGACY_ASSET.test(src)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Avatar could not be decoded'))
    image.src = src
  })
}

async function matchesGeneratedPortrait(src: string) {
  const image = await loadImage(src)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = SIGNATURE_SIZE
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return false
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  const side = Math.min(image.naturalWidth, image.naturalHeight)
  context.drawImage(
    image,
    (image.naturalWidth - side) / 2,
    (image.naturalHeight - side) / 2,
    side,
    side,
    0,
    0,
    SIGNATURE_SIZE,
    SIGNATURE_SIZE,
  )
  const pixels = context.getImageData(0, 0, SIGNATURE_SIZE, SIGNATURE_SIZE).data

  return referencePixels.some((reference) => {
    let difference = 0
    for (let index = 0; index < reference.length; index += 1) {
      difference += Math.abs(reference[index] - pixels[Math.floor(index / 3) * 4 + index % 3])
      if (difference > MAX_AVERAGE_DIFFERENCE * reference.length) return false
    }
    return difference <= MAX_AVERAGE_DIFFERENCE * reference.length
  })
}

export function isLegacyGeneratedAvatar(src: string): Promise<boolean> {
  if (isLegacyAvatarAsset(src)) return Promise.resolve(true)
  if (!src.startsWith('data:image/')) return Promise.resolve(false)
  let result = cache.get(src)
  if (!result) {
    result = matchesGeneratedPortrait(src).catch(() => false)
    if (cache.size >= 200) cache.clear()
    cache.set(src, result)
  }
  return result
}
