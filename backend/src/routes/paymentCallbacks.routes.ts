import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { env } from '../config/env.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { fulfillPayment, lockBilling } from '../services/billing.service.js'
import { clickSignature, paymentProviders, safeEqual, verifyStripeSignature } from '../services/paymentProviders.service.js'

export const paymentCallbacks = Router()
const clickSchema = z.object({ click_trans_id: z.coerce.string(), service_id: z.coerce.string(), merchant_trans_id: z.string(),
  merchant_prepare_id: z.coerce.string().optional(), amount: z.coerce.string(), action: z.enum(['0', '1']),
  sign_time: z.string(), sign_string: z.string(), error: z.coerce.number().int() })
paymentCallbacks.post('/click', asyncHandler(async (req, res) => {
  const parsed = clickSchema.safeParse(req.body)
  if (!parsed.success) return res.json({ error: -8, error_note: 'Invalid request' })
  const p = parsed.data
  const reply = (error: number, note: string, sequence?: number) => res.json({ click_trans_id: p.click_trans_id, merchant_trans_id: p.merchant_trans_id,
    ...(p.action === '0' ? { merchant_prepare_id: sequence } : { merchant_confirm_id: sequence }), error, error_note: note })
  if (!paymentProviders().find(item => item.code === 'CLICK')?.enabled || p.service_id !== env.CLICK_SERVICE_ID ||
    !safeEqual(p.sign_string.toLowerCase(), clickSignature(p))) return reply(-1, 'Invalid signature')
  if (!/^\d+(?:\.\d{1,2})?$/.test(p.amount)) return reply(-2, 'Invalid amount')
  const result = await prisma.$transaction(async tx => {
    const initial = await tx.paymentRequest.findUnique({ where: { id: p.merchant_trans_id } })
    if (!initial || initial.method !== 'CLICK' || initial.currency !== 'UZS') return { error: -5, note: 'Order not found' }
    await lockBilling(tx, initial.userId)
    const order = await tx.paymentRequest.findUniqueOrThrow({ where: { id: initial.id } })
    if (Math.round(Number(p.amount) * 100) !== order.amountMinor) return { error: -2, note: 'Incorrect amount' }
    const providerId = `CLICK:${p.click_trans_id}`
    if (order.providerId && order.providerId !== providerId) return { error: -4, note: 'Another transaction exists' }
    if (order.status === 'APPROVED') return { error: -4, note: 'Already paid', sequence: order.providerSequence }
    if (order.status === 'CANCELED' || order.status === 'REJECTED') return { error: -9, note: 'Canceled' }
    if (p.action === '1' && (!order.preparedAt || p.merchant_prepare_id !== String(order.providerSequence))) return { error: -6, note: 'Transaction not prepared' }
    if (p.error < 0) {
      await tx.paymentRequest.update({ where: { id: order.id }, data: { status: 'CANCELED', canceledAt: new Date() } })
      return { error: -9, note: 'Canceled' }
    }
    if (p.action === '0') await tx.paymentRequest.update({ where: { id: order.id }, data: { status: 'PROCESSING', preparedAt: order.preparedAt ?? new Date(), providerId } })
    else await fulfillPayment(tx, order, 'CLICK')
    return { error: 0, note: 'Success', sequence: order.providerSequence }
  })
  return reply(result.error, result.note, result.sequence)
}))

