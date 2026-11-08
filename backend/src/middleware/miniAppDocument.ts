import type { RequestHandler } from 'express'
import helmet from 'helmet'

const documentPolicy = helmet.contentSecurityPolicy({ directives: {
  scriptSrc: ["'self'", 'https://telegram.org'],
  frameAncestors: ["'self'", 'https://web.telegram.org'],
} })

// The API keeps Helmet's standard frame guard. HTML documents may also be
// embedded by Telegram Web, and load only Telegram's official Mini App SDK.
export const miniAppDocument: RequestHandler = (req, res, next) => {
  if (!['GET', 'HEAD'].includes(req.method) || req.path.startsWith('/api/') || /\.[^/]+$/.test(req.path) && !req.path.endsWith('.html')) return next()
  res.removeHeader('X-Frame-Options')
  return documentPolicy(req, res, next)
}
