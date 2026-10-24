import crypto from 'node:crypto'
import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'
import { getLearningStreakSnapshot } from './activityStreak.service.js'
import { ensureReferralCode, normalizeReferralCode, qualifyInvitee, referralSummary, settleReferrals, FRIEND_DAYS, INVITEE_BONUS_DAYS, REFERRAL_TIERS, type TierPayout } from './referral.service.js'
import { call, ensureSubscribed, escapeHtml, isChannelMember, send, siteUrl, telegramEnabled, wheelUrl, type Keyboard, type TgUser } from './telegramApi.js'
import { handleGroupCallback, handleGroupText, joinGroups, showGroup } from './telegramGroups.js'
import { isSpinUsable, spinFor } from './wheel.service.js'
import { wordOfDay } from './telegramWords.js'

export { telegramEnabled } from './telegramApi.js'

const TIME_ZONE = 'Asia/Tashkent'
const LINK_CODE_TTL_MS = 15 * 60_000

type TgMessage = { chat: { id: number; type: string }; from?: TgUser; text?: string }
type TgCallback = { id: string; from: TgUser; data?: string; message?: { chat: { id: number } } }
export type TgUpdate = { update_id: number; message?: TgMessage; callback_query?: TgCallback }

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
const minutesLeft = (date: Date) => Math.max(0, Math.ceil((date.getTime() - Date.now()) / 60_000))

export const inviteLink = (code: string) => `${siteUrl()}/register?ref=${code}`
export const botInviteLink = (code: string) => `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=ref_${code}`

export async function createLinkCode(userId: string, purpose: 'link' | 'promo' = 'link') {
  await prisma.telegramLinkCode.deleteMany({ where: { OR: [{ userId }, { expiresAt: { lt: new Date() } }] } })
  const code = crypto.randomBytes(5).toString('hex').toUpperCase()
  const expiresAt = new Date(Date.now() + LINK_CODE_TTL_MS)
  await prisma.telegramLinkCode.create({ data: { code, userId, expiresAt } })
  return { code, expiresAt, url: `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=${purpose}_${code}` }
}

export async function notifyUser(userId: string, text: string, keyboard?: Keyboard) {
  if (!telegramEnabled()) return false
  const link = await prisma.telegramLink.findUnique({ where: { userId }, select: { chatId: true } })
  return link ? deliver(userId, link.chatId, text, keyboard) : false
}

export async function announcePayouts(payouts: TierPayout[]) {
  for (const payout of payouts) {
    const text = payout.kind === 'FRIEND'
      ? `🎉 <b>Do'stingiz qo'shildi!</b>\nU botga start berib, kanalga obuna bo'ldi. Hisobingizga <b>+${payout.days} kun</b> Premium qo'shildi. (Jami do'stlar: ${payout.count})`
      : `🏆 <b>${payout.count} do'st bonusi!</b>\nHisobingizga yana <b>+${payout.days} kun</b> Premium qo'shildi.`
    await notifyUser(payout.inviterId, text, [[{ text: 'Mukofotlarim', url: `${siteUrl()}/account#referral` }]])
  }
}

/** A friend's invitation counts once they use the bot and follow the channel. */
async function qualifyReferral(userId: string, telegramUserId: number, knownMember?: boolean) {
  const referral = await prisma.referral.findUnique({ where: { inviteeId: userId }, select: { qualifiedAt: true } })
  if (!referral || referral.qualifiedAt) return
  const member = knownMember ?? await isChannelMember(telegramUserId)
  if (member) await announcePayouts(await qualifyInvitee(userId))
}

async function linkAccount(message: TgMessage, rawCode: string, announce = true) {
  const chatId = String(message.chat.id)
  const code = rawCode.trim().toUpperCase()
  const record = await prisma.telegramLinkCode.findUnique({ where: { code } })
  if (!record || record.expiresAt < new Date()) {
    await send(chatId, '⚠️ Havola muddati tugagan. Saytdagi <b>Premium</b> yoki <b>Hisob → Telegram</b> bo\'limidan yangisini oling.')
    return null
  }
  await prisma.$transaction([
    prisma.telegramLink.deleteMany({ where: { OR: [{ userId: record.userId }, { chatId }] } }),
    prisma.telegramLink.create({ data: { userId: record.userId, chatId, username: message.from?.username ?? null } }),
    prisma.telegramLinkCode.delete({ where: { code } }),
  ])
  // A spin made in the bot before linking now belongs to this account.
  await prisma.wheelSpin.updateMany({ where: { telegramId: chatId, userId: null }, data: { userId: record.userId } }).catch(() => undefined)
  if (message.from) await qualifyReferral(record.userId, message.from.id).catch(() => undefined)
  if (!announce) return record.userId
  await send(chatId, '✅ <b>Hisobingiz ulandi!</b>\n\nEndi har kuni yangi so\'z, streak eslatmasi va mukofotlar haqida xabar olasiz.\n\n/spin — chegirma barabani\n/group — guruh bo\'lib olish\n/invite — do\'st taklif qilish\n/help — barcha buyruqlar', [[{ text: 'Saytni ochish', url: `${siteUrl()}/dashboard` }]])
  return record.userId
}

