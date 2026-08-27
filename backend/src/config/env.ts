import path from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'
import { z } from 'zod'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

config({ path: path.resolve(__dirname, '../../.env') })
config({ path: path.resolve(__dirname, '../../../.env') })
config({ path: path.resolve(__dirname, '../../../.env.local') })

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5001),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1),
  ACCESS_TOKEN_SECRET: z.string().min(24),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_SECRET: z.string().min(24),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  GOOGLE_CLIENT_ID: z.string().default(''),
  VITE_GOOGLE_CLIENT_ID: z.string().default(''),
  RESEND_API_KEY: z.string().default(''),
  AUTH_EMAIL_FROM: z.string().default('ProfAI <accounts@profai.uz>'),
  GLOBAL_JOURNEY_ENABLED: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  GUEST_DIAGNOSTIC_ENABLED: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  UNIVERSITY_DATA_PLATFORM_ENABLED: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  APPLICATION_WORKSPACE_ENABLED: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  AUTOMATED_BILLING_ENABLED: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  GROWTH_RELEASE_ENABLED: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  GEMINI_API_KEY: z.string().default(''),
  GEMINI_API_KEY_2: z.string().default(''),
  GEMINI_API_KEY_3: z.string().default(''),
  GEMINI_API_KEY_4: z.string().default(''),
  GEMINI_API_KEY_5: z.string().default(''),
  GEMINI_MODELS: z.string().default('gemini-2.5-flash,gemini-2.5-flash-lite'),
  AI_PROVIDER_TIMEOUT_MS: z.coerce.number().int().positive().max(120_000).default(30_000),
  AI_RATE_LIMIT_MAX: z.coerce.number().int().positive().max(300).default(30),
  HF_ACCESS_TOKEN: z.string().default(''),
  HF_API_BASE: z.string().url().default('https://router.huggingface.co/v1'),
  HF_MODEL: z.string().default('Qwen/Qwen2.5-7B-Instruct'),
  HF_ASR_URL: z.string().url().default('https://router.huggingface.co/hf-inference/models/openai/whisper-large-v3-turbo'),
  HF_TIMEOUT_MS: z.coerce.number().int().positive().default(20_000),
  OPENAI_API_KEY: z.string().default(''),
  OPENAI_API_BASE: z.string().url().default('https://api.openai.com/v1'),
  OPENAI_MODEL: z.string().default('gpt-4.1-mini'),
  OPENAI_TRANSCRIBE_MODEL: z.string().default('whisper-1'),
  OPENAI_REALTIME_MODEL: z.string().default('gpt-4o-realtime-preview'),
})

export const env = envSchema.parse(process.env)

const hasGeminiKey = [
  env.GEMINI_API_KEY,
  env.GEMINI_API_KEY_2,
  env.GEMINI_API_KEY_3,
  env.GEMINI_API_KEY_4,
  env.GEMINI_API_KEY_5,
].some((value) => value.trim().length > 0)

if (
  env.NODE_ENV === 'production' &&
  !hasGeminiKey &&
  !env.OPENAI_API_KEY.trim() &&
  !env.HF_ACCESS_TOKEN.trim()
) {
  throw new Error('At least one backend AI provider key is required in production.')
}

export const isProduction = env.NODE_ENV === 'production'
