import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'
import { detectLang, tr, type Lang } from './telegramI18n.js'

export type TgUser = { id: number; username?: string; first_name?: string; language_code?: string }
export type KeyboardButton = { text: string; url?: string; callback_data?: string; web_app?: { url: string } }
export type Keyboard = KeyboardButton[][]

export const telegramEnabled = () => Boolean(env.TELEGRAM_BOT_TOKEN.trim())
export const siteUrl = () => (env.TELEGRAM_SITE_URL || env.BILLING_SITE_URL).replace(/\/+$/, '')
export const wheelUrl = () => `${siteUrl()}/spin`
export const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export async function call<T = unknown>(method: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<T | null> {
  const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: signal ?? AbortSignal.timeout(15_000),
  })
  const data = await response.json().catch(() => null) as { ok?: boolean; result?: T; error_code?: number } | null
  if (!data?.ok) {
    const error = new Error(`Telegram ${method} failed`) as Error & { status?: number }
    error.status = data?.error_code ?? response.status
    throw error
  }
  return data.result ?? null
}

export async function send(chatId: string | number, text: string, keyboard?: Keyboard) {
  return call('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
  })
}

/** Best-effort message to someone who may have blocked the bot. */
export async function trySend(chatId: string | number, text: string, keyboard?: Keyboard) {
  try {
    await send(chatId, text, keyboard)
    return true
  } catch {
    return false
  }
}

/**
 * The chat's language. Each interaction refreshes it from the user's Telegram language,
 * unless they picked one with /language.
 */
export async function chatLang(chatId: string | number, user?: TgUser): Promise<Lang> {
  const id = String(chatId)
  if (user) {
    const detected = detectLang(user.language_code)
    const saved = await prisma.telegramChat.findUnique({ where: { chatId: id } })
    if (saved?.manual) return saved.language as Lang
    if (saved?.language !== detected) await prisma.telegramChat.upsert({ where: { chatId: id }, create: { chatId: id, language: detected }, update: { language: detected } })
    return detected
  }
  const saved = await prisma.telegramChat.findUnique({ where: { chatId: id }, select: { language: true } })
  return (saved?.language as Lang | undefined) ?? 'uz'
}

export async function setChatLang(chatId: string | number, language: Lang) {
  const id = String(chatId)
  await prisma.telegramChat.upsert({ where: { chatId: id }, create: { chatId: id, language, manual: true }, update: { language, manual: true } })
}

/** True/false when Telegram answers; null when the check itself failed (bot is not a channel admin, network). */
export async function isChannelMember(telegramUserId: number | string) {
  try {
    const member = await call<{ status: string; is_member?: boolean }>('getChatMember', { chat_id: env.TELEGRAM_CHANNEL, user_id: Number(telegramUserId) })
    if (!member) return null
    return ['creator', 'administrator', 'member'].includes(member.status) || (member.status === 'restricted' && member.is_member === true)
  } catch (error) {
    console.error('Telegram channel check failed:', error instanceof Error ? error.message : error)
    return null
  }
}

/** Sends the subscribe prompt and returns false unless the user is a confirmed channel member. */
export async function ensureSubscribed(chatId: string | number, telegramUserId: number, retry: string, reason: string, lang: Lang) {
  const member = await isChannelMember(telegramUserId)
  if (member) return true
  const t = tr(lang)
  if (member === null) {
    await send(chatId, t.checkFailed, [[{ text: t.btnRetryCheck, callback_data: retry }]])
    return false
  }
  await send(chatId, t.subscribeFirst(reason), [
    [{ text: t.btnSubscribe, url: env.TELEGRAM_CHANNEL_URL }],
    [{ text: t.btnCheckSubscribed, callback_data: retry }],
  ])
  return false
}

export const formatUsd = (cents: number) => `$${(cents / 100).toFixed(2).replace(/\.00$/, '')}`