/** Channel members get the discount wheel and group buying; everyone else is asked to subscribe first. */
async function sendDiscountMenu(chatId: string, user: TgUser) {
  if (!(await ensureSubscribed(chatId, user.id, 'sub:check', 'Chegirma barabani va guruh narxlari faqat kanal obunachilari uchun.'))) return
  const link = await prisma.telegramLink.findUnique({ where: { chatId }, select: { userId: true } })
  if (link) await qualifyReferral(link.userId, user.id, true).catch(() => undefined)
  const spin = await spinFor(String(user.id))
  const keyboard: Keyboard = []
  let status: string
  if (!spin) {
    status = '🎡 Barabanni bir marta aylantiring va <b>50% gacha</b> chegirma yuting!'
    keyboard.push([{ text: '🎡 Barabanni aylantirish', web_app: { url: wheelUrl() } }])
  } else if (isSpinUsable(spin)) {
    status = `🎁 Sizning chegirmangiz: <b>${spin.percent}%</b>\n⏳ Amal qiladi: yana <b>${minutesLeft(spin.expiresAt)} daqiqa</b>. Shu vaqt ichida to'lov qiling.`
    keyboard.push([{ text: '💳 Chegirma bilan olish', url: `${siteUrl()}/premium` }])
  } else {
    status = spin.usedAt ? `✅ ${spin.percent}% chegirmangizdan foydalangansiz.` : `⌛ ${spin.percent}% chegirmangiz muddati tugagan. Barabanni har kim bir marta aylantiradi.`
  }
  keyboard.push([{ text: '👥 Guruh bo\'lib olish (5+ kishi)', callback_data: 'grp:start' }])
  if (!link) keyboard.push([{ text: '🔗 Hisobni ulash', url: `${siteUrl()}/premium` }])
  await send(chatId, `✅ <b>Siz kanal obunachisisiz!</b>\n\n${status}${link ? '' : '\n\n<i>Chegirma saytda ishlashi uchun hisobingizni ulang: Premium sahifasidagi "Telegram" tugmasi.</i>'}`, keyboard)
}

