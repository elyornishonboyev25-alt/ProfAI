import assert from 'node:assert/strict'
import test from 'node:test'
import http from 'node:http'
import net from 'node:net'
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { once } from 'node:events'
import { createWebServer } from '../serve-web.mjs'

test('Ivygoo migration keeps routes, API, media seeking and Speaking signaling working', { timeout: 15000 }, async () => {
  const dist = await mkdtemp(join(tmpdir(), 'ivygoo-web-'))
  const upstream = http.createServer((req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, { 'Access-Control-Allow-Origin': 'https://ivygoo.com', 'Access-Control-Allow-Headers': 'content-type,x-device-id' }); res.end(); return
    }
    const parts = []
    req.on('data', part => parts.push(part))
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Set-Cookie': 'session=test; Secure; HttpOnly' })
      res.end(JSON.stringify({ path: req.url, auth: req.headers.authorization, device: req.headers['x-device-id'], body: Buffer.concat(parts).toString(), origin: req.headers.origin }))
    })
  })
  const connections = new Set()
  upstream.on('connection', socket => { connections.add(socket); socket.on('close', () => connections.delete(socket)) })
  upstream.on('upgrade', (req, socket, head) => {
    socket.write('HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: websocket\r\n\r\n')
    if (head.length) socket.write(head)
    socket.on('data', data => socket.write(data))
    socket.on('error', () => {})
  })
  await once(upstream.listen(0, '127.0.0.1'), 'listening')
  await mkdir(join(dist, 'assets'))
  const home = '<title>Ivygoo</title><link rel="canonical" href="https://ivygoo.com/" /><meta name="robots" content="index, follow" /><script type="application/ld+json">{"name":"Ivygoo"}</script><h1>Ivygoo</h1>'
  await writeFile(join(dist, 'index.html'), home)
  await writeFile(join(dist, 'track.mp3'), '0123456789')
  await writeFile(join(dist, 'assets', 'index-abc123.js'), 'console.log("Ivygoo")')
  const server = createWebServer({ dist, upstream: `http://127.0.0.1:${upstream.address().port}` })
  server.on('connection', socket => { connections.add(socket); socket.on('close', () => connections.delete(socket)) })
  await once(server.listen(0, '127.0.0.1'), 'listening')
  const base = `http://127.0.0.1:${server.address().port}`
  try {
    for (const host of ['www.profai.uz', 'profai.uz', 'profai.up.railway.app', 'www.ivygoo.com']) {
      const r = await new Promise((resolve, reject) => {
        http.get(base + '/shared/result?a=1', { headers: { Host: host } }, response => {
          response.resume(); response.on('end', () => resolve(response))
        }).on('error', reject)
      })
      assert.equal(r.statusCode, 308)
      assert.equal(r.headers.location, 'https://ivygoo.com/shared/result?a=1')
    }
    const homeResponse = await fetch(base, { headers: { Host: 'ivygoo.com' } })
    assert.equal(await homeResponse.text(), home)
    assert.equal(homeResponse.headers.get('cache-control'), 'no-cache')
    const privatePage = await fetch(base + '/dashboard')
    assert.equal(privatePage.headers.get('x-robots-tag'), 'noindex, follow')
    const privateHtml = await privatePage.text()
    assert.ok(!privateHtml.includes('rel="canonical"'))
    assert.ok(!privateHtml.includes('application/ld+json'))
    assert.ok(privateHtml.includes('content="noindex, follow"'))
    const api = await fetch(base + '/api/v1/auth/email/login?next=dashboard', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test', 'X-Device-Id': 'browser-test', Origin: 'https://ivygoo.com' }, body: '{"verificationCode":"123456"}',
    })
    assert.equal(api.headers.get('content-type'), 'application/json')
    assert.equal(api.headers.get('cache-control'), 'no-store')
    assert.equal(api.headers.get('set-cookie'), 'session=test; Secure; HttpOnly')
    assert.deepEqual(await api.json(), { path: '/api/v1/auth/email/login?next=dashboard', auth: 'Bearer test', device: 'browser-test', body: '{"verificationCode":"123456"}', origin: 'https://ivygoo.com' })
    const options = await fetch(base + '/api/v1/auth/verification/request', { method: 'OPTIONS' })
    assert.equal(options.status, 204)
    assert.equal(options.headers.get('access-control-allow-origin'), 'https://ivygoo.com')
    const audio = await fetch(base + '/track.mp3', { headers: { Range: 'bytes=3-6' } })
    assert.equal(audio.status, 206)
    assert.equal(audio.headers.get('content-range'), 'bytes 3-6/10')
    assert.equal(await audio.text(), '3456')
    const tail = await fetch(base + '/track.mp3', { headers: { Range: 'bytes=-3' } })
    assert.equal(await tail.text(), '789')
    assert.equal((await fetch(base + '/track.mp3', { headers: { Range: 'bytes=99-100' } })).status, 416)
    const head = await fetch(base + '/track.mp3', { method: 'HEAD' })
    assert.equal(head.headers.get('content-length'), '10')
    assert.equal(await head.text(), '')
    assert.equal((await fetch(base + '/missing.js')).status, 404)
    assert.equal((await fetch(base + '/bad%5cpath')).status, 400)
    const asset = await fetch(base + '/assets/index-abc123.js')
    assert.ok(asset.headers.get('cache-control').includes('immutable'))
    assert.equal((await fetch(base + '/assets/index-abc123.js', { headers: { 'If-None-Match': asset.headers.get('etag') } })).status, 304)
    const health = await fetch(base + '/healthz')
    assert.deepEqual(await health.json(), { ok: true })
    // Raw tunnel: validates that the proxy preserves Upgrade and duplex bytes.
    const socket = net.connect(server.address().port, '127.0.0.1')
    await once(socket, 'connect')
    const handshake = once(socket, 'data')
    socket.write('GET /ws/speaking?token=test HTTP/1.1\r\nHost: ivygoo.com\r\nConnection: Upgrade\r\nUpgrade: websocket\r\n\r\n')
    assert.match((await handshake)[0].toString(), /101 Switching Protocols/)
    const echo = once(socket, 'data')
    socket.write('speaking-stream')
    assert.equal((await echo)[0].toString(), 'speaking-stream')
    socket.destroy()
  } finally {
    for (const socket of connections) socket.destroy()
    server.closeAllConnections(); upstream.closeAllConnections()
    await Promise.all([new Promise(resolve => server.close(resolve)), new Promise(resolve => upstream.close(resolve))])
    await rm(dist, { recursive: true, force: true })
  }
})


