const KEY = 'profai-device-id-v1'
let fallback: string | undefined
let hints: string | undefined

function createId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  // This identifier is a counting hint, never an authentication credential.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const value = Math.floor(Math.random() * 16)
    return (char === 'x' ? value : (value & 3) | 8).toString(16)
  })
}

/** A browser profile identifier, shared by tabs and kept across sign-outs. */
export function deviceIdentity(): string {
  if (typeof window === 'undefined') return ''
  try {
    const saved = window.localStorage.getItem(KEY)
    if (saved && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(saved)) return saved
    const id = createId()
    window.localStorage.setItem(KEY, id)
    return id
  } catch {
    fallback ??= createId()
    return fallback
  }
}

const GPU_VENDORS: Array<[RegExp, string]> = [
  [/nvidia|geforce|quadro|rtx|gtx/, 'nvidia'], [/amd|radeon|ati /, 'amd'], [/intel/, 'intel'], [/apple/, 'apple'],
  [/adreno|qualcomm/, 'qualcomm'], [/mali|arm/, 'arm'], [/powervr|imagination/, 'powervr'], [/swiftshader|llvmpipe|microsoft basic/, 'software'],
]

// Chromium wraps the GPU in ANGLE details, Firefox and Safari do not. Reduce
// every form to the model name so all browsers on one computer agree.
function gpuDetails(): [string, string] {
  try {
    const canvas = document.createElement('canvas')
    const gl = (canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
    if (!gl) return ['', '']
    const debug = gl.getExtension('WEBGL_debug_renderer_info')
    const raw = String(gl.getParameter(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '').toLowerCase()
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    const angle = /^angle \((.*)\)$/.exec(raw)?.[1].split(', ')
    // Chromium browsers also expose the GPU's hardware id, e.g. (0x00008a52).
    const model = (angle && angle.length > 1 ? angle[1] : raw)
      .replace(/\((0x[0-9a-f]+)\)/g, ' $1 ')
      .replace(/\((?:tm|r)\)|direct3d.*|d3d\d+.*|vs_\d_\d|ps_\d_\d|opengl.*|vulkan.*|metal renderer:|angle|unspecified version|, or similar|corporation|inc\.?/g, ' ')
      .replace(/\b(nvidia|amd|ati|intel|apple|qualcomm|arm|google|microsoft)\b/g, ' ')
      .replace(/[^a-z0-9 .+-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 64)
    const vendor = GPU_VENDORS.find(([pattern]) => pattern.test(raw))?.[1] ?? ''
    return [vendor, model]
  } catch {
    return ['', '']
  }
}

/** Hardware traits every browser on this device reports alike. The server
 *  hashes them to recognise Chrome, Edge or a cleared profile as one device. */
export function deviceHints(): string {
  if (typeof window === 'undefined') return ''
  if (hints !== undefined) return hints
  try {
    const { width, height, colorDepth } = window.screen
    const zone = (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC').replace(/[^A-Za-z0-9_+\-/]/g, '').slice(0, 64)
    const [vendor, model] = gpuDetails()
    hints = encodeURIComponent(['v1', `${Math.max(width, height)}x${Math.min(width, height)}`, colorDepth || 24,
      Math.min(navigator.hardwareConcurrency || 0, 256), zone || 'UTC', Math.min(navigator.maxTouchPoints || 0, 20), vendor, model].join('|'))
  } catch {
    hints = ''
  }
  return hints
}
