import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { validateBody, validateQuery } from '../middleware/validate.js'
import { asyncHandler } from '../utils/asyncHandler.js'

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

export default router
