import crypto from 'node:crypto'
import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'
import { getLearningStreakSnapshot } from './activityStreak.service.js'
import { ensureReferralCode, normalizeReferralCode, referralSummary, settleReferrals, INVITEE_BONUS_DAYS, REFERRAL_TIERS } from './referral.service.js'
import { issuePromoCode } from './promo.service.js'
import { wordOfDay } from './telegramWords.js'

const TIME_ZONE = 'Asia/Tashkent'
const LINK_CODE_TTL_MS = 15 * 60_000
const API = () => `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}`
const siteUrl = () => (env.TELEGRAM_SITE_URL || env.BILLING_SITE_URL).replace(/\/+$/, '')

type TgUser = { id: number; username?: string }
type TgMessage = { chat: { id: number; type: string }; from?: TgUser; text?: string }
type TgCallback = { id: string; from: TgUser; data?: string; message?: { chat: { id: number } } }
export type TgUpdate = { update_id: number; message?: TgMessage; callback_query?: TgCallback }
type Keyboard = Array<Array<{ text: string; url?: string; callback_data?: string }>>

export const telegramEnabled = () => Boolean(env.TELEGRAM_BOT_TOKEN.trim())

async function call<T = unknown>(method: string, body: Record<string, unknown>, signal?: AbortSignal): Promise<T | null> {
  const response = await fetch(`${API()}/${method}`, {
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

const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

async function send(chatId: string | number, text: string, keyboard?: Keyboard) {
  return call('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...(keyboard ? { reply_markup: { inline_keyboard: keyboard } } : {}),
  })
}

/** Delivers a message; a user who blocked the bot is unlinked so we stop retrying. */
async function deliver(userId: string, chatId: string, text: string, keyboard?: Keyboard) {
  try {
    await send(chatId, text, keyboard)
    return true
  } catch (error) {
    if ((error as { status?: number }).status === 403) await prisma.telegramLink.delete({ where: { userId } }).catch(() => undefined)
    return false
  }
}

const tashkentDay = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }).format(date)
const tashkentHour = (date: Date) => Number(new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', hourCycle: 'h23' }).format(date))

export const inviteLink = (code: string) => `${siteUrl()}/register?ref=${code}`
export const botInviteLink = (code: string) => `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=ref_${code}`

export async function createLinkCode(userId: string, purpose: 'link' | 'promo' = 'link') {
  await prisma.telegramLinkCode.deleteMany({ where: { OR: [{ userId }, { expiresAt: { lt: new Date() } }] } })
  const code = crypto.randomBytes(5).toString('hex').toUpperCase()
  const expiresAt = new Date(Date.now() + LINK_CODE_TTL_MS)
  await prisma.telegramLinkCode.create({ data: { code, userId, expiresAt } })
  return { code, expiresAt, url: `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=${purpose}_${code}` }
}

async function linkAccount(message: TgMessage, rawCode: string, announce = true) {
  const chatId = String(message.chat.id)
  const code = rawCode.trim().toUpperCase()
  const record = await prisma.telegramLinkCode.findUnique({ where: { code } })
  if (!record || record.expiresAt < new Date()) {
    await send(chatId, '⚠️ Havola muddati tugagan. Saytdagi <b>Premium → Promokod</b> yoki <b>Hisob → Telegram</b> bo\'limidan yangisini oling.')
    return null
  }
  await prisma.$transaction([
    prisma.telegramLink.deleteMany({ where: { OR: [{ userId: record.userId }, { chatId }] } }),
    prisma.telegramLink.create({ data: { userId: record.userId, chatId, username: message.from?.username ?? null } }),
    prisma.telegramLinkCode.delete({ where: { code } }),
  ])
  await settleReferrals(record.userId).catch(() => undefined)
  if (!announce) return record.userId
  await send(chatId, '✅ <b>Hisobingiz ulandi!</b>\n\nEndi har kuni yangi so\'z, streak eslatmasi va mukofotlar haqida xabar olasiz.\n\n/word — bugungi so\'z\n/streak — streakingiz\n/invite — do\'st taklif qilish\n/help — barcha buyruqlar', [[{ text: 'Saytni ochish', url: `${siteUrl()}/dashboard` }]])
  return record.userId
}

async function isChannelMember(telegramUserId: number) {
  try {
    const member = await call<{ status: string; is_member?: boolean }>('getChatMember', { chat_id: env.TELEGRAM_CHANNEL, user_id: telegramUserId })
    if (!member) return null
    return ['creator', 'administrator', 'member'].includes(member.status) || (member.status === 'restricted' && member.is_member === true)
  } catch (error) {
    // The bot must be an administrator of the channel to read its member list.
    console.error('Telegram channel check failed:', error instanceof Error ? error.message : error)
    return null
  }
}

async function sendPromoFlow(chatId: string, userId: string, telegramUserId: number) {
  const member = await isChannelMember(telegramUserId)
  if (member === null) {
    return send(chatId, '⚠️ Obunani hozir tekshirib bo\'lmadi. Birozdan keyin qayta urinib ko\'ring.', [[{ text: '🔄 Qayta tekshirish', callback_data: 'promo_check' }]])
  }
  if (!member) {
    return send(chatId, '🎁 <b>Promokod olish</b>\n\nPromokod olish uchun avval rasmiy kanalimizga obuna bo\'ling, so\'ng "Tekshirish" tugmasini bosing.', [
      [{ text: '📣 Kanalga obuna bo\'lish', url: env.TELEGRAM_CHANNEL_URL }],
      [{ text: '✅ Obuna bo\'ldim, tekshirish', callback_data: 'promo_check' }],
    ])
  }
  const promo = await issuePromoCode(userId)
  if (promo.redeemedAt) {
    return send(chatId, `ℹ️ Promokodingiz <code>${promo.code}</code> allaqachon ishlatilgan. Do'stlarni taklif qilib yana bepul kunlar oling: /invite`)
  }
  return send(chatId, `🎉 <b>Promokodingiz tayyor!</b>\n\n<code>${promo.code}</code>\n\nUni saytda <b>Premium → Promokod</b> bo'limiga kiriting va <b>+${promo.days} kun</b> bepul premium oling.`,
    [[{ text: 'Saytda ishlatish', url: `${siteUrl()}/premium?promo=${promo.code}` }]])
}

const HELP = [
  '<b>Buyruqlar</b>',
  '/promo — promokod olish (kanalga obuna kerak)',
  '/word — bugungi so\'z',
  '/streak — streak holatingiz',
  '/invite — do\'stlarni taklif qilish',
  '/rewards — mukofotlar va progress',
  '/free — bepul materiallar',
  '/mute — kunlik xabarlarni o\'chirish',
  '/unmute — kunlik xabarlarni yoqish',
  '/unlink — hisobni uzish',
].join('\n')

function wordMessage() {
  const item = wordOfDay()
  return `📚 <b>Bugungi so'z</b>\n\n<b>${escapeHtml(item.word)}</b> <i>(${item.type})</i>\n${escapeHtml(item.uz)}\n\n<i>${escapeHtml(item.example)}</i>`
}

async function streakText(userId: string) {
  const snapshot = await getLearningStreakSnapshot(prisma, userId, TIME_ZONE)
  const today = snapshot.lastLearningAt ? tashkentDay(snapshot.lastLearningAt) === tashkentDay(new Date()) : false
  return { snapshot, today }
}

async function handleCommand(message: TgMessage) {
  const chatId = String(message.chat.id)
  const [rawCommand, ...rest] = (message.text ?? '').trim().split(/\s+/)
  const command = rawCommand.toLowerCase().replace(/@.*$/, '')
  const argument = rest.join(' ')
  const link = await prisma.telegramLink.findUnique({ where: { chatId }, select: { userId: true } })

  if (command === '/start') {
    if (argument.startsWith('link_')) { await linkAccount(message, argument.slice(5)); return }
    if (argument.startsWith('promo_')) {
      const userId = await linkAccount(message, argument.slice(6), false)
      if (userId && message.from) await sendPromoFlow(chatId, userId, message.from.id)
      return
    }
    if (argument === 'promo' && link && message.from) return sendPromoFlow(chatId, link.userId, message.from.id)
    const referral = argument.startsWith('ref_') ? normalizeReferralCode(argument.slice(4)) : ''
    const url = referral ? inviteLink(referral) : `${siteUrl()}/register`
    const intro = referral
      ? `🎁 Do'stingiz sizni taklif qildi! Ro'yxatdan o'tsangiz <b>+${INVITEE_BONUS_DAYS} kun bepul premium</b> olasiz.`
      : '👋 <b>Ivy Goo</b> — IELTS va SAT tayyorgarligi uchun yordamchi.'
    return send(chatId, `${intro}\n\nHar kuni yangi so'z, streak eslatmasi va do'st taklif qilib premium yutish imkoniyati.\n\nHisobingiz bo'lsa, saytdagi <b>Hisob → Telegram</b> bo'limidan ulang. /help`,
      [[{ text: referral ? 'Ro\'yxatdan o\'tish' : 'Saytni ochish', url }]])
  }
  if (command === '/help') return send(chatId, HELP)
  if (command === '/promo') {
    if (!link || !message.from) return send(chatId, '🔗 Promokod olish uchun avval hisobingizni ulang: saytda <b>Premium → Promokod</b> tugmasini bosing.', [[{ text: 'Premium sahifasi', url: `${siteUrl()}/premium` }]])
    return sendPromoFlow(chatId, link.userId, message.from.id)
  }
  if (command === '/word') return send(chatId, wordMessage(), [[{ text: 'Lug\'at mashqlari', url: `${siteUrl()}/vocabulary` }]])
  if (command === '/free') {
    return send(chatId, '🎓 <b>Bepul materiallar</b>\n\n• IELTS Reading, Listening, Writing va Speaking testlari\n• SAT savollar banki\n• Maqolalar va lug\'at mashqlari\n• Podcast va Shadowing\n\nBirortasini tanlang 👇', [
      [{ text: 'IELTS', url: `${siteUrl()}/ielts` }, { text: 'SAT', url: `${siteUrl()}/sat` }],
      [{ text: 'Lug\'at', url: `${siteUrl()}/vocabulary` }, { text: 'Maqolalar', url: `${siteUrl()}/articles` }],
      [{ text: 'Podcast', url: `${siteUrl()}/podcast` }, { text: 'Shadowing', url: `${siteUrl()}/shadowing-lab` }],
    ])
  }

  if (!link) {
    if (['/streak', '/invite', '/rewards', '/mute', '/unmute', '/unlink'].includes(command)) {
      return send(chatId, '🔗 Bu buyruq uchun avval hisobingizni ulang: saytda <b>Hisob → Telegram</b> bo\'limidan kod oling.', [[{ text: 'Hisobni ochish', url: `${siteUrl()}/account` }]])
    }
    return send(chatId, 'Buyruqlar ro\'yxati: /help')
  }

  if (command === '/streak') {
    const { snapshot, today } = await streakText(link.userId)
    const body = snapshot.currentStreak > 0
      ? `🔥 <b>${snapshot.currentStreak} kunlik streak</b> (eng uzun: ${snapshot.longestStreak})\n${today ? 'Bugun mashq qilgansiz ✅' : 'Bugun hali mashq qilmadingiz — streakni saqlab qoling!'}`
      : 'Hozircha streak yo\'q. Bugun bitta test yoki mashq qiling va boshlang!'
    return send(chatId, body, [[{ text: 'Mashq qilish', url: `${siteUrl()}/dashboard` }]])
  }
  if (command === '/invite' || command === '/rewards') {
    await settleReferrals(link.userId).catch(() => undefined)
    const summary = await referralSummary(link.userId)
    const code = summary.code ?? (await ensureReferralCode(link.userId)) ?? ''
    const ladder = REFERRAL_TIERS.map(tier => `${summary.qualified >= tier.count ? '✅' : '▫️'} ${tier.count} do'st → +${tier.days} kun`).join('\n')
    const progress = summary.next ? `Keyingi mukofotgacha <b>${summary.next.remaining}</b> do'st qoldi.` : 'Barcha mukofotlar olingan, rahmat! 🏆'
    return send(chatId,
      `🎁 <b>Do'st taklif qiling — premium yuting</b>\n\nDo'stingiz ham <b>+${INVITEE_BONUS_DAYS} kun</b> bonus oladi.\n\n${ladder}\n\nTaklif qilingan: ${summary.invited} · Hisoblangan: ${summary.qualified} · Olingan: ${summary.earnedDays} kun\n${progress}\n\n<i>Do'st ro'yxatdan o'tib, kamida bitta test yoki mashq tugatgach hisoblanadi.</i>\n\nHavolangiz:\n${inviteLink(code)}`,
      [[{ text: 'Do\'stga yuborish', url: `https://t.me/share/url?url=${encodeURIComponent(inviteLink(code))}&text=${encodeURIComponent('IELTS va SAT ga birga tayyorlanamiz! Mana havola:')}` }]])
  }
  if (command === '/mute' || command === '/unmute') {
    const on = command === '/unmute'
    await prisma.telegramLink.update({ where: { userId: link.userId }, data: { dailyWord: on, streakAlert: on } })
    return send(chatId, on ? '🔔 Kunlik xabarlar yoqildi.' : '🔕 Kunlik xabarlar o\'chirildi. Qayta yoqish: /unmute')
  }
  if (command === '/unlink') {
    await prisma.telegramLink.delete({ where: { userId: link.userId } })
    return send(chatId, 'Hisob uzildi. Qayta ulash uchun saytdagi <b>Hisob → Telegram</b> bo\'limidan foydalaning.')
  }
  return send(chatId, 'Buyruqlar ro\'yxati: /help')
}

async function handleCallback(query: TgCallback) {
  await call('answerCallbackQuery', { callback_query_id: query.id }).catch(() => undefined)
  const chatId = query.message?.chat.id
  if (!chatId || query.data !== 'promo_check') return
  const link = await prisma.telegramLink.findUnique({ where: { chatId: String(chatId) }, select: { userId: true } })
  if (!link) {
    await send(chatId, '🔗 Avval hisobingizni ulang: saytda <b>Premium → Promokod</b> tugmasini bosing.')
    return
  }
  await sendPromoFlow(String(chatId), link.userId, query.from.id)
}

export async function handleUpdate(update: TgUpdate) {
  if (update.callback_query) {
    try { await handleCallback(update.callback_query) } catch (error) { console.error('Telegram callback failed:', error instanceof Error ? error.message : error) }
    return
  }
  const message = update.message
  if (!message?.text || message.chat.type !== 'private') return
  try {
    await handleCommand(message)
  } catch (error) {
    console.error('Telegram command failed:', error instanceof Error ? error.message : error)
  }
}

export async function notifyUser(userId: string, text: string, keyboard?: Keyboard) {
  if (!telegramEnabled()) return false
  const link = await prisma.telegramLink.findUnique({ where: { userId }, select: { chatId: true } })
  return link ? deliver(userId, link.chatId, text, keyboard) : false
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function runDailyJobs() {
  const now = new Date()
  const hour = tashkentHour(now)
  const today = tashkentDay(now)
  const startOfToday = new Date(`${today}T00:00:00+05:00`)

  // Turn newly qualified friends into rewards and tell the inviters.
  for (const payout of await settleReferrals().catch(() => [])) {
    await notifyUser(payout.inviterId, `🎉 <b>${payout.count}-do'st mukofoti!</b>\nHisobingizga <b>+${payout.days} kun</b> premium qo'shildi.`, [[{ text: 'Mukofotlar', url: `${siteUrl()}/account` }]])
  }

  if (hour >= 9 && hour < 20) {
    const due = await prisma.telegramLink.findMany({ where: { dailyWord: true, OR: [{ lastWordAt: null }, { lastWordAt: { lt: startOfToday } }] }, take: 200 })
    for (const link of due) {
      const claimed = await prisma.telegramLink.updateMany({ where: { userId: link.userId, OR: [{ lastWordAt: null }, { lastWordAt: { lt: startOfToday } }] }, data: { lastWordAt: now } })
      if (!claimed.count) continue
      await deliver(link.userId, link.chatId, wordMessage(), [[{ text: 'Lug\'at mashqlari', url: `${siteUrl()}/vocabulary` }]])
      await sleep(60)
    }
  }
  if (hour >= 20) {
    const due = await prisma.telegramLink.findMany({ where: { streakAlert: true, OR: [{ lastAlertAt: null }, { lastAlertAt: { lt: startOfToday } }] }, take: 200 })
    for (const link of due) {
      const claimed = await prisma.telegramLink.updateMany({ where: { userId: link.userId, OR: [{ lastAlertAt: null }, { lastAlertAt: { lt: startOfToday } }] }, data: { lastAlertAt: now } })
      if (!claimed.count) continue
      const { snapshot, today: practisedToday } = await streakText(link.userId)
      if (snapshot.currentStreak > 0 && !practisedToday) {
        await deliver(link.userId, link.chatId, `🔥 <b>${snapshot.currentStreak} kunlik streakingiz xavfda!</b>\nBugun hali mashq qilmadingiz — bitta qisqa mashq yetarli.`, [[{ text: 'Hozir mashq qilish', url: `${siteUrl()}/dashboard` }]])
        await sleep(60)
      }
    }
  }
}

let started = false

export async function startTelegramBot() {
  if (started || !telegramEnabled()) return
  started = true
  await call('setMyCommands', { commands: [
    { command: 'promo', description: 'Promokod olish' },
    { command: 'word', description: 'Bugungi so\'z' },
    { command: 'streak', description: 'Streak holatim' },
    { command: 'invite', description: 'Do\'st taklif qilish va mukofot' },
    { command: 'rewards', description: 'Mukofotlarim' },
    { command: 'free', description: 'Bepul materiallar' },
    { command: 'help', description: 'Yordam' },
  ] }).catch(() => undefined)

  if (env.TELEGRAM_WEBHOOK_URL.trim()) {
    await call('setWebhook', { url: env.TELEGRAM_WEBHOOK_URL.trim(), allowed_updates: ['message', 'callback_query'], ...(env.TELEGRAM_WEBHOOK_SECRET ? { secret_token: env.TELEGRAM_WEBHOOK_SECRET } : {}) })
    console.log('Telegram bot: webhook mode')
  } else {
    await call('deleteWebhook', {}).catch(() => undefined)
    void poll()
    console.log('Telegram bot: long polling mode')
  }

  const tick = () => { void runDailyJobs().catch(error => console.error('Telegram jobs failed:', error instanceof Error ? error.message : error)) }
  setTimeout(tick, 15_000).unref()
  setInterval(tick, 5 * 60_000).unref()
}

async function poll() {
  let offset = 0
  for (;;) {
    try {
      const updates = await call<TgUpdate[]>('getUpdates', { offset, timeout: 25, allowed_updates: ['message', 'callback_query'] }, AbortSignal.timeout(40_000))
      for (const update of updates ?? []) {
        offset = update.update_id + 1
        await handleUpdate(update)
      }
    } catch {
      await sleep(5_000)
    }
  }
}
