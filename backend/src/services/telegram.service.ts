import crypto from 'node:crypto'
import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'
import { getLearningStreakSnapshot } from './activityStreak.service.js'
import { ensureReferralCode, normalizeReferralCode, qualifyInvitee, referralSummary, settleReferrals, FRIEND_DAYS, INVITEE_BONUS_DAYS, REFERRAL_TIERS, type TierPayout } from './referral.service.js'
import { call, chatLang, ensureSubscribed, escapeHtml, isChannelMember, send, setChatLang, siteUrl, telegramEnabled, wheelUrl, type Keyboard, type TgUser } from './telegramApi.js'
import { handleGroupCallback, handleGroupText, joinGroups, showGroup } from './telegramGroups.js'
import { LANGS, tr, type Lang } from './telegramI18n.js'
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
const timeLeft = (date: Date, lang: Lang) => {
  const minutes = Math.max(0, Math.ceil((date.getTime() - Date.now()) / 60_000))
  return minutes >= 120 ? tr(lang).hours(Math.round(minutes / 60)) : tr(lang).minutes(minutes)
}

export const inviteLink = (code: string) => `${siteUrl()}/register?ref=${code}`
export const botInviteLink = (code: string) => `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=ref_${code}`

export async function createLinkCode(userId: string, purpose: 'link' | 'promo' = 'link') {
  await prisma.telegramLinkCode.deleteMany({ where: { OR: [{ userId }, { expiresAt: { lt: new Date() } }] } })
  const code = crypto.randomBytes(5).toString('hex').toUpperCase()
  const expiresAt = new Date(Date.now() + LINK_CODE_TTL_MS)
  await prisma.telegramLinkCode.create({ data: { code, userId, expiresAt } })
  return { code, expiresAt, url: `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=${purpose}_${code}` }
}

/** Sends a message to a site account's linked chat, in that chat's language. */
export async function notifyUser(userId: string, build: (lang: Lang) => { text: string; keyboard?: Keyboard }) {
  if (!telegramEnabled()) return false
  const link = await prisma.telegramLink.findUnique({ where: { userId }, select: { chatId: true } })
  if (!link) return false
  const { text, keyboard } = build(await chatLang(link.chatId))
  return deliver(userId, link.chatId, text, keyboard)
}

export async function announcePayouts(payouts: TierPayout[]) {
  for (const payout of payouts) {
    await notifyUser(payout.inviterId, lang => {
      const t = tr(lang)
      return {
        text: payout.kind === 'FRIEND' ? t.friendJoined(payout.days, payout.count) : t.milestone(payout.count, payout.days),
        keyboard: [[{ text: t.btnMyRewards, url: `${siteUrl()}/account#referral` }]],
      }
    })
  }
}

/** A friend's invitation counts once they use the bot and follow the channel. */
async function qualifyReferral(userId: string, telegramUserId: number, knownMember?: boolean) {
  const referral = await prisma.referral.findUnique({ where: { inviteeId: userId }, select: { qualifiedAt: true } })
  if (!referral || referral.qualifiedAt) return
  const member = knownMember ?? await isChannelMember(telegramUserId)
  if (member) await announcePayouts(await qualifyInvitee(userId))
}

