// Client-side image compression for avatars. Reads a picked file, centre-crops it
// to a square and downscales it to a small data URL so it can be stored directly in
// the database (no upload infrastructure needed) and shown to other learners.

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read the image file.'))
    reader.readAsDataURL(blob)
  })
}

async function readImageSource(file: File): Promise<string> {
  if (file.type !== 'image/svg+xml') return readBlobAsDataUrl(file)

  // SVGs without explicit width/height use a browser fallback viewport (often
  // 300x150). That made the square preset avatars look rectangular to canvas,
  // so the old crop kept only part of the character. Give the SVG its viewBox
  // dimensions before decoding so the complete illustration is rasterised.
  const document = new DOMParser().parseFromString(await file.text(), 'image/svg+xml')
  const svg = document.documentElement
  if (svg.tagName.toLowerCase() !== 'svg' || document.querySelector('parsererror')) {
    return readBlobAsDataUrl(file)
  }

  const viewBox = svg
    .getAttribute('viewBox')
    ?.trim()
    .split(/[\s,]+/)
    .map(Number)

  if (viewBox?.length === 4 && viewBox.every(Number.isFinite)) {
    const [, , width, height] = viewBox
    if (width > 0 && height > 0) {
      if (!svg.hasAttribute('width')) svg.setAttribute('width', String(width))
      if (!svg.hasAttribute('height')) svg.setAttribute('height', String(height))
    }
  }

  const normalizedSvg = new XMLSerializer().serializeToString(svg)
  return readBlobAsDataUrl(new Blob([normalizedSvg], { type: 'image/svg+xml' }))
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not decode the image.'))
    img.src = src
  })
}

export type CompressOptions = {
  /** Output square side in pixels. */
  size?: number
  /** Encoder quality, 0–1. */
  quality?: number
}

/**
 * Compresses an image File into a square WEBP (falling back to JPEG) data URL.
 * Returns a string suitable for `User.avatarUrl`.
 */
export async function compressImageToDataUrl(file: File, options: CompressOptions = {}): Promise<string> {
  const { size = 256, quality = 0.82 } = options

  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.')
  }

  const sourceDataUrl = await readImageSource(file)
  const img = await loadImage(sourceDataUrl)

  const sourceWidth = img.naturalWidth || img.width
  const sourceHeight = img.naturalHeight || img.height
  if (!sourceWidth || !sourceHeight) throw new Error('Could not determine the image dimensions.')

  const side = Math.min(sourceWidth, sourceHeight)
  const sx = (sourceWidth - side) / 2
  const sy = (sourceHeight - side) / 2

  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return sourceDataUrl

  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size)

  const webp = canvas.toDataURL('image/webp', quality)
  if (webp.startsWith('data:image/webp')) return webp
  return canvas.toDataURL('image/jpeg', quality)
}
