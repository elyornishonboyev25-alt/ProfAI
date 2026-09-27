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

export const COVER_RATIO = 18 / 7

export function coverCrop(image: HTMLImageElement, centerX: number, centerY: number, zoom: number) {
  const width = image.naturalWidth
  const height = image.naturalHeight
  const cropWidth = Math.min(width, height * COVER_RATIO) / zoom
  const cropHeight = cropWidth / COVER_RATIO
  const x = Math.max(0, Math.min(width - cropWidth, centerX * width - cropWidth / 2))
  const y = Math.max(0, Math.min(height - cropHeight, centerY * height - cropHeight / 2))
  return { x, y, width: cropWidth, height: cropHeight }
}

export function drawCoverCrop(canvas: HTMLCanvasElement, image: HTMLImageElement, centerX: number, centerY: number, zoom: number) {
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Could not process the class photo.')
  const crop = coverCrop(image, centerX, centerY, zoom)
  context.clearRect(0, 0, canvas.width, canvas.height)
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height)
}

/** Export a banner crop under the API's 700 KB data URL limit. */
export function exportCoverCrop(image: HTMLImageElement, centerX: number, centerY: number, zoom: number): string {
  const canvas = document.createElement('canvas')
  for (const width of [1440, 1200, 960, 720]) {
    canvas.width = width
    canvas.height = Math.round(width / COVER_RATIO)
    drawCoverCrop(canvas, image, centerX, centerY, zoom)
    for (const quality of [0.78, 0.64, 0.5]) {
      const webp = canvas.toDataURL('image/webp', quality)
      if (webp.startsWith('data:image/webp') && webp.length < 690_000) return webp
      const jpeg = canvas.toDataURL('image/jpeg', quality)
      if (jpeg.length < 690_000) return jpeg
    }
  }
  throw new Error('Could not prepare this photo. Please choose another image.')
}
