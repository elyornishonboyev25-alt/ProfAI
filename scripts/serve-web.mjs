import http from 'node:http'
import https from 'node:https'
import { createReadStream } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { resolve, extname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isRetiredPagePath } from '../shared/retiredPages.mjs'

export const canonicalOrigin = 'https://ivygoo.com'
const redirectHosts = new Set(['profai.uz', 'www.profai.uz', 'profai.up.railway.app', 'www.ivygoo.com'])
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg', '.aac': 'audio/aac', '.mp4': 'video/mp4', '.pdf': 'application/pdf',
  '.vtt': 'text/vtt',
}

function proxyHeaders(req, target) {
  const headers = { ...req.headers, host: target.host }
  delete headers['cf-connecting-ip']
  // These headers come from Railway's trusted edge, not from the browser.
  headers['x-forwarded-host'] = req.headers.host
  headers['x-forwarded-proto'] = req.headers['x-forwarded-proto'] || 'https'
  return headers
}

export function createWebServer({ dist = resolve('dist'), upstream = process.env.API_UPSTREAM || 'http://prof-ai.railway.internal:5001' } = {}) {
  const root = resolve(dist)
  const target = new URL(upstream)
  if (!['http:', 'https:'].includes(target.protocol)) throw new Error('API_UPSTREAM must be an HTTP URL')
  const transport = target.protocol === 'https:' ? https : http

  function redirect(req, res) {
    const host = (req.headers.host || '').split(':')[0].toLowerCase()
    if (!redirectHosts.has(host)) return false
    res.writeHead(308, { Location: canonicalOrigin + req.url, 'Cache-Control': 'public, max-age=3600' })
    res.end()
    return true
  }

  const server = http.createServer(async (req, res) => {
    if (redirect(req, res)) return
    let pathname
    try { pathname = new URL(req.url, 'http://localhost').pathname }
    catch { res.writeHead(400); res.end('Invalid request URL'); return }
    if (pathname === '/healthz') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
      res.end('{"ok":true}')
      return
    }
    if (pathname === '/api' || pathname.startsWith('/api/')) {
      const proxy = transport.request(target, { method: req.method, path: req.url, headers: proxyHeaders(req, target) }, response => {
        // Auth, billing and private account data must never be cached by an edge.
        const headers = { ...response.headers, 'cache-control': 'no-store' }
        res.writeHead(response.statusCode || 502, headers)
        response.pipe(res)
      })
      proxy.on('error', () => {
        if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' })
        res.end('{"message":"The learning service is temporarily unavailable. Please try again."}')
      })
      proxy.setTimeout(120000, () => proxy.destroy())
      req.on('aborted', () => proxy.destroy())
      res.on('close', () => { if (!res.writableEnded) proxy.destroy() })
      req.pipe(proxy)
      return
    }
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return
    }
    try {
      let decoded
      try { decoded = decodeURIComponent(pathname) } catch { res.writeHead(400); res.end(); return }
      if (decoded.includes('\0') || decoded.includes('\\')) { res.writeHead(400); res.end(); return }
      const retired = isRetiredPagePath(pathname)
      let file = resolve(root, retired ? 'index.html' : '.' + decoded)
      if (file !== root && !file.startsWith(root + sep)) { res.writeHead(403); res.end(); return }
      let info = await stat(file).catch(() => null)
      if (info?.isDirectory()) { file = resolve(file, 'index.html'); info = await stat(file).catch(() => null) }
      let html = false
      if (!info?.isFile()) {
        if (extname(pathname)) { res.writeHead(404); res.end('Not found'); return }
        file = resolve(root, 'index.html'); info = await stat(file); html = true
      }
      html ||= extname(file) === '.html'
      const headers = { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff' }
      if (html) {
        let body = await readFile(file, 'utf8')
        if (pathname !== '/') {
          headers['X-Robots-Tag'] = 'noindex, follow'
          body = body.replace(/<meta name="robots" content="[^"]*"\s*\/>/, '<meta name="robots" content="noindex, follow" />')
            .replace(/<link rel="canonical"[^>]*\/>/, '')
            .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, '')
        }
        headers['Cache-Control'] = retired ? 'no-store' : 'no-cache'
        headers['Content-Length'] = Buffer.byteLength(body)
        res.writeHead(retired ? 404 : 200, headers); res.end(req.method === 'HEAD' ? undefined : body); return
      }
      headers['Cache-Control'] = /\/assets\/.*-[\w-]+\.(js|css)$/.test(pathname) ? 'public, max-age=31536000, immutable' : 'public, max-age=3600'
      if (['/sw.js', '/sw-cleanup.js', '/registerSW.js', '/manifest.webmanifest', '/robots.txt', '/sitemap.xml'].includes(pathname)) headers['Cache-Control'] = 'no-cache'
      headers['Accept-Ranges'] = 'bytes'
      const etag = `W/"${info.size}-${Math.trunc(info.mtimeMs)}"`
      headers.ETag = etag
      if (req.headers['if-none-match'] === etag && !req.headers.range) { res.writeHead(304, headers); res.end(); return }
      let start = 0, end = info.size - 1, status = 200
      if (req.headers.range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range)
        if (match && (match[1] || match[2])) {
          start = match[1] ? Number(match[1]) : Math.max(0, info.size - Number(match[2]))
          end = match[1] && match[2] ? Math.min(Number(match[2]), info.size - 1) : info.size - 1
        } else start = info.size
        if (start > end || start >= info.size) {
          res.writeHead(416, { ...headers, 'Content-Range': `bytes */${info.size}` }); res.end(); return
        }
        status = 206; headers['Content-Range'] = `bytes ${start}-${end}/${info.size}`
      }
      headers['Content-Length'] = Math.max(0, end - start + 1)
      res.writeHead(status, headers)
      if (req.method === 'HEAD' || info.size === 0) { res.end(); return }
      createReadStream(file, { start, end }).on('error', () => res.destroy()).pipe(res)
    } catch {
      if (!res.headersSent) res.writeHead(500, { 'Cache-Control': 'no-store' })
      res.end('Unable to load this page')
    }
  })
  // Keep live Speaking/WebRTC signaling on the same public Ivygoo origin.
  server.on('upgrade', (req, socket, head) => {
    if (!req.url?.startsWith('/ws/')) { socket.destroy(); return }
    const proxy = transport.request(target, { method: 'GET', path: req.url, headers: proxyHeaders(req, target) })
    proxy.on('upgrade', (response, upstreamSocket, upstreamHead) => {
      socket.write(`HTTP/1.1 ${response.statusCode} ${response.statusMessage}\r\n`)
      for (const [name, value] of Object.entries(response.headers)) {
        for (const item of Array.isArray(value) ? value : [value]) socket.write(`${name}: ${item}\r\n`)
      }
      socket.write('\r\n')
      if (upstreamHead.length) socket.write(upstreamHead)
      if (head.length) upstreamSocket.write(head)
      socket.pipe(upstreamSocket).pipe(socket)
      socket.on('error', () => upstreamSocket.destroy())
      upstreamSocket.on('error', () => socket.destroy())
      socket.on('close', () => upstreamSocket.destroy())
      upstreamSocket.on('close', () => socket.destroy())
    })
    proxy.on('response', response => { response.resume(); socket.end('HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\n') })
    proxy.on('error', () => socket.destroy())
    proxy.end()
  })
  return server
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createWebServer()
  server.listen(Number(process.env.PORT || 8080), '::', () => console.log('Ivygoo web server is ready'))
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)))
}
