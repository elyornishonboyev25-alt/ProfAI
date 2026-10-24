import type { PurchaseGroup, PurchaseGroupMember } from '@prisma/client'
import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'
import { GROUP_MAX_SIZE, GROUP_MIN_SIZE, GROUP_MONTHLY_USD, discountedAmount } from '../utils/billingCatalog.js'
import { ensureSubscribed, escapeHtml, formatUsd, send, trySend, wheelUrl, type Keyboard, type TgUser } from './telegramApi.js'
import { isSpinUsable } from './wheel.service.js'

type GroupPlan = 'PRO' | 'MAX'
type GroupWithMembers = PurchaseGroup & { members: PurchaseGroupMember[] }
const ACTIVE = ['COLLECTING', 'OPEN', 'READY']
const PLAN_NAME: Record<GroupPlan, string> = { PRO: 'Pro', MAX: 'Max' }

const handleOf = (user: TgUser) => user.username ? user.username.toLowerCase() : `id${user.id}`
const display = (member: PurchaseGroupMember) => member.username.startsWith('id') && /^id\d+$/.test(member.username) ? 'siz' : `@${escapeHtml(member.username)}`
const joinLink = (groupId: string) => `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=grp_${groupId}`

async function leaderGroup(leaderTelegramId: string) {
  return prisma.purchaseGroup.findFirst({ where: { leaderTelegramId, status: { in: ACTIVE } }, include: { members: { orderBy: [{ isLeader: 'desc' }, { username: 'asc' }] } }, orderBy: { createdAt: 'desc' } })
}

function roster(group: GroupWithMembers) {
  const plan = group.plan as GroupPlan
  const joined = group.members.filter(member => member.joinedAt).length
  const lines = group.members.map(member => `${member.joinedAt ? '✅' : '⏳'} ${member.isLeader ? `${escapeHtml(group.leaderName)} (siz)` : display(member)}`)
  return `👥 <b>Guruh · ${PLAN_NAME[plan]}</b> — ${formatUsd(GROUP_MONTHLY_USD[plan])}/kishi\n\n${lines.join('\n')}\n\n<b>${joined}/${group.members.length}</b> tayyor`
}

