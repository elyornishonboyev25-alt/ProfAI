import type { PurchaseGroup, PurchaseGroupMember } from '@prisma/client'
import { env } from '../config/env.js'
import { prisma } from '../lib/prisma.js'
import { GROUP_MAX_SIZE, GROUP_MIN_SIZE, GROUP_MONTHLY_USD, discountedAmount } from '../utils/billingCatalog.js'
import { chatLang, ensureSubscribed, escapeHtml, formatUsd, send, trySend, wheelUrl, type Keyboard, type TgUser } from './telegramApi.js'
import { tr, type Lang } from './telegramI18n.js'
import { isSpinUsable } from './wheel.service.js'

type GroupPlan = 'PRO' | 'MAX'
type GroupWithMembers = PurchaseGroup & { members: PurchaseGroupMember[] }
const ACTIVE = ['COLLECTING', 'OPEN', 'READY']
const PLAN_NAME: Record<GroupPlan, string> = { PRO: 'Pro', MAX: 'Max' }

const handleOf = (user: TgUser) => user.username ? user.username.toLowerCase() : `id${user.id}`
const isPlaceholder = (username: string) => /^id\d+$/.test(username)
const joinLink = (groupId: string) => `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=grp_${groupId}`
const price = (group: PurchaseGroup) => formatUsd(GROUP_MONTHLY_USD[group.plan as GroupPlan])

function memberName(group: PurchaseGroup, member: PurchaseGroupMember, lang: Lang) {
  if (member.isLeader) return `${escapeHtml(group.leaderName)} (${tr(lang).you})`
  return isPlaceholder(member.username) ? tr(lang).you : `@${escapeHtml(member.username)}`
}

async function leaderGroup(leaderTelegramId: string) {
  return prisma.purchaseGroup.findFirst({ where: { leaderTelegramId, status: { in: ACTIVE } }, include: { members: { orderBy: [{ isLeader: 'desc' }, { username: 'asc' }] } }, orderBy: { createdAt: 'desc' } })
}

function roster(group: GroupWithMembers, lang: Lang) {
  const t = tr(lang)
  const joined = group.members.filter(member => member.joinedAt).length
  const lines = group.members.map(member => `${member.joinedAt ? '✅' : '⏳'} ${memberName(group, member, lang)}`)
  return `${t.groupRoster(PLAN_NAME[group.plan as GroupPlan], price(group))}\n\n${lines.join('\n')}\n\n${t.groupReady(joined, group.members.length)}`
}

function shareKeyboard(group: GroupWithMembers, lang: Lang): Keyboard {
  const t = tr(lang)
  return [
    [{ text: t.btnShareGroup, url: `https://t.me/share/url?url=${encodeURIComponent(joinLink(group.id))}&text=${encodeURIComponent(t.shareGroupText)}` }],
    [{ text: t.btnRefresh, callback_data: 'grp:view' }, { text: t.btnCancel, callback_data: 'grp:cancel' }],
  ]
}

const readyKeyboard = (lang: Lang): Keyboard => {
  const t = tr(lang)
  return [
    [{ text: t.btnPay, callback_data: 'grp:pay' }],
    [{ text: t.btnRefreshInvoice, callback_data: 'grp:view' }, { text: t.btnCancel, callback_data: 'grp:cancel' }],
  ]
}

async function invoice(group: GroupWithMembers, lang: Lang) {
  const t = tr(lang)
  const base = GROUP_MONTHLY_USD[group.plan as GroupPlan]
  const spins = await prisma.wheelSpin.findMany({ where: { telegramId: { in: group.members.map(member => member.telegramId).filter((id): id is string => Boolean(id)) } } })
  const byTelegram = new Map(spins.map(spin => [spin.telegramId, spin]))
  let total = 0
  const lines = group.members.map(member => {
    const spin = member.telegramId ? byTelegram.get(member.telegramId) : undefined
    const percent = spin && isSpinUsable(spin) ? spin.percent : 0
    const due = discountedAmount(base, percent)
    total += due
    const note = percent ? t.invoiceNoteDiscount(percent) : spin ? t.invoiceNoteExpired : t.invoiceNoteNoSpin
    return `• ${memberName(group, member, lang)}: ${formatUsd(base)} → <b>${formatUsd(due)}</b> <i>(${note})</i>`
  })
  const full = base * group.members.length
  return `${t.invoiceTitle(PLAN_NAME[group.plan as GroupPlan])}\n\n${lines.join('\n')}\n\n${t.invoiceTotals(formatUsd(full), formatUsd(full - total), formatUsd(total))}`
}

function askUsernames(chatId: string, group: GroupWithMembers, lang: Lang) {
  const t = tr(lang)
  return send(chatId, t.askUsernames(PLAN_NAME[group.plan as GroupPlan], GROUP_MIN_SIZE - 1), [[{ text: t.btnCancel, callback_data: 'grp:cancel' }]])
}

export async function showGroup(chatId: string, user: TgUser, lang: Lang) {
  const t = tr(lang)
  const group = await leaderGroup(String(user.id))
  if (!group) {
    return send(chatId, t.groupIntro(GROUP_MIN_SIZE, formatUsd(GROUP_MONTHLY_USD.PRO), formatUsd(GROUP_MONTHLY_USD.MAX)), [[
      { text: t.planPerPerson('Pro', formatUsd(GROUP_MONTHLY_USD.PRO)), callback_data: 'grp:plan:PRO' },
      { text: t.planPerPerson('Max', formatUsd(GROUP_MONTHLY_USD.MAX)), callback_data: 'grp:plan:MAX' },
    ]])
  }
  if (group.status === 'COLLECTING') return askUsernames(chatId, group, lang)
  if (group.status === 'READY') return send(chatId, `${roster(group, lang)}\n\n${await invoice(group, lang)}`, readyKeyboard(lang))
  return send(chatId, `${roster(group, lang)}\n\n${t.groupOpenHint}`, shareKeyboard(group, lang))
}

