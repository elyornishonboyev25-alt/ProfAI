import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { createServer } from 'node:http'
import { once } from 'node:events'
import vm from 'node:vm'
import { build } from '../../node_modules/esbuild/lib/main.js'

const require = createRequire(import.meta.url)
const WebSocket = require('ws')
const bundle = await build({
  stdin: { contents: `export { attachSpeakingSignaling } from './backend/src/realtime/speakingSignaling'; export * from './backend/src/services/accountLifecycle';`, resolveDir: process.cwd() },
  bundle: true, write: false, platform: 'node', format: 'cjs', packages: 'external',
})
const module = { exports: {} }
const errors = []
vm.runInNewContext(bundle.outputFiles[0].text, { module, exports: module.exports, require,
  console: { error: (...args) => errors.push(args) } })
const { attachSpeakingSignaling, clearDeletedAccountRuntimeData, onAccountDeleted } = module.exports
const server = createServer()
const wss = attachSpeakingSignaling(server)
server.listen(0, '127.0.0.1')
await once(server, 'listening')
const clients = []
async function connect(id) {
  const ws = new WebSocket(`ws://127.0.0.1:${server.address().port}/ws/speaking`)
  clients.push(ws)
  await once(ws, 'open')
  ws.send(JSON.stringify({ type: 'hello', userId: id, name: id }))
  return ws
}
function waitFor(ws, predicate) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { ws.off('message', receive); reject(new Error('Missing room update')) }, 5000)
    function receive(raw) {
      const message = JSON.parse(raw.toString())
      if (!predicate(message)) return
      clearTimeout(timer)
      ws.off('message', receive)
      resolve(message)
    }
    ws.on('message', receive)
  })
}
const send = (ws, message) => ws.send(JSON.stringify(message))
try {
  const alice = await connect('alice')
  const bob = await connect('bob')
  for (const ws of [alice, bob]) {
    const joined = waitFor(ws, message => message.type === 'discussionSnapshot')
    send(ws, { type: 'joinDiscussion', roomId: 'hard-questions' })
    await joined
  }
  const received = waitFor(bob, message => message.type === 'discussionMessage')
  send(alice, { type: 'discussionMessage', roomId: 'hard-questions', text: 'Personal discussion message' })
  assert.equal((await received).message.userId, 'alice')
  const disconnected = once(alice, 'close')
  const replaced = waitFor(bob, message => message.type === 'discussionSnapshot')
  let remainingCleanupRan = false
  onAccountDeleted(() => { throw new Error('Provider unavailable') })
  onAccountDeleted(() => { remainingCleanupRan = true })
  await clearDeletedAccountRuntimeData('alice')
  assert.equal((await disconnected)[0], 1008, 'Deleted account leaves live speaking rooms')
  assert.equal((await replaced).messages.length, 0, 'Existing members lose the deleted user’s cached messages')
  assert.equal(bob.readyState, WebSocket.OPEN, 'Other members stay connected')
  assert.equal(remainingCleanupRan, true, 'One failing cleanup cannot skip other personal caches')
  assert.equal(errors.length, 1)
  const charlie = await connect('charlie')
  const history = waitFor(charlie, message => message.type === 'discussionSnapshot')
  send(charlie, { type: 'joinDiscussion', roomId: 'hard-questions' })
  assert.equal((await history).messages.length, 0, 'New members cannot retrieve deleted messages')
  console.log('Runtime deletion: speaking disconnect, discussion history removal, other-user isolation and independent cleanup failures passed.')
} finally {
  for (const ws of clients) ws.terminate()
  await new Promise(resolve => wss.close(resolve))
  await new Promise(resolve => server.close(resolve))
}
