export type LearnerGender = 'FEMALE' | 'MALE' | 'PREFER_NOT_TO_SAY'

const atlasByGender = {
  FEMALE: '/assets/avatars/profai-female-atlas.jpg',
  MALE: '/assets/avatars/profai-male-atlas.jpg',
} as const

const cropTopByGender = {
  FEMALE: [132, 535],
  MALE: [150, 540],
} as const

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Avatar asset could not be loaded: ${src}`))
    image.src = src
  })
}

export function createAvatarSeed(identity?: string | null) {
  if (identity) {
    let hash = 2166136261
    for (let index = 0; index < identity.length; index += 1) {
      hash ^= identity.charCodeAt(index)
      hash = Math.imul(hash, 16777619)
    }
    return Math.abs(hash) % 10
  }

  if (typeof crypto !== 'undefined' && 'getRandomValues' in crypto) {
    return crypto.getRandomValues(new Uint32Array(1))[0] % 10
  }
  return Math.floor(Math.random() * 10)
}

export async function createAssignedAvatarDataUrl(
  gender: LearnerGender,
  seed: number,
  size = 320,
) {
  const source = gender === 'PREFER_NOT_TO_SAY'
    ? '/assets/avatars/profai-neutral.jpg'
    : atlasByGender[gender]
  const image = await loadImage(source)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d', { alpha: false })
  if (!context) throw new Error('Avatar renderer is unavailable.')

  context.fillStyle = '#f8fbff'
  context.fillRect(0, 0, size, size)

  if (gender === 'PREFER_NOT_TO_SAY') {
    context.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 0, 0, size, size)
  } else {
    const index = Math.abs(seed) % 10
    const column = index % 5
    const row = Math.floor(index / 5)
    const sourceSize = image.naturalWidth / 5
    const sourceX = column * sourceSize
    const sourceY = cropTopByGender[gender][row]
    context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size)
  }

  return canvas.toDataURL('image/webp', 0.88)
}
