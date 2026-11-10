export class VoiceStreamError extends Error {
  constructor(message: string, public code: string, public retryable: boolean) {
    super(message)
    this.name = 'VoiceStreamError'
  }
}

export function voiceSocketClosed(event: Pick<CloseEvent, 'code' | 'reason'>) {
  if (event.code === 1008 && event.reason === 'Audio rate exceeded') return new VoiceStreamError('The audio connection was interrupted. Your chat is saved.', 'VOICE_AUDIO_BURST', true)
  if ([1001, 1006, 1011, 1012, 1013].includes(event.code)) return new VoiceStreamError('The voice connection was interrupted. Your chat is saved.', `VOICE_TRANSPORT_${event.code}`, true)
  if (event.code === 1008 || event.code === 1009) return new VoiceStreamError('The voice server rejected the audio connection. Your chat is saved.', `VOICE_TRANSPORT_${event.code}`, false)
  return new VoiceStreamError('This voice session has finished. Start another session to continue.', 'VOICE_SESSION_FINISHED', false)
}
