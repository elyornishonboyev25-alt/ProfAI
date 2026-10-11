import assert from 'node:assert/strict'
import http from 'node:http'
import { WebSocket } from 'ws'
import { attachSpeakingSignaling } from '../dist/realtime/speakingSignaling.js'

const server = http.createServer()
const signaling = attachSpeakingSignaling(server, async token => ['owner-token', 'reader-token'].includes(token)
  ? { userId: token === 'owner-token' ? 'owner' : 'reader', name: token, avatarUrl: null, public: true } : null)
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const sockets = []
const roomId = 'hard-questions'
const send = (socket, payload) => socket.send(JSON.stringify({ roomId, ...payload }))
function next(socket, type) {
  const take = () => { const index = socket.events.findIndex(event => event.type === type); return index < 0 ? null : socket.events.splice(index, 1)[0] }
  const existing = take()
  if (existing) return Promise.resolve(existing)
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { socket.off('message', receive); reject(new Error(`Missing ${type}`)) }, 3000)
    const receive = () => { const event = take(); if (event) { clearTimeout(timer); socket.off('message', receive); resolve(event) } }
    socket.on('message', receive)
  })
}
async function connect(userId, discussion = roomId) {
  const socket = new WebSocket(`ws://127.0.0.1:${server.address().port}/ws/speaking`)
  socket.events = []
  socket.on('message', raw => socket.events.push(JSON.parse(raw.toString())))
  sockets.push(socket)
  await new Promise(resolve => socket.once('open', resolve))
  send(socket, { type: 'hello', userId, name: userId })
  send(socket, { type: 'joinDiscussion', roomId: discussion })
  socket.snapshot = await next(socket, 'discussionSnapshot')
  return socket
}
try {
  const owner = await connect('owner'), reader = await connect('reader')
  const otherRoom = await connect('owner', 'study-abroad')
  send(owner, { type: 'discussionMessage', text: 'Original question' })
  const { message } = await next(owner, 'discussionMessage')
  await next(reader, 'discussionMessage')
  const edit = { type: 'discussionEdit', messageId: message.id, text: 'Changed question', token: 'owner-token' }
  // A claimed author ID cannot grant ownership without the author's verified session.
  send(reader, { type: 'hello', userId: 'owner', name: 'Spoofed owner' })
  send(reader, { ...edit, token: 'reader-token' })
  await next(reader, 'discussionActionError')
  send(reader, { type: 'discussionDelete', messageId: message.id, token: 'reader-token' })
  await next(reader, 'discussionActionError')
  send(owner, { ...edit, token: 'invalid' })
  await next(owner, 'discussionActionError')
  send(otherRoom, edit)
  await next(otherRoom, 'discussionActionError')
  send(owner, { ...edit, text: '  ' })
  await next(owner, 'discussionActionError')
  const unchanged = await connect('reader')
  assert.equal(unchanged.snapshot.messages[0].text, message.text)
  send(owner, edit)
  const updated = (await next(owner, 'discussionMessageUpdated')).message
  assert.equal(updated.id, message.id)
  assert.equal(updated.createdAt, message.createdAt)
  assert.equal(updated.text, edit.text)
  assert.ok(updated.editedAt)
  assert.equal((await next(reader, 'discussionMessageUpdated')).message.text, edit.text)
  const reconnected = await connect('owner')
  assert.equal(reconnected.snapshot.messages[0].text, edit.text, 'Edited history survives reconnect')
  send(owner, { ...edit, text: 'x'.repeat(600) })
  assert.equal((await next(owner, 'discussionMessageUpdated')).message.text.length, 500)
  send(owner, { type: 'discussionDelete', messageId: message.id, token: 'owner-token' })
  assert.equal((await next(owner, 'discussionMessageDeleted')).messageId, message.id)
  assert.equal((await next(reader, 'discussionMessageDeleted')).messageId, message.id)
  const afterDelete = await connect('owner')
  assert.deepEqual(afterDelete.snapshot.messages, [], 'Deleted messages stay absent after reconnect')
  send(owner, edit)
  await next(owner, 'discussionActionError')
  assert.equal(otherRoom.events.some(event => event.type === 'discussionMessageUpdated' || event.type === 'discussionMessageDeleted'), false)
  console.log('Discussion actions passed: verified ownership, spoof rejection, room isolation, edit/delete broadcasts, length limits and reconnect history.')
} finally {
  sockets.forEach(socket => socket.close())
  signaling.close()
  await new Promise(resolve => server.close(resolve))
}
