import { env } from '../config/env.js'

export function geminiLiveKeys() {
  return [...new Set([env.GEMINI_API_KEY, env.GEMINI_API_KEY_2, env.GEMINI_API_KEY_3, env.GEMINI_API_KEY_4, env.GEMINI_API_KEY_5]
    .flatMap(value => value.split(',')).map(value => value.trim()).filter(Boolean))]
}

export function naturalVoiceProvider(): 'gemini' | 'openai' | null {
  if (env.AI_VOICE_PROVIDER === 'gemini') return geminiLiveKeys().length ? 'gemini' : null
  if (env.AI_VOICE_PROVIDER === 'openai') return env.OPENAI_API_KEY.trim() ? 'openai' : null
  return geminiLiveKeys().length ? 'gemini' : env.OPENAI_API_KEY.trim() ? 'openai' : null
}