class PaymeError extends Error {
  constructor(public code: number, message: string, public data?: string) { super(message) }
}
const rpcSchema = z.object({ id: z.union([z.string(), z.number(), z.null()]).optional(), method: z.string(), params: z.record(z.unknown()).default({}) })
paymentCallbacks.post('/payme', asyncHandler(async (req, res) => {
  const parsed = rpcSchema.safeParse(req.body)
  const id = parsed.success ? parsed.data.id ?? null : null
  const fail = (code: number, message: string, data?: string) => res.json({ id, error: { code, message: { uz: message, ru: message, en: message }, ...(data ? { data } : {}) } })
  const authorization = req.headers.authorization ?? ''
  const expected = `Basic ${Buffer.from(`Paycom:${env.PAYME_SECRET_KEY}`).toString('base64')}`
  if (!paymentProviders().find(item => item.code === 'PAYME')?.enabled || !safeEqual(authorization, expected)) return fail(-32504, 'Authentication failed')
  if (!parsed.success) return fail(-32600, 'Invalid request')
  const { method, params } = parsed.data
  try {
    const result = await prisma.$transaction(async tx => {
      if (method === 'GetStatement') {
        const range = z.object({ from: z.number().int().nonnegative(), to: z.number().int().nonnegative() }).parse(params)
        const orders = await tx.paymentRequest.findMany({ where: { method: 'PAYME', providerId: { not: null },
          providerTime: { gte: BigInt(range.from), lte: BigInt(range.to) } }, orderBy: { providerTime: 'asc' } })
        return { transactions: orders.map(order => ({ id: order.providerId!.slice(6), time: Number(order.providerTime), amount: order.amountMinor,
          account: { order_id: order.id }, ...paymeState(order) })) }
      }
      if (!['CheckPerformTransaction', 'CreateTransaction', 'PerformTransaction', 'CancelTransaction', 'CheckTransaction'].includes(method)) throw new PaymeError(-32601, 'Method not found')
      const creation = method === 'CreateTransaction' || method === 'CheckPerformTransaction'
      const account = creation ? z.object({ order_id: z.string() }).parse(params.account) : null
      const transactionId = method === 'CheckPerformTransaction' ? null : z.string().min(1).max(100).parse(params.id)
      const found = creation ? await tx.paymentRequest.findUnique({ where: { id: account!.order_id } }) :
        await tx.paymentRequest.findUnique({ where: { providerId: `PAYME:${transactionId}` } })
      if (!found || found.method !== 'PAYME' || found.currency !== 'UZS') throw new PaymeError(creation ? -31050 : -31003, 'Order or transaction not found', creation ? 'order_id' : undefined)
      await lockBilling(tx, found.userId)
      let order = await tx.paymentRequest.findUniqueOrThrow({ where: { id: found.id } })
      if (creation && z.number().int().positive().parse(params.amount) !== order.amountMinor) throw new PaymeError(-31001, 'Incorrect amount')
      if (order.status === 'PROCESSING' && order.providerTime && Date.now() - Number(order.providerTime) > 43200000) {
        order = await tx.paymentRequest.update({ where: { id: order.id }, data: { status: 'CANCELED', canceledAt: new Date(), cancelReason: 4 } })
      }
      if (method === 'CheckTransaction') return paymeState(order)
      if (method === 'CancelTransaction') {
        if (order.status === 'APPROVED') throw new PaymeError(-31007, 'The purchased service has been delivered')
        if (order.status !== 'CANCELED') order = await tx.paymentRequest.update({ where: { id: order.id },
          data: { status: 'CANCELED', canceledAt: new Date(), cancelReason: z.number().int().parse(params.reason) } })
        return { transaction: order.id, cancel_time: order.canceledAt?.getTime() ?? 0, state: -1 }
      }
      if (method === 'PerformTransaction') {
        if (order.status === 'APPROVED') return { transaction: order.id, perform_time: order.performedAt!.getTime(), state: 2 }
        if (order.status !== 'PROCESSING') return { billingError: -31008 }
        await fulfillPayment(tx, order, 'PAYME')
        const paid = await tx.paymentRequest.findUniqueOrThrow({ where: { id: order.id } })
        return { transaction: paid.id, perform_time: paid.performedAt!.getTime(), state: 2 }
      }
      if (order.status === 'CANCELED' || order.status === 'APPROVED' || order.status === 'REJECTED') return { billingError: -31008 }
      if (method === 'CheckPerformTransaction') return { allow: true }
      if (order.providerId) {
        if (order.providerId !== `PAYME:${transactionId}`) throw new PaymeError(-31099, 'Another transaction is active', 'order_id')
        return { create_time: order.preparedAt!.getTime(), transaction: order.id, state: 1 }
      }
      const providerTime = z.number().int().positive().parse(params.time)
      if (Date.now() - providerTime > 43200000 || providerTime > Date.now() + 300000) throw new PaymeError(-31008, 'Transaction has expired')
      order = await tx.paymentRequest.update({ where: { id: order.id }, data: { providerId: `PAYME:${transactionId}`,
        providerTime: BigInt(providerTime), preparedAt: new Date(), status: 'PROCESSING' } })
      return { create_time: order.preparedAt!.getTime(), transaction: order.id, state: 1 }
    })
    if ('billingError' in result) return fail(Number(result.billingError), 'Cannot perform this transaction')
    return res.json({ id, result })
  } catch (error) {
    if (error instanceof PaymeError) return fail(error.code, error.message, error.data)
    if (error instanceof z.ZodError) return fail(-32602, 'Invalid parameters')
    throw error
  }
}))
function paymeState(order: { id: string; status: string; preparedAt: Date | null; performedAt: Date | null; canceledAt: Date | null; cancelReason: number | null }) {
  return { transaction: order.id, create_time: order.preparedAt?.getTime() ?? 0, perform_time: order.performedAt?.getTime() ?? 0,
    cancel_time: order.canceledAt?.getTime() ?? 0, reason: order.cancelReason,
    state: order.status === 'APPROVED' ? 2 : order.status === 'CANCELED' ? (order.performedAt ? -2 : -1) : 1 }
}

// Mounted with express.raw before the global JSON parser.
export const stripeCallback = asyncHandler(async (req, res) => {
  if (!paymentProviders().find(item => item.code === 'STRIPE')?.enabled || !Buffer.isBuffer(req.body) ||
    !verifyStripeSignature(req.body, req.headers['stripe-signature'] as string ?? '')) return res.status(400).json({ message: 'Invalid signature' })
  const event = JSON.parse(req.body.toString('utf8')) as { type: string; data: { object: { id: string; client_reference_id: string; currency: string; amount_total: number; payment_status: string } } }
  if (['checkout.session.completed', 'checkout.session.async_payment_succeeded'].includes(event.type)) {
    const session = event.data.object
    if (session.payment_status !== 'paid') return res.json({ received: true })
    await prisma.$transaction(async tx => {
      const order = await tx.paymentRequest.findUnique({ where: { id: session.client_reference_id } })
      if (!order || order.method !== 'STRIPE' || order.currency !== 'USD' || session.currency !== 'usd' ||
        session.amount_total !== order.amountMinor || order.providerId !== `STRIPE:${session.id}`) throw new Error('Payment does not match order')
      await fulfillPayment(tx, order, 'STRIPE')
    })
  }
  return res.json({ received: true })
})
