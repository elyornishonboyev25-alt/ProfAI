import assert from 'node:assert/strict'
import express from '../../backend/node_modules/express/index.js'
import shadowing from '../../backend/src/routes/shadowing.routes.js'
import podcasts from '../../backend/src/routes/podcasts.routes.js'
import catalog from '../../backend/src/data/educationalMedia.json'

export async function run() {
  const app = express()
  app.use(express.json())
  app.use('/shadowing', shadowing)
  app.use('/podcasts', podcasts)
  const server = app.listen(0, '127.0.0.1')
  await new Promise<void>(resolve => server.on('listening', resolve))
  const port = (server.address() as { port: number }).port
  const request = (path: string, options?: RequestInit) => fetch(`http://127.0.0.1:${port}${path}`, options)
  try {
    for (const kind of ['shadowing', 'podcasts'] as const) {
      const response = await request(`/${kind}`)
      assert.equal(response.status, 200)
      const { videos } = await response.json() as any
      assert.equal(videos.length, kind === 'podcasts' ? 300 : 100)
      assert.deepEqual(videos.map((item: any) => item.youtubeId), catalog[kind].map(item => item.youtubeId))
      const unknown = await request(`/${kind}/P26AE7NLx4Q`)
      assert.equal(unknown.status, 404, 'Legacy video cannot be reopened by URL')
      const post = await request(`/${kind}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=P26AE7NLx4Q' }) })
      assert.equal(post.status, 422, 'Unreviewed submissions cannot enter the library')
      const metadata = catalog[kind][0]
      const detail = await request(`/${kind}/${metadata.youtubeId}`)
      assert.equal(detail.status, 200)
      const { video } = await detail.json() as any
      assert.equal(video.title, metadata.title, 'Curated metadata overrides legacy cached metadata')
      assert.equal(video.author, metadata.source)
      assert.equal(video.segments.length, 2, 'Real extracted cues remain usable')
      const again = await request(`/${kind}/${metadata.youtubeId}`)
      assert.equal(again.status, 200)
    }
    assert.equal((globalThis as any).__mediaExtractions, 1, 'Saved captions and repeated opens reuse their cache')
    console.log('PASS: API allowlists, legacy detail rejection, submission rejection, caption extraction and cache reuse')
  } finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())) }
}
