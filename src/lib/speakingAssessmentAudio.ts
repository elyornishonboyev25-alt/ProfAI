type AnswerAudio = { blob: Blob; answerIndex: number }

const MAX_ASSESSMENT_BYTES = 8_000_000
const MAX_CLIP_BYTES = 5_500_000
const SAMPLE_RATE = 24_000
const compressedRecordings = new WeakMap<Blob, Blob>()

function readRecording(blob: Blob, signal: AbortSignal): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted()
    const reader = new FileReader()
    const abort = () => reader.abort()
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.onerror = () => reject(new Error('Could not read the saved recording.'))
    reader.onabort = () => reject(new Error('Audio preparation was cancelled.'))
    reader.onloadend = () => signal.removeEventListener('abort', abort)
    signal.addEventListener('abort', abort, { once: true })
    reader.readAsArrayBuffer(blob)
  })
}

async function compressRecording(blob: Blob, signal: AbortSignal): Promise<Blob> {
  signal.throwIfAborted()
  const cached = compressedRecordings.get(blob)
  if (cached) return cached
  const Context = window.OfflineAudioContext ?? (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext
  if (!Context) throw new Error('This browser could not prepare the saved audio for assessment.')
  // Decode at a speech-appropriate rate without starting playback or acquiring
  // the microphone. Process one answer at a time to bound decoded audio memory.
  const context = new Context(1, 1, SAMPLE_RATE)
  const decoded = await context.decodeAudioData(await readRecording(blob, signal))
  signal.throwIfAborted()
  const { Mp3Encoder } = await import('@breezystack/lamejs')
  signal.throwIfAborted()
  const encoder = new Mp3Encoder(1, SAMPLE_RATE, 48)
  const channels = Array.from({ length: decoded.numberOfChannels }, (_, index) => decoded.getChannelData(index))
  const chunks: BlobPart[] = []
  const blockSize = 1152
  for (let offset = 0; offset < decoded.length; offset += blockSize) {
    signal.throwIfAborted()
    const pcm = new Int16Array(Math.min(blockSize, decoded.length - offset))
    for (let index = 0; index < pcm.length; index++) {
      const sample = Math.max(-1, Math.min(1, channels.reduce((sum, channel) => sum + channel[offset + index], 0) / channels.length))
      pcm[index] = Math.round(sample * (sample < 0 ? 32768 : 32767))
    }
    const encoded = encoder.encodeBuffer(pcm)
    if (encoded.length) chunks.push(Uint8Array.from(encoded))
    // Let rendering, cancellation and the assessment deadline run during long
    // recordings instead of blocking the page for the entire encoding pass.
    if (offset % (blockSize * 24) === 0) await new Promise(resolve => setTimeout(resolve, 0))
  }
  signal.throwIfAborted()
  const tail = encoder.flush()
  if (tail.length) chunks.push(Uint8Array.from(tail))
  const compressed = new Blob(chunks, { type: 'audio/mpeg' })
  if (!compressed.size) throw new Error('Could not prepare the saved recording for assessment.')
  const result = compressed.size < blob.size ? compressed : blob
  compressedRecordings.set(blob, result)
  return result
}

/** Keep every answer and its full duration; originals remain in saved attempts. */
export async function prepareSpeakingAssessmentAudio(audio: AnswerAudio[], signal: AbortSignal): Promise<AnswerAudio[]> {
  signal.throwIfAborted()
  const oversizedSession = audio.reduce((sum, clip) => sum + clip.blob.size, 0) > MAX_ASSESSMENT_BYTES
  const prepared: AnswerAudio[] = []
  for (const clip of audio) {
    const blob = oversizedSession || clip.blob.size > MAX_CLIP_BYTES ? await compressRecording(clip.blob, signal) : clip.blob
    prepared.push({ ...clip, blob })
  }
  signal.throwIfAborted()
  if (prepared.some(clip => clip.blob.size > MAX_CLIP_BYTES) || prepared.reduce((sum, clip) => sum + clip.blob.size, 0) > MAX_ASSESSMENT_BYTES) {
    throw new Error('The complete audio is still too large to assess after compression. Your original recordings are saved.')
  }
  return prepared
}