test('Retired exam hub URLs return real 404 responses while live exams remain available', { timeout: 15000 }, async () => {
  const dist = await mkdtemp(join(tmpdir(), 'ivygoo-retired-pages-'))
  await writeFile(join(dist, 'index.html'), '<title>Ivygoo</title><meta name="robots" content="index, follow" /><div id="root">Current app</div>')
  await mkdir(join(dist, 'test-preparation'))
  await writeFile(join(dist, 'test-preparation', 'index.html'), '<h1>Obsolete exam hub</h1>')
  const server = createWebServer({ dist, upstream: 'http://127.0.0.1:1' })
  await once(server.listen(0, '127.0.0.1'), 'listening')
  const base = 'http://127.0.0.1:' + server.address().port
  try {
    for (const path of ['/test-preparation', '/test-preparation/', '/test-preparation/old', '/test-preparation/old.js', '/TEST-PREPARATION', '/test%2Dpreparation', '/tests', '/tests/', '/TESTS', '/mock', '/mock/', '/%6Dock?source=old']) {
      const response = await fetch(base + path)
      assert.equal(response.status, 404, path)
      assert.equal(response.headers.get('cache-control'), 'no-store', path)
      assert.equal(response.headers.get('x-robots-tag'), 'noindex, follow', path)
      assert.equal(response.headers.get('location'), null, path)
      const body = await response.text()
      assert.ok(body.includes('Current app'), path)
      assert.ok(!body.includes('Obsolete exam hub'), path)
      const head = await fetch(base + path, { method: 'HEAD' })
      assert.equal(head.status, 404, path)
      assert.equal(await head.text(), '', path)
    }
    for (const path of ['/', '/login', '/dashboard', '/ielts', '/ielts/tests', '/ielts/reading/tests', '/sat', '/sat/mocks', '/mock/ielts', '/mock/ielts/full-mock-1', '/mock/sat/1', '/sat/mock/1/run', '/tests/custom-test/attempt', '/results/example', '/academic-skills', '/admission']) {
      assert.equal((await fetch(base + path)).status, 200, path)
    }
  } finally {
    server.closeAllConnections()
    await new Promise(resolve => server.close(resolve))
    assert.ok(dist.startsWith(join(tmpdir(), 'ivygoo-retired-pages-')))
    await rm(dist, { recursive: true, force: true })
  }
})
