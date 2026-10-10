import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { validateBody, validateQuery } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { requireAuth } from '../middleware/auth.js'
import { requireOwner } from '../middleware/owner.js'

const router = Router()

// These account holders approved public photos beside their featured testimonials.
// Keep email addresses on the server; public requests use only testimonial IDs.
const featuredAccountEmails: Record<string, string> = {
  'featured-azizbek': 'wiynsara@gmail.com',
  'featured-madina': 'qsardor57913@gmail.com',
  'featured-muhammadali': 'khodirqulov@gmail.com',
  'featured-sevinch': 'sevaraabdumavlonova53@gmail.com',
  'featured-bekzod': 'firdavzalimkulov@gmail.com',
  'featured-ziyoda': 'shavkatovj8@gmail.com',
  'featured-umar': 'amirbek.ave@gmail.com',
  'featured-malika': 'n03027825@gmail.com',
  'featured-javohir': 'jaloliddin2009applicant@gmail.com',
  'featured-nilufar': 'erkinov09@gmail.com',
  'featured-sardor': 'murtozbek456@gmail.com',
  'featured-mohira': 'muhidinovasitora04@gmail.com',
}

router.get('/featured-avatar/:id', asyncHandler(async (req, res) => {
  // Public testimonial photos are embedded by the separately hosted frontend.
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
  const email = Object.prototype.hasOwnProperty.call(featuredAccountEmails, req.params.id)
    ? featuredAccountEmails[req.params.id]
    : undefined
  if (!email) return res.status(404).send()

  const user = await prisma.user.findUnique({
    where: { email },
    select: { avatarUrl: true, googleAvatarUrl: true },
  })
  res.setHeader('Cache-Control', 'public, max-age=300')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  for (const avatar of [user?.avatarUrl, user?.googleAvatarUrl]) {
    if (!avatar) continue
    const embedded = avatar.match(/^data:image\/(png|jpe?g|webp|gif);base64,([A-Za-z0-9+/=]+)$/i)
    if (embedded && avatar.length <= 700_000) {
      res.type(`image/${embedded[1].toLowerCase() === 'jpg' ? 'jpeg' : embedded[1].toLowerCase()}`)
      return res.send(Buffer.from(embedded[2], 'base64'))
    }
    try {
      const imageUrl = new URL(avatar)
      if (imageUrl.protocol === 'https:' && !imageUrl.username && !imageUrl.password && (imageUrl.hostname === 'googleusercontent.com' || imageUrl.hostname.endsWith('.googleusercontent.com'))) {
        const response = await fetch(imageUrl, {
          headers: { Accept: 'image/jpeg,image/png,image/webp,image/gif' },
          redirect: 'error',
          signal: AbortSignal.timeout(5000),
        })
        const contentType = response.headers.get('content-type')?.split(';')[0].toLowerCase()
        if (!response.ok || !contentType || !['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(contentType)) continue
        const bytes = Buffer.from(await response.arrayBuffer())
        if (bytes.length > 2_000_000) continue
        res.type(contentType)
        return res.send(bytes)
      }
    } catch {
      // An unavailable photo falls back to the Google photo or client initials.
    }
  }
  return res.status(404).send()
}))

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(60).default(24),
})

const createSchema = z.object({
  name: z.string().trim().min(2).max(60),
  exam: z.enum(['IELTS', 'SAT', 'General']).default('IELTS'),
  rating: z.number().int().min(1).max(5).optional(),
  bandBefore: z.string().trim().max(12).optional().or(z.literal('')),
  bandAfter: z.string().trim().max(12).optional().or(z.literal('')),
  text: z.string().trim().min(8).max(600),
}).superRefine((body, ctx) => {
  const before = body.bandBefore || ''
  const after = body.bandAfter || ''
  if (!before && !after) return
  const scores = [before, after].map(Number)
  const valid = Boolean(before && after) && (body.exam === 'IELTS'
    ? scores.every(score => Number.isFinite(score) && score >= 0 && score <= 9 && Number.isInteger(score * 2))
    : body.exam === 'SAT' && scores.every(score => Number.isInteger(score) && score >= 400 && score <= 1600 && score % 10 === 0))
  if (!valid) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['bandBefore'], message: 'Provide both valid IELTS bands (0-9, steps of 0.5) or SAT scores (400-1600, steps of 10).' })
})

// Public — anyone (even signed-out visitors) can read the shared testimonials.
router.get(
  '/',
  validateQuery(listQuerySchema),
  asyncHandler(async (req, res) => {
    const { limit } = req.query as unknown as z.infer<typeof listQuerySchema>

    const reviews = await prisma.review.findMany({
      where: { approved: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        exam: true,
        rating: true,
        bandBefore: true,
        bandAfter: true,
        text: true,
        createdAt: true,
      },
    })

    return res.json({ reviews })
  }),
)

// Public — visitors can submit a success story without an account. The global
// API rate-limiter (mounted in app.ts) guards this against spam bursts.
router.post(
  '/',
  validateBody(createSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as z.infer<typeof createSchema>

    const review = await prisma.review.create({
      data: {
        approved: false,
        name: body.name,
        exam: body.exam,
        rating: body.rating ?? null,
        bandBefore: body.bandBefore ? body.bandBefore : null,
        bandAfter: body.bandAfter ? body.bandAfter : null,
        text: body.text,
      },
      select: {
        id: true,
        name: true,
        exam: true,
        rating: true,
        bandBefore: true,
        bandAfter: true,
        text: true,
        approved: true,
        createdAt: true,
      },
    })

    return res.status(201).json({ review })
  }),
)

const ownerListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  status: z.enum(['PENDING', 'PUBLISHED', 'ALL']).default('PENDING'),
})

router.get('/owner', requireAuth, requireOwner, validateQuery(ownerListSchema), asyncHandler(async (req, res) => {
  const { page, status } = req.query as unknown as z.infer<typeof ownerListSchema>
  const where = status === 'ALL' ? {} : { approved: status === 'PUBLISHED' }
  const pageSize = 12
  const [items, total] = await prisma.$transaction([
    prisma.review.findMany({ where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * pageSize, take: pageSize }),
    prisma.review.count({ where }),
  ])
  return res.json({ items, total, page, pageSize })
}))

router.patch('/owner/:id', requireAuth, requireOwner, validateBody(z.object({ approved: z.boolean() }).strict()), asyncHandler(async (req, res) => {
  const result = await prisma.review.updateMany({ where: { id: req.params.id }, data: { approved: req.body.approved } })
  if (!result.count) return res.status(404).json({ message: 'Comment not found.' })
  return res.json({ approved: req.body.approved })
}))

router.delete('/owner/:id', requireAuth, requireOwner, asyncHandler(async (req, res) => {
  const result = await prisma.review.deleteMany({ where: { id: req.params.id } })
  if (!result.count) return res.status(404).json({ message: 'Comment not found.' })
  return res.status(204).send()
}))

export default router
