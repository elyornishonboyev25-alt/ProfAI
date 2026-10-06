import type { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'
import { BillingError } from '../services/coinBilling.service.js'

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` })
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof BillingError) return res.status(error.statusCode).json({ message: error.message, code: error.code })
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed.',
      errors: error.flatten(),
    })
  }

  if (error instanceof Error) {
    return res.status(500).json({
      message: error.message,
    })
  }

  return res.status(500).json({ message: 'Unexpected server error.' })
}