async function linkAccount(message: TgMessage, rawCode: string, lang: Lang, announce = true) {
  const t = tr(lang)
  const chatId = String(message.chat.id)
  const code = rawCode.trim().toUpperCase()
  const record = await prisma.telegramLinkCode.findUnique({ where: { code } })
  if (!record || record.expiresAt < new Date()) {
    await send(chatId, t.linkExpired)
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
  await send(chatId, t.linked, [[{ text: t.btnOpenSite, url: `${siteUrl()}/dashboard` }]])
  return record.userId
}

/** Channel members get the discount wheel and group buying; everyone else is asked to subscribe first. */
async function sendDiscountMenu(chatId: string, user: TgUser, lang: Lang) {
  const t = tr(lang)
  if (!(await ensureSubscribed(chatId, user.id, 'sub:check', t.reasonDiscount, lang))) return
  const link = await prisma.telegramLink.findUnique({ where: { chatId }, select: { userId: true } })
  if (link) await qualifyReferral(link.userId, user.id, true).catch(() => undefined)
  const spin = await spinFor(String(user.id))
  const keyboard: Keyboard = []
  let status: string
  if (!spin) {
    status = t.spinPrompt
    keyboard.push([{ text: t.btnSpin, web_app: { url: wheelUrl() } }])
  } else if (isSpinUsable(spin)) {
    status = t.activeDiscount(spin.percent, timeLeft(spin.expiresAt, lang))
    keyboard.push([{ text: t.btnUseDiscount, url: `${siteUrl()}/premium` }])
  } else {
    status = spin.usedAt ? t.usedDiscount(spin.percent) : t.expiredDiscount(spin.percent)
  }
  keyboard.push([{ text: t.btnGroup, callback_data: 'grp:start' }])
  if (!link) keyboard.push([{ text: t.btnLinkAccount, url: `${siteUrl()}/premium` }])
  await send(chatId, `${t.subscriberHeader}\n\n${status}${link ? '' : `\n\n${t.linkHint}`}`, keyboard)
}

function wordMessage(lang: Lang) {
  const t = tr(lang)
  const item = wordOfDay()
  const meaning = lang === 'uz' ? item.uz : lang === 'ru' ? item.ru : item.en
  return `${t.wordHeader}\n\n<b>${escapeHtml(item.word)}</b> <i>(${item.type})</i>\n${escapeHtml(meaning)}\n\n<i>${escapeHtml(item.example)}</i>`
}

async function streakText(userId: string) {
  const snapshot = await getLearningStreakSnapshot(prisma, userId, TIME_ZONE)
  const today = snapshot.lastLearningAt ? tashkentDay(snapshot.lastLearningAt) === tashkentDay(new Date()) : false
  return { snapshot, today }
}

const languageKeyboard = (): Keyboard => [LANGS.map(code => ({ text: tr(code).languageName, callback_data: `lang:${code}` }))]

async function handleCommand(message: TgMessage) {
  const chatId = String(message.chat.id)
  const user = message.from
  const lang = await chatLang(chatId, user)
  const t = tr(lang)
  const text = (message.text ?? '').trim()
  if (user && !text.startsWith('/') && await handleGroupText(chatId, user, text, lang)) return
  const [rawCommand, ...rest] = text.split(/\s+/)
  const command = rawCommand.toLowerCase().replace(/@.*$/, '')
  const argument = rest.join(' ')
  const link = await prisma.telegramLink.findUnique({ where: { chatId }, select: { userId: true } })

  if (command === '/start') {
    if (argument.startsWith('link_')) { await linkAccount(message, argument.slice(5), lang); return }
    if (argument.startsWith('promo_')) {
      const userId = await linkAccount(message, argument.slice(6), lang, false)
      if (userId && user) await sendDiscountMenu(chatId, user, lang)
      return
    }
    if (user && await joinGroups(chatId, user, lang, argument.startsWith('grp_'))) return
    if ((argument === 'promo' || argument === 'spin') && user) return sendDiscountMenu(chatId, user, lang)
    const referral = argument.startsWith('ref_') ? normalizeReferralCode(argument.slice(4)) : ''
    const url = referral ? inviteLink(referral) : `${siteUrl()}/register`
    const intro = referral ? t.introReferral(INVITEE_BONUS_DAYS) : t.introDefault
    return send(chatId, `${intro}\n\n${t.startBody}`,
      [[{ text: t.btnGetDiscount, callback_data: 'sub:check' }], [{ text: referral ? t.btnRegister : t.btnOpenSite, url }]])
  }
  if (command === '/help') return send(chatId, t.help)
  if (command === '/language' || command === '/lang') return send(chatId, t.chooseLanguage, languageKeyboard())
  if ((command === '/spin' || command === '/promo') && user) return sendDiscountMenu(chatId, user, lang)
  if (command === '/group' && user) {
    if (!(await ensureSubscribed(chatId, user.id, 'grp:start', t.reasonGroup, lang))) return
    return showGroup(chatId, user, lang)
  }
  if (command === '/word') return send(chatId, wordMessage(lang), [[{ text: t.btnVocabulary, url: `${siteUrl()}/vocabulary` }]])
  if (command === '/free') {
    return send(chatId, t.freePlan, [
      [{ text: 'IELTS', url: `${siteUrl()}/ielts` }, { text: 'SAT', url: `${siteUrl()}/sat` }],
      [{ text: t.btnVocabularyShort, url: `${siteUrl()}/vocabulary` }, { text: t.btnArticles, url: `${siteUrl()}/articles` }],
      [{ text: t.btnPlans, url: `${siteUrl()}/premium` }],
    ])
  }

  if (!link) {
    if (['/streak', '/invite', '/rewards', '/mute', '/unmute', '/unlink'].includes(command)) {
      return send(chatId, t.needLink, [[{ text: t.btnOpenAccount, url: `${siteUrl()}/account` }]])
    }
    return send(chatId, t.commandsList)
  }

  if (command === '/streak') {
    const { snapshot, today } = await streakText(link.userId)
    const body = snapshot.currentStreak > 0
      ? `${t.streakLine(snapshot.currentStreak, snapshot.longestStreak)}\n${today ? t.practicedToday : t.notPracticedToday}`
      : t.noStreak
    return send(chatId, body, [[{ text: t.btnPractice, url: `${siteUrl()}/dashboard` }]])
  }
  if (command === '/invite' || command === '/rewards') {
    await announcePayouts(await settleReferrals(link.userId).catch(() => []))
    const summary = await referralSummary(link.userId)
    const code = summary.code ?? (await ensureReferralCode(link.userId)) ?? ''
    const ladder = REFERRAL_TIERS.map(tier => `${summary.qualified >= tier.count ? '✅' : '▫️'} ${t.ladderLine(tier.count, tier.days)}`).join('\n')
    return send(chatId, t.invite({ friendDays: FRIEND_DAYS, inviteeDays: INVITEE_BONUS_DAYS, ladder, invited: summary.invited, qualified: summary.qualified, earned: summary.earnedDays, link: inviteLink(code) }),
      [[{ text: t.btnShareFriend, url: `https://t.me/share/url?url=${encodeURIComponent(inviteLink(code))}&text=${encodeURIComponent(t.shareInviteText)}` }]])
  }
  if (command === '/mute' || command === '/unmute') {
    const on = command === '/unmute'
    await prisma.telegramLink.update({ where: { userId: link.userId }, data: { dailyWord: on, streakAlert: on } })
    return send(chatId, on ? t.unmuted : t.muted)
  }
  if (command === '/unlink') {
    await prisma.telegramLink.delete({ where: { userId: link.userId } })
    return send(chatId, t.unlinked)
  }
  return send(chatId, t.commandsList)
}

async function handleCallback(query: TgCallback) {
  await call('answerCallbackQuery', { callback_query_id: query.id }).catch(() => undefined)
  const chatId = query.message?.chat.id
  const data = query.data ?? ''
  if (!chatId) return
  if (data.startsWith('lang:')) {
    const chosen = data.slice(5) as Lang
    if (!LANGS.includes(chosen)) return
    await setChatLang(chatId, chosen)
    return send(chatId, `${tr(chosen).languageSet}\n\n${tr(chosen).help}`)
  }
  const lang = await chatLang(chatId, query.from)
  if (data === 'sub:check' || data === 'promo_check') return sendDiscountMenu(String(chatId), query.from, lang)
  if (data.startsWith('grp:')) return handleGroupCallback(String(chatId), query.from, data, lang)
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
  const lang = await chatLang(telegramId)
  const t = tr(lang)
  await send(telegramId, `${percent === 50 ? t.jackpot : t.won(percent)}\n\n${t.wonWindow(timeLeft(expiresAt, lang))}`,
    [[{ text: t.btnUseDiscount, url: `${siteUrl()}/premium` }], [{ text: t.btnGroupShort, callback_data: 'grp:start' }]]).catch(() => undefined)
}

/** Language the Mini App should use for this Telegram user, if the bot already knows it. */
export async function knownChatLang(telegramId: string): Promise<Lang | null> {
  const saved = await prisma.telegramChat.findUnique({ where: { chatId: telegramId }, select: { language: true } })
  return (saved?.language as Lang | undefined) ?? null
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
      const lang = await chatLang(link.chatId)
      await deliver(link.userId, link.chatId, wordMessage(lang), [[{ text: tr(lang).btnVocabulary, url: `${siteUrl()}/vocabulary` }]])
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
        const t = tr(await chatLang(link.chatId))
        await deliver(link.userId, link.chatId, t.streakAlert(snapshot.currentStreak), [[{ text: t.btnPracticeNow, url: `${siteUrl()}/dashboard` }]])
        await sleep(60)
      }
    }
  }
}

/** Command menu and bot profile texts in every language; English is Telegram's fallback for other languages. */
async function publishBotProfile() {
  for (const lang of LANGS) {
    const t = tr(lang)
    const scope = lang === 'en' ? {} : { language_code: lang }
    const commands = (['spin', 'group', 'invite', 'rewards', 'word', 'streak', 'language', 'help'] as const)
      .map(command => ({ command, description: t.commands[command] }))
    await call('setMyCommands', { commands, ...scope }).catch(() => undefined)
    await call('setMyDescription', { description: t.description, ...scope }).catch(() => undefined)
    await call('setMyShortDescription', { short_description: t.shortDescription, ...scope }).catch(() => undefined)
  }
  // The menu button opens the wheel Mini App directly.
  await call('setChatMenuButton', { menu_button: { type: 'web_app', text: '🎡 Ivygoo', web_app: { url: wheelUrl() } } }).catch(() => undefined)
}

let started = false

export async function startTelegramBot() {
  if (started || !telegramEnabled()) return
  started = true
  await publishBotProfile()

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