function shareKeyboard(group: GroupWithMembers): Keyboard {
  const link = joinLink(group.id)
  return [
    [{ text: '📤 Do\'stlarga havola yuborish', url: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent('Ivygoo Premium’ni guruh bo‘lib arzonroq olamiz! Botga kirib, kanalga obuna bo‘ling:')}` }],
    [{ text: '🔄 Yangilash', callback_data: 'grp:view' }, { text: '✖️ Bekor qilish', callback_data: 'grp:cancel' }],
  ]
}

async function invoice(group: GroupWithMembers) {
  const plan = group.plan as GroupPlan
  const base = GROUP_MONTHLY_USD[plan]
  const spins = await prisma.wheelSpin.findMany({ where: { telegramId: { in: group.members.map(member => member.telegramId).filter((id): id is string => Boolean(id)) } } })
  const byTelegram = new Map(spins.map(spin => [spin.telegramId, spin]))
  let total = 0
  const lines = group.members.map(member => {
    const spin = member.telegramId ? byTelegram.get(member.telegramId) : undefined
    const percent = spin && isSpinUsable(spin) ? spin.percent : 0
    const price = discountedAmount(base, percent)
    total += price
    const name = member.isLeader ? escapeHtml(group.leaderName) : display(member)
    const note = percent ? `🎡 −${percent}%` : spin ? 'chegirma muddati o\'tgan' : 'baraban aylantirilmagan'
    return `• ${name}: ${formatUsd(base)} → <b>${formatUsd(price)}</b> <i>(${note})</i>`
  })
  const full = base * group.members.length
  return `🧾 <b>Guruh hisobi · ${PLAN_NAME[plan]} · 1 oy</b>\n\n${lines.join('\n')}\n\nOddiy narx: <s>${formatUsd(full)}</s>\nBaraban chegirmalari: −${formatUsd(full - total)}\n<b>Jami to'lov: ${formatUsd(total)}</b>\n\n<i>Hisob baraban chegirmalari amal qilayotgan vaqtda hisoblanadi.</i>`
}

export async function showGroup(chatId: string, user: TgUser) {
  const group = await leaderGroup(String(user.id))
  if (!group) {
    return send(chatId, `👥 <b>Guruh bo'lib olish</b>\n\n${GROUP_MIN_SIZE} va undan ko'p kishi birga olsa, narx kishi boshiga:\n• Pro — <b>${formatUsd(GROUP_MONTHLY_USD.PRO)}</b> (odatda $6)\n• Max — <b>${formatUsd(GROUP_MONTHLY_USD.MAX)}</b> (odatda $12)\n\nSiz to'laysiz, do'stlaringiz botga start berib kanalga obuna bo'ladi. Har biri barabandan qo'shimcha chegirma yutishi mumkin.\n\nTarifni tanlang:`, [
      [{ text: `Pro · ${formatUsd(GROUP_MONTHLY_USD.PRO)}/kishi`, callback_data: 'grp:plan:PRO' }, { text: `Max · ${formatUsd(GROUP_MONTHLY_USD.MAX)}/kishi`, callback_data: 'grp:plan:MAX' }],
    ])
  }
  if (group.status === 'COLLECTING') return askUsernames(chatId, group)
  if (group.status === 'READY') return send(chatId, `${roster(group)}\n\n${await invoice(group)}`, readyKeyboard())
  return send(chatId, `${roster(group)}\n\nDo'stlaringiz botga start berib, kanalga obuna bo'lishi kerak. Havolani yuboring 👇`, shareKeyboard(group))
}

function askUsernames(chatId: string, group: GroupWithMembers) {
  return send(chatId, `✍️ <b>${PLAN_NAME[group.plan as GroupPlan]} guruh</b>\n\nO'zingizdan tashqari kamida <b>${GROUP_MIN_SIZE - 1}</b> ta do'stingizning Telegram username'ini bitta xabarda yuboring:\n\n<code>@ali_99 @madina @sardor_uz @nilufar</code>`,
    [[{ text: '✖️ Bekor qilish', callback_data: 'grp:cancel' }]])
}

const readyKeyboard = (): Keyboard => [
  [{ text: '💳 To\'lovga o\'tish', callback_data: 'grp:pay' }],
  [{ text: '🔄 Hisobni yangilash', callback_data: 'grp:view' }, { text: '✖️ Bekor qilish', callback_data: 'grp:cancel' }],
]

export async function choosePlan(chatId: string, user: TgUser, plan: string) {
  if (plan !== 'PRO' && plan !== 'MAX') return
  if (!(await ensureSubscribed(chatId, user.id, 'grp:start', 'Guruh bo\'lib olish faqat kanal obunachilari uchun.'))) return
  if (await leaderGroup(String(user.id))) return showGroup(chatId, user)
  const group = await prisma.purchaseGroup.create({
    data: { leaderTelegramId: String(user.id), leaderName: user.username ? `@${user.username}` : (user.first_name ?? 'Siz'), plan,
      members: { create: { username: handleOf(user), telegramId: String(user.id), joinedAt: new Date(), isLeader: true } } },
    include: { members: true },
  })
  return askUsernames(chatId, group)
}

/** Handles the leader's message with friends' usernames. Returns true when the text was consumed. */
export async function handleGroupText(chatId: string, user: TgUser, text: string) {
  const group = await prisma.purchaseGroup.findFirst({ where: { leaderTelegramId: String(user.id), status: 'COLLECTING' }, include: { members: true } })
  if (!group) return false
  const own = handleOf(user)
  const names = [...new Set([...text.matchAll(/@?([A-Za-z][A-Za-z0-9_]{4,31})/g)].map(match => match[1].toLowerCase()))].filter(name => name !== own)
  if (names.length < GROUP_MIN_SIZE - 1) {
    await send(chatId, `⚠️ Kamida <b>${GROUP_MIN_SIZE - 1}</b> ta to'g'ri username kerak (hozir ${names.length} ta). ${GROUP_MIN_SIZE} kishidan kam guruhga maxsus narx berilmaydi — bunday holda barabandan chegirma yutishingiz mumkin.`)
    return true
  }
  if (names.length > GROUP_MAX_SIZE - 1) {
    await send(chatId, `⚠️ Bitta guruhda ko'pi bilan ${GROUP_MAX_SIZE} kishi bo'ladi.`)
    return true
  }
  const known = await prisma.purchaseGroupMember.findMany({ where: { username: { in: names }, telegramId: { not: null } }, select: { username: true, telegramId: true } })
  const linked = await prisma.telegramLink.findMany({ where: { username: { in: names, mode: 'insensitive' } }, select: { username: true, chatId: true } })
  const chats = new Map<string, string>()
  for (const item of known) if (item.telegramId) chats.set(item.username, item.telegramId)
  for (const item of linked) if (item.username) chats.set(item.username.toLowerCase(), item.chatId)
  await prisma.$transaction([
    prisma.purchaseGroupMember.createMany({ data: names.map(username => ({ groupId: group.id, username })), skipDuplicates: true }),
    prisma.purchaseGroup.update({ where: { id: group.id }, data: { status: 'OPEN' } }),
  ])
  const fresh = await leaderGroup(String(user.id))
  if (!fresh) return true
  await send(chatId, `${roster(fresh)}\n\nEndi do'stlaringiz botga start berib, kanalga obuna bo'lishi kerak. Ularga havolani yuboring 👇`, shareKeyboard(fresh))
  // Friends who already talk to the bot get the invitation directly.
  for (const [username, chat] of chats) {
    if (names.includes(username)) await trySend(chat, `👥 ${escapeHtml(fresh.leaderName)} sizni <b>Ivygoo ${PLAN_NAME[fresh.plan as GroupPlan]}</b> guruhiga taklif qildi — ${formatUsd(GROUP_MONTHLY_USD[fresh.plan as GroupPlan])}/oy.\n\nQo'shilish uchun tugmani bosing.`, [[{ text: '✅ Guruhga qo\'shilish', callback_data: 'grp:join' }]])
  }
  return true
}

/** Marks the user as joined in every open group that invited their username. */
export async function joinGroups(chatId: string, user: TgUser, explicit = false) {
  if (!user.username) {
    if (explicit) await send(chatId, '⚠️ Guruhga qo\'shilish uchun Telegram\'da username bo\'lishi kerak (Sozlamalar → Username). Uni o\'rnatib, qayta urinib ko\'ring.')
    return false
  }
  const pending = await prisma.purchaseGroupMember.findMany({ where: { username: user.username.toLowerCase(), joinedAt: null, group: { status: 'OPEN' } }, select: { id: true, groupId: true } })
  if (!pending.length) {
    if (explicit) await send(chatId, 'ℹ️ Sizni kutayotgan guruh topilmadi. Guruh tuzgan do\'stingiz username\'ingizni to\'g\'ri yozganini tekshiring.')
    return false
  }
  if (!(await ensureSubscribed(chatId, user.id, 'grp:join', 'Guruhga qo\'shilish uchun kanal obunasi shart.'))) return true
  for (const item of pending) {
    const joined = await prisma.purchaseGroupMember.updateMany({ where: { id: item.id, joinedAt: null }, data: { joinedAt: new Date(), telegramId: String(user.id) } })
    if (!joined.count) continue
    const group = await prisma.purchaseGroup.findUnique({ where: { id: item.groupId }, include: { members: { orderBy: [{ isLeader: 'desc' }, { username: 'asc' }] } } })
    if (!group) continue
    const complete = group.members.every(member => member.joinedAt)
    if (complete) await prisma.purchaseGroup.updateMany({ where: { id: group.id, status: 'OPEN' }, data: { status: 'READY' } })
    await send(chatId, `✅ <b>Guruhga qo'shildingiz!</b>\n\n${escapeHtml(group.leaderName)} to'lovni amalga oshiradi. Barabanni aylantirib, o'zingiz uchun qo'shimcha chegirma yutib oling — u guruh hisobiga qo'shiladi.`,
      [[{ text: '🎡 Barabanni aylantirish', web_app: { url: wheelUrl() } }]])
    await trySend(group.leaderTelegramId, complete
      ? `🎉 <b>Hamma tayyor!</b>\n\n${roster(group)}\n\n${await invoice(group)}`
      : `➕ @${escapeHtml(user.username)} qo'shildi.\n\n${roster(group)}`,
    complete ? readyKeyboard() : shareKeyboard(group))
  }
  return true
}

export async function handleGroupCallback(chatId: string, user: TgUser, data: string) {
  if (data === 'grp:start' || data === 'grp:view') return showGroup(chatId, user)
  if (data.startsWith('grp:plan:')) return choosePlan(chatId, user, data.slice(9))
  if (data === 'grp:join') return joinGroups(chatId, user, true)
  if (data === 'grp:cancel') {
    const cancelled = await prisma.purchaseGroup.updateMany({ where: { leaderTelegramId: String(user.id), status: { in: ACTIVE } }, data: { status: 'CANCELLED' } })
    return send(chatId, cancelled.count ? 'Guruh bekor qilindi. Yangisini boshlash: /group' : 'Faol guruh yo\'q. Boshlash: /group')
  }
  if (data === 'grp:pay') {
    const group = await leaderGroup(String(user.id))
    if (!group || group.status !== 'READY') return showGroup(chatId, user)
    return send(chatId, `${await invoice(group)}\n\n💳 <b>Karta orqali to'lov tez orada ulanadi.</b> Ulanganda shu yerdan to'lab, guruhdagi hammaga Premium bir vaqtda yoqiladi.`, readyKeyboard())
  }
}
