import assert from 'node:assert/strict'
import express from '../../backend/node_modules/express/index.js'
import recordings from '../../backend/src/routes/shadowingRecordings.routes.js'
import shadowing from '../../backend/src/routes/shadowing.routes.js'
import podcasts from '../../backend/src/routes/podcasts.routes.js'
import catalog from '../../backend/src/data/educationalMedia.json'

export async function run() {
  const app = express()
  app.use(express.json({ limit: '5mb' }))
  app.use('/recordings', recordings)
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
      assert.equal(videos.length, kind === 'podcasts' ? 300 : 22)
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
      assert.equal((kind === 'shadowing' ? video.captions : video.segments).length, 2, 'Real extracted cues remain usable')
      if (kind === 'shadowing') {
        assert.ok(video.durationSec <= 120)
        assert.equal(video.segments.length, 1, 'Short complete lesson stays in one section')
      }
      const again = await request(`/${kind}/${metadata.youtubeId}`)
      assert.equal(again.status, 200)
    }
    assert.equal((globalThis as any).__mediaExtractions, 1, 'Saved captions and repeated opens reuse their cache')
    const audio = Buffer.concat([Buffer.from([0x1a,0x45,0xdf,0xa3]), Buffer.alloc(40, 1)])
    const body = { recordingKey: '12345678-1234-4234-8234-123456789012', youtubeId: catalog.shadowing[0].youtubeId, durationSec: 30, mimeType:'audio/webm', audioBase64:audio.toString('base64') }
    const postRecording = (value = body, authenticated = true) => request('/recordings', { method:'POST', headers:{'Content-Type':'application/json', ...(authenticated ? {Authorization:'Bearer test'} : {})}, body:JSON.stringify(value) })
    assert.equal((await postRecording(body, false)).status, 401, 'Only signed-in learners can upload')
    assert.equal((await postRecording({...body, durationSec:121})).status, 400)
    assert.equal((await postRecording({...body, mimeType:'text/html'})).status, 400)
    assert.equal((await postRecording({...body, audioBase64:Buffer.alloc(40).toString('base64')})).status, 400, 'Container must match audio MIME')
    assert.equal((await postRecording({...body, youtubeId:'P26AE7NLx4Q'})).status, 422)
    const uploaded = await postRecording()
    assert.equal(uploaded.status, 201)
    const {path} = await uploaded.json() as any
    assert.match(path, /^\/shared\/shadowing\/c/)
    assert.equal((await (await postRecording()).json() as any).path, path, 'Repeated sharing reuses the same capability')
    const id = path.split('/').at(-1)
    const publicMetadata = await request(`/recordings/${id}`)
    assert.equal(publicMetadata.status, 200, 'Recipient needs no login')
    const {recording} = await publicMetadata.json() as any
    assert.deepEqual(Object.keys(recording).sort(), ['createdAt','durationSec','id','title','youtubeId'])
    assert.equal(recording.title, catalog.shadowing[0].title)
    const publicAudio = await request(`/recordings/${id}/audio`)
    assert.equal(publicAudio.status, 200)
    assert.equal(publicAudio.headers.get('cross-origin-resource-policy'), 'cross-origin', 'Audio works when frontend and API use different domains')
    assert.match(publicAudio.headers.get('content-type')!, /audio\/webm/)
    assert.deepEqual(Buffer.from(await publicAudio.arrayBuffer()), audio)
    const range = await request(`/recordings/${id}/audio`, {headers:{Range:'bytes=0-3'}})
    assert.equal(range.status, 206)
    assert.equal(range.headers.get('content-range'), `bytes 0-3/${audio.length}`)
    assert.deepEqual(Buffer.from(await range.arrayBuffer()), audio.subarray(0,4))
    assert.equal((await request(`/recordings/${id}/audio`, {headers:{Range:'bytes=9999-'}})).status, 416)
    assert.equal((await request('/recordings/not-an-id')).status, 404)
    console.log('PASS: public voice sharing, upload authentication/validation, privacy, idempotency, byte-range playback')
    console.log('PASS: API allowlists, legacy detail rejection, submission rejection, caption extraction and cache reuse')
  } finally { await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve())) }
}
