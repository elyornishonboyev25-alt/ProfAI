import { env } from '../config/env.js'

export type TgUser = { id: number; username?: string; first_name?: string }
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

export const subscribeKeyboard = (retry: string): Keyboard => [
  [{ text: '📣 Kanalga obuna bo\'lish', url: env.TELEGRAM_CHANNEL_URL }],
  [{ text: '✅ Obuna bo\'ldim — tekshirish', callback_data: retry }],
]

/** Sends the subscribe prompt and returns false unless the user is a confirmed channel member. */
export async function ensureSubscribed(chatId: string | number, telegramUserId: number, retry: string, reason: string) {
  const member = await isChannelMember(telegramUserId)
  if (member) return true
  if (member === null) {
    await send(chatId, '⚠️ Obunani hozir tekshirib bo\'lmadi. Birozdan keyin qayta urinib ko\'ring.', [[{ text: '🔄 Qayta tekshirish', callback_data: retry }]])
    return false
  }
  await send(chatId, `📣 <b>Avval kanalimizga obuna bo'ling</b>\n\n${reason}\n\nObuna bo'lgach, "Tekshirish" tugmasini bosing.`, subscribeKeyboard(retry))
  return false
}

export const formatUsd = (cents: number) => `$${(cents / 100).toFixed(2).replace(/\.00$/, '')}`