const HELP = [
  '<b>Buyruqlar</b>',
  '/spin — chegirma barabani (kanal obunachilari uchun)',
  '/group — 5+ kishi bo\'lib arzon olish',
  '/invite — do\'st taklif qilish, bepul kunlar',
  '/rewards — mukofotlarim',
  '/word — bugungi so\'z',
  '/streak — streak holatingiz',
  '/free — bepul materiallar',
  '/mute · /unmute — kunlik xabarlar',
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
  const user = message.from
  const text = (message.text ?? '').trim()
  if (user && !text.startsWith('/') && await handleGroupText(chatId, user, text)) return
  const [rawCommand, ...rest] = text.split(/\s+/)
  const command = rawCommand.toLowerCase().replace(/@.*$/, '')
  const argument = rest.join(' ')
  const link = await prisma.telegramLink.findUnique({ where: { chatId }, select: { userId: true } })

  if (command === '/start') {
    if (argument.startsWith('link_')) { await linkAccount(message, argument.slice(5)); return }
    if (argument.startsWith('promo_')) {
      const userId = await linkAccount(message, argument.slice(6), false)
      if (userId && user) await sendDiscountMenu(chatId, user)
      return
    }
    if (user && await joinGroups(chatId, user, argument.startsWith('grp_'))) return
    if ((argument === 'promo' || argument === 'spin') && user) return sendDiscountMenu(chatId, user)
    const referral = argument.startsWith('ref_') ? normalizeReferralCode(argument.slice(4)) : ''
    const url = referral ? inviteLink(referral) : `${siteUrl()}/register`
    const intro = referral
      ? `🎁 Do'stingiz sizni taklif qildi! Ro'yxatdan o'tsangiz <b>+${INVITEE_BONUS_DAYS} kun bepul Premium</b> olasiz.`
      : '👋 <b>Ivygoo</b> — IELTS va SAT tayyorgarligi uchun yordamchingiz.'
    return send(chatId, `${intro}\n\n🎡 Kanalimizga obuna bo'ling va barabandan <b>50% gacha</b> chegirma yuting.\n👥 5+ kishi bo'lib oling — arzonroq.\n🎁 Do'st taklif qiling — bepul kunlar.`,
      [[{ text: '🎡 Chegirma olish', callback_data: 'sub:check' }], [{ text: referral ? 'Ro\'yxatdan o\'tish' : 'Saytni ochish', url }]])
  }
  if (command === '/help') return send(chatId, HELP)
  if ((command === '/spin' || command === '/promo') && user) return sendDiscountMenu(chatId, user)
  if (command === '/group' && user) {
    if (!(await ensureSubscribed(chatId, user.id, 'grp:start', 'Guruh bo\'lib olish faqat kanal obunachilari uchun.'))) return
    return showGroup(chatId, user)
  }
  if (command === '/word') return send(chatId, wordMessage(), [[{ text: 'Lug\'at mashqlari', url: `${siteUrl()}/vocabulary` }]])
  if (command === '/free') {
    return send(chatId, '🎓 <b>Bepul tarifda nimalar bor</b>\n\n• Har oy 4 ta test va 1 ta to\'liq mock\n• 2 ta Writing va 2 ta Speaking AI tahlili\n• Lug\'at, maqolalar, podcast va shadowing\n\nBirortasini tanlang 👇', [
      [{ text: 'IELTS', url: `${siteUrl()}/ielts` }, { text: 'SAT', url: `${siteUrl()}/sat` }],
      [{ text: 'Lug\'at', url: `${siteUrl()}/vocabulary` }, { text: 'Maqolalar', url: `${siteUrl()}/articles` }],
      [{ text: 'Tariflar', url: `${siteUrl()}/premium` }],
    ])
  }

  if (!link) {
    if (['/streak', '/invite', '/rewards', '/mute', '/unmute', '/unlink'].includes(command)) {
      return send(chatId, '🔗 Bu buyruq uchun avval hisobingizni ulang: saytda <b>Hisob → Telegram</b> bo\'limidan foydalaning.', [[{ text: 'Hisobni ochish', url: `${siteUrl()}/account` }]])
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
    await announcePayouts(await settleReferrals(link.userId).catch(() => []))
    const summary = await referralSummary(link.userId)
    const code = summary.code ?? (await ensureReferralCode(link.userId)) ?? ''
    const ladder = REFERRAL_TIERS.map(tier => `${summary.qualified >= tier.count ? '✅' : '▫️'} ${tier.count} do'st → yana +${tier.days} kun bonus`).join('\n')
    return send(chatId,
      `🎁 <b>Do'st taklif qiling — Premium kunlar yuting</b>\n\nHar bir do'st uchun: <b>+${FRIEND_DAYS} kun</b> (tarifingiz ustiga qo'shiladi)\nDo'stingiz ham <b>+${INVITEE_BONUS_DAYS} kun</b> oladi.\n\n${ladder}\n\nTaklif qilingan: ${summary.invited} · Faol: ${summary.qualified} · Olingan: ${summary.earnedDays} kun\n\n<i>Do'st havola orqali ro'yxatdan o'tib, botga start berib, kanalga obuna bo'lgach hisoblanadi.</i>\n\nHavolangiz:\n${inviteLink(code)}`,
      [[{ text: '📤 Do\'stga yuborish', url: `https://t.me/share/url?url=${encodeURIComponent(inviteLink(code))}&text=${encodeURIComponent('IELTS va SAT ga birga tayyorlanamiz! Mana havola:')}` }]])
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
  const data = query.data ?? ''
  if (!chatId) return
  if (data === 'sub:check' || data === 'promo_check') return sendDiscountMenu(String(chatId), query.from)
  if (data.startsWith('grp:')) return handleGroupCallback(String(chatId), query.from, data)
}

export async function handleUpdate(update: TgUpdate) {
  try {
    if (update.callback_query) return void await handleCallback(update.callback_query)
    const message = update.message
    if (!message?.text || message.chat.type !== 'private') return
    await handleCommand(message)
  } catch (error) {
    console.error('Telegram update failed:', error instanceof Error ? error.message : error)
  }
}

/** Sends the wheel result to the winner's chat. */
export async function announceSpin(telegramId: string, percent: number, expiresAt: Date) {
  const minutes = minutesLeft(expiresAt)
  const window = minutes >= 120 ? `${Math.round(minutes / 60)} soat` : `${minutes} daqiqa`
  await send(telegramId, `${percent === 50 ? '🔥 <b>JACKPOT! 50% chegirma!</b>' : `🎉 <b>${percent}% chegirma yutdingiz!</b>`}\n\n⏳ Chegirma <b>${window}</b> amal qiladi — shu vaqt ichida to'lov qiling, aks holda u yo'qoladi.`,
    [[{ text: '💳 Chegirma bilan olish', url: `${siteUrl()}/premium` }], [{ text: '👥 Guruh bo\'lib olish', callback_data: 'grp:start' }]]).catch(() => undefined)
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

async function runDailyJobs() {
  const now = new Date()
  const hour = tashkentHour(now)
  const today = tashkentDay(now)
  const startOfToday = new Date(`${today}T00:00:00+05:00`)

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
    { command: 'spin', description: 'Chegirma barabani' },
    { command: 'group', description: 'Guruh bo\'lib olish (5+ kishi)' },
    { command: 'invite', description: 'Do\'st taklif qilish' },
    { command: 'rewards', description: 'Mukofotlarim' },
    { command: 'word', description: 'Bugungi so\'z' },
    { command: 'streak', description: 'Streak holatim' },
    { command: 'help', description: 'Yordam' },
  ] }).catch(() => undefined)
  // The menu button opens the wheel Mini App directly.
  await call('setChatMenuButton', { menu_button: { type: 'web_app', text: '🎡 Baraban', web_app: { url: wheelUrl() } } }).catch(() => undefined)

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