export async function choosePlan(chatId: string, user: TgUser, plan: string, lang: Lang) {
  if (plan !== 'PRO' && plan !== 'MAX') return
  if (!(await ensureSubscribed(chatId, user.id, 'grp:start', tr(lang).reasonGroup, lang))) return
  if (await leaderGroup(String(user.id))) return showGroup(chatId, user, lang)
  const group = await prisma.purchaseGroup.create({
    data: { leaderTelegramId: String(user.id), leaderName: user.username ? `@${user.username}` : (user.first_name ?? 'Ivygoo'), plan,
      members: { create: { username: handleOf(user), telegramId: String(user.id), joinedAt: new Date(), isLeader: true } } },
    include: { members: true },
  })
  return askUsernames(chatId, group, lang)
}

/** Handles the leader's message with friends' usernames. Returns true when the text was consumed. */
export async function handleGroupText(chatId: string, user: TgUser, text: string, lang: Lang) {
  const group = await prisma.purchaseGroup.findFirst({ where: { leaderTelegramId: String(user.id), status: 'COLLECTING' }, include: { members: true } })
  if (!group) return false
  const t = tr(lang)
  const own = handleOf(user)
  const names = [...new Set([...text.matchAll(/@?([A-Za-z][A-Za-z0-9_]{4,31})/g)].map(match => match[1].toLowerCase()))].filter(name => name !== own)
  if (names.length < GROUP_MIN_SIZE - 1) {
    await send(chatId, t.needMoreUsernames(GROUP_MIN_SIZE - 1, names.length, GROUP_MIN_SIZE))
    return true
  }
  if (names.length > GROUP_MAX_SIZE - 1) {
    await send(chatId, t.tooManyUsernames(GROUP_MAX_SIZE))
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
  await send(chatId, `${roster(fresh, lang)}\n\n${t.afterUsernames}`, shareKeyboard(fresh, lang))
  // Friends who already talk to the bot get the invitation directly, in their own language.
  for (const [username, chat] of chats) {
    if (!names.includes(username)) continue
    const theirs = tr(await chatLang(chat))
    await trySend(chat, theirs.directInvite(escapeHtml(fresh.leaderName), PLAN_NAME[fresh.plan as GroupPlan], price(fresh)), [[{ text: theirs.btnJoinGroup, callback_data: 'grp:join' }]])
  }
  return true
}

/** Marks the user as joined in every open group that invited their username. */
export async function joinGroups(chatId: string, user: TgUser, lang: Lang, explicit = false) {
  const t = tr(lang)
  if (!user.username) {
    if (explicit) await send(chatId, t.needUsername)
    return false
  }
  const pending = await prisma.purchaseGroupMember.findMany({ where: { username: user.username.toLowerCase(), joinedAt: null, group: { status: 'OPEN' } }, select: { id: true, groupId: true } })
  if (!pending.length) {
    if (explicit) await send(chatId, t.noPendingGroup)
    return false
  }
  if (!(await ensureSubscribed(chatId, user.id, 'grp:join', t.reasonGroupJoin, lang))) return true
  for (const item of pending) {
    const joined = await prisma.purchaseGroupMember.updateMany({ where: { id: item.id, joinedAt: null }, data: { joinedAt: new Date(), telegramId: String(user.id) } })
    if (!joined.count) continue
    const group = await prisma.purchaseGroup.findUnique({ where: { id: item.groupId }, include: { members: { orderBy: [{ isLeader: 'desc' }, { username: 'asc' }] } } })
    if (!group) continue
    const complete = group.members.every(member => member.joinedAt)
    if (complete) await prisma.purchaseGroup.updateMany({ where: { id: group.id, status: 'OPEN' }, data: { status: 'READY' } })
    await send(chatId, t.joinedGroup(escapeHtml(group.leaderName)), [[{ text: t.btnSpin, web_app: { url: wheelUrl() } }]])
    const leaderLang = await chatLang(group.leaderTelegramId)
    const leader = tr(leaderLang)
    await trySend(group.leaderTelegramId, complete
      ? `${leader.allReady}\n\n${roster(group, leaderLang)}\n\n${await invoice(group, leaderLang)}`
      : `${leader.memberJoined(escapeHtml(user.username))}\n\n${roster(group, leaderLang)}`,
    complete ? readyKeyboard(leaderLang) : shareKeyboard(group, leaderLang))
  }
  return true
}

export async function handleGroupCallback(chatId: string, user: TgUser, data: string, lang: Lang) {
  const t = tr(lang)
  if (data === 'grp:start' || data === 'grp:view') {
    if (!(await ensureSubscribed(chatId, user.id, 'grp:start', t.reasonGroup, lang))) return
    return showGroup(chatId, user, lang)
  }
  if (data.startsWith('grp:plan:')) return choosePlan(chatId, user, data.slice(9), lang)
  if (data === 'grp:join') return joinGroups(chatId, user, lang, true)
  if (data === 'grp:cancel') {
    const cancelled = await prisma.purchaseGroup.updateMany({ where: { leaderTelegramId: String(user.id), status: { in: ACTIVE } }, data: { status: 'CANCELLED' } })
    return send(chatId, cancelled.count ? t.groupCancelled : t.noActiveGroup)
  }
  if (data === 'grp:pay') {
    const group = await leaderGroup(String(user.id))
    if (!group || group.status !== 'READY') return showGroup(chatId, user, lang)
    return send(chatId, `${await invoice(group, lang)}\n\n${t.paymentSoon}`, readyKeyboard(lang))
  }
}
