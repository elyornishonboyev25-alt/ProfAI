import assert from 'node:assert/strict'
import http from 'node:http'
import { WebSocket } from 'ws'
import { attachSpeakingSignaling } from '../dist/realtime/speakingSignaling.js'

const saved = new Map()
let failSave = false
const sockets = []
const server = http.createServer()
const signaling = attachSpeakingSignaling(server, async token => token.startsWith('account:') ? { userId: token.slice(8), name: token.slice(8), avatarUrl: null, public: true } : null, {
  load: async userId => [...(saved.get(userId)?.values() ?? [])],
  set: async (blockerId, blockedId, blocked) => {
    if (failSave) throw new Error('Temporary persistence failure')
    const people = saved.get(blockerId) ?? new Map()
    if (blocked) people.set(blockedId, { userId: blockedId, name: blockedId, avatarUrl: null })
    else people.delete(blockedId)
    saved.set(blockerId, people)
  },
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const url = `ws://127.0.0.1:${server.address().port}/ws/speaking`
const send = (socket, payload) => socket.send(JSON.stringify(payload))
function next(socket, predicate, timeoutMs = 4000) {
  const index = socket.events.findIndex(predicate)
  if (index >= 0) return Promise.resolve(socket.events.splice(index, 1)[0])
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.off('message', receive); reject(new Error(`No event: ${predicate}; ${JSON.stringify(socket.events.slice(-4))}`)) }, timeoutMs)
    const receive = raw => {
      const message = JSON.parse(raw.toString())
      if (!predicate(message)) return
      clearTimeout(timer); socket.off('message', receive)
      const captured = socket.events.findIndex(event => JSON.stringify(event) === JSON.stringify(message))
      if (captured >= 0) socket.events.splice(captured, 1)
      resolve(message)
    }
    socket.on('message', receive)
  })
}
const type = name => message => message.type === name
async function connect(name) {
  const socket = new WebSocket(url)
  sockets.push(socket); socket.events = []
  socket.on('message', raw => socket.events.push(JSON.parse(raw.toString())))
  await new Promise(resolve => socket.once('open', resolve))
  send(socket, { type: 'communityHello', token: `account:${name}` })
  await next(socket, type('communityReady'))
  return socket
}
try {
  const caller = await connect('Caller')
  let recipient = await connect('Recipient')
  const otherTab = await connect('Recipient')
  const third = await connect('Third')
  send(caller, { type: 'communityInvite', nickname: 'Recipient' })
  let invite = await next(recipient, type('communityInvitation'))
  send(recipient, { type: 'communityReply', id: invite.id, accept: false })
  assert.match((await next(caller, message => message.type === 'communityNotice' && /declined/.test(message.message))).message, /declined/)
  assert.equal(signaling.clients.size, 4, 'Declining does not disconnect either learner')

  send(caller, { type: 'communityInvite', nickname: 'Recipient' })
  invite = await next(recipient, type('communityInvitation'))
  const realNow = Date.now
  try {
    Date.now = () => invite.expiresAt + 1
    await next(recipient, message => message.type === 'communityInvitationCancelled' && message.id === invite.id)
    await next(caller, message => message.type === 'communityNotice' && /expired/.test(message.message))
    assert.equal(recipient.events.some(message => message.type === 'communityJoined'), false, 'Ignoring a call lets it expire without opening a room')
  } finally { Date.now = realNow }

  send(caller, { type: 'communityInvite', nickname: 'Recipient' })
  invite = await next(recipient, type('communityInvitation'))
  send(third, { type: 'communityBlock', id: invite.id })
  await next(third, type('communityError'))
  assert.equal(saved.size, 0, 'A third account cannot block using another learner\'s invitation')
  send(recipient, { type: 'communityBlock', id: invite.id })
  send(otherTab, { type: 'communityReply', id: invite.id, accept: true })
  await next(recipient, message => message.type === 'communityBlocks' && message.people.some(person => person.name === 'Caller'))
  await next(otherTab, message => message.type === 'communityBlocks' && message.people.some(person => person.name === 'Caller'))
  assert.ok(saved.get('Recipient').has('Caller'), 'Block is persisted by verified account IDs')
  assert.equal(recipient.events.some(message => message.type === 'communityJoined'), false, 'Another tab cannot accept a call while it is being blocked')
  const hidden = await next(caller, message => message.type === 'communityLobby' && !message.available.includes('Recipient'))
  assert.ok(!hidden.available.includes('Recipient'))
  send(caller, { type: 'communityInvite', nickname: 'Recipient' })
  const refused = await next(caller, type('communityError'))
  assert.match(refused.message, /no longer available/)
  assert.doesNotMatch(refused.message, /block/i, 'The caller gets no private block-list details')
  send(recipient, { type: 'communityInvite', nickname: 'Caller' })
  await next(recipient, type('communityError'))

  send(caller, { type: 'communityMatch' }); await next(caller, type('communityMatching'))
  send(recipient, { type: 'communityMatch' }); await next(recipient, type('communityMatching'))
  assert.equal(caller.events.some(message => message.type === 'communityJoined'), false, 'Blocked pairs do not match randomly')
  send(caller, { type: 'communityLeave' }); await next(caller, type('communityLeft'))
  send(recipient, { type: 'communityLeave' }); await next(recipient, type('communityLeft'))

  await Promise.all([recipient, otherTab].map(socket => new Promise(resolve => { socket.once('close', resolve); socket.close() })))
  recipient = await connect('Recipient')
  await next(recipient, message => message.type === 'communityBlocks' && message.people.some(person => person.name === 'Caller'))
  send(caller, { type: 'communityInvite', nickname: 'Recipient' })
  await next(caller, type('communityError'))
  failSave = true
  send(recipient, { type: 'communityUnblock', userId: 'Caller' })
  await next(recipient, type('communityError'))
  assert.ok(saved.get('Recipient').has('Caller'), 'An unblock storage failure leaves the block intact')
  failSave = false
  send(recipient, { type: 'communityUnblock', userId: 'Caller' })
  await next(recipient, message => message.type === 'communityBlocks' && !message.people.length)
  send(recipient, { type: 'communityUnblock', userId: 'Caller' })
  await next(recipient, message => message.type === 'communityBlocks' && !message.people.length)
  await next(caller, message => message.type === 'communityLobby' && message.available.includes('Recipient'))
  send(caller, { type: 'communityInvite', nickname: 'Recipient' })
  invite = await next(recipient, type('communityInvitation'))
  failSave = true
  send(recipient, { type: 'communityBlock', id: invite.id })
  const failure = await next(recipient, type('communityError'))
  assert.match(failure.message, /declined.*could not be saved/)
  assert.equal(saved.get('Recipient').has('Caller'), false, 'Failed saves are not reported as permanent blocks')
  failSave = false
  await next(caller, message => message.type === 'communityLobby' && message.available.includes('Recipient'))
  send(caller, { type: 'communityInvite', nickname: 'Recipient' })
  invite = await next(recipient, type('communityInvitation'))
  send(recipient, { type: 'communityReply', id: invite.id, accept: true })
  await next(caller, type('communityJoined')); await next(recipient, type('communityJoined'))
  console.log('PASS: decline, durable call blocks, cross-tab cancellation, spoof rejection, mutual invite prevention, random-match filtering, reconnect, unblock, persistence failures and accepted calls.')
} finally {
  sockets.forEach(socket => socket.terminate())
  await new Promise(resolve => signaling.close(resolve))
  await new Promise(resolve => server.close(resolve))
}
