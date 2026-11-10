/** Mono PCM export at a speech-appropriate sample rate. Original clips stay intact. */
export async function combineSpeechRecordings(clips: Blob[], signal: AbortSignal): Promise<Blob> {
  const sampleRate = 16000
  const context = new OfflineAudioContext(1, 1, sampleRate)
  const chunks: Float32Array[] = []
  let length = 0
  for (const clip of clips) {
    signal.throwIfAborted()
    const audio = await context.decodeAudioData(await clip.arrayBuffer())
    signal.throwIfAborted()
    const samples = new Float32Array(audio.length)
    for (let channel = 0; channel < audio.numberOfChannels; channel++) {
      const source = audio.getChannelData(channel)
      for (let index = 0; index < source.length; index++) samples[index] += source[index] / audio.numberOfChannels
    }
    chunks.push(samples); length += samples.length
    if (length > sampleRate * 2400) throw new Error('This conversation is too long to export as one audio file.')
  }
  signal.throwIfAborted()
  const bytes = new ArrayBuffer(44 + length * 2)
  const view = new DataView(bytes)
  const write = (offset: number, text: string) => [...text].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)))
  write(0, 'RIFF'); view.setUint32(4, 36 + length * 2, true); write(8, 'WAVE'); write(12, 'fmt ')
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true)
  write(36, 'data'); view.setUint32(40, length * 2, true)
  let offset = 44
  for (const chunk of chunks) for (const sample of chunk) {
    const bounded = Math.min(1, Math.max(-1, sample))
    view.setInt16(offset, Math.round(bounded * (bounded < 0 ? 32768 : 32767)), true); offset += 2
  }
  return new Blob([bytes], { type: 'audio/wav' })
}
