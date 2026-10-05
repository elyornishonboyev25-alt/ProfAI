import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { approvedMedia } from '../services/educationalMedia.service.js'

export const shadowingUploadLimit = rateLimit({
  windowMs: 60 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false,
  keyGenerator: req => req.user!.id,
  message: { message: 'Please wait before sharing another recording.' },
})
const schema = z.object({
  recordingKey: z.string().uuid(), youtubeId: z.string().regex(/^[\w-]{11}$/),
  mimeType: z.enum(['audio/webm', 'audio/mp4', 'audio/ogg', 'audio/wav']),
  durationSec: z.number().positive().max(120),
  audioBase64: z.string().min(24).max(4 * 1024 * 1024).regex(/^[A-Za-z0-9+/]+={0,2}$/),
}).strict()
const router = Router()
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const parsed = schema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ message: 'Choose a valid recording of up to 2 minutes.' })
  const body = parsed.data
  const lesson = approvedMedia('shadowing', body.youtubeId)
  if (!lesson) return res.status(422).json({ message: 'This shadowing lesson is unavailable.' })
  const audio = Buffer.from(body.audioBase64, 'base64')
  const validContainer = body.mimeType === 'audio/webm' ? audio.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))
    : body.mimeType === 'audio/ogg' ? audio.subarray(0, 4).toString() === 'OggS'
    : body.mimeType === 'audio/mp4' ? audio.subarray(4, 8).toString() === 'ftyp'
    : audio.subarray(0, 4).toString() === 'RIFF' && audio.subarray(8, 12).toString() === 'WAVE'
  if (audio.length < 16 || audio.length > 3 * 1024 * 1024 || !validContainer || audio.toString('base64') !== body.audioBase64) {
    return res.status(400).json({ message: 'This recording is invalid or too large. Please record it again.' })
  }
  const recording = await prisma.shadowingRecording.upsert({
    where: { userId_recordingKey: { userId: req.user!.id, recordingKey: body.recordingKey } },
    create: { userId: req.user!.id, recordingKey: body.recordingKey, youtubeId: body.youtubeId,
      title: lesson.title, mimeType: body.mimeType, durationSec: body.durationSec, audio },
    update: {}, select: { id: true },
  })
  return res.status(201).json({ path: `/shared/shadowing/${recording.id}` })
}))
const publicId = z.string().cuid()
router.get('/:id', asyncHandler(async (req, res) => {
  if (!publicId.safeParse(req.params.id).success) return res.status(404).json({ message: 'Recording not found.' })
  const recording = await prisma.shadowingRecording.findUnique({ where: { id: req.params.id },
    select: { id: true, title: true, youtubeId: true, durationSec: true, createdAt: true } })
  if (!recording) return res.status(404).json({ message: 'Recording not found.' })
  res.setHeader('Cache-Control', 'no-store')
  return res.json({ recording })
}))
router.get('/:id/audio', asyncHandler(async (req, res) => {
  if (!publicId.safeParse(req.params.id).success) return res.status(404).end()
  const recording = await prisma.shadowingRecording.findUnique({ where: { id: req.params.id }, select: { audio: true, mimeType: true } })
  if (!recording) return res.status(404).end()
  const data = Buffer.from(recording.audio)
  res.setHeader('Content-Type', recording.mimeType)
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('Cache-Control', 'private, max-age=3600')
  res.setHeader('Accept-Ranges', 'bytes')
  if (req.headers.range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range)
    const start = match?.[1] ? Number(match[1]) : match?.[2] ? Math.max(0, data.length - Number(match[2])) : NaN
    const end = match?.[1] && match[2] ? Math.min(data.length - 1, Number(match[2])) : data.length - 1
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || start >= data.length || end < start) {
      res.setHeader('Content-Range', `bytes */${data.length}`)
      return res.status(416).end()
    }
    res.setHeader('Content-Range', `bytes ${start}-${end}/${data.length}`)
    res.setHeader('Content-Length', end - start + 1)
    return res.status(206).send(data.subarray(start, end + 1))
  }
  res.setHeader('Content-Length', data.length)
  return res.send(data)
}))
export default router
