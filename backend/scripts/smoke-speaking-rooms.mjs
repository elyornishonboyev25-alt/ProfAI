import assert from 'node:assert/strict'
import http from 'node:http'
import { WebSocket } from 'ws'
import { attachSpeakingSignaling } from '../dist/realtime/speakingSignaling.js'

const server = http.createServer()
const signaling = attachSpeakingSignaling(server)
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))

const address = server.address()
if (!address || typeof address === 'string') throw new Error('Could not start realtime smoke server.')
const url = `ws://127.0.0.1:${address.port}/ws/speaking`
const sockets = []

function waitFor(socket, predicate, timeoutMs = 4_000) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off('message', receive)
      reject(new Error('Timed out waiting for realtime event.'))
    }, timeoutMs)
    const receive = (raw) => {
      const message = JSON.parse(raw.toString())
      if (!predicate(message)) return
      clearTimeout(timeout)
      socket.off('message', receive)
      resolve(message)
    }
    socket.on('message', receive)
  })
}

async function connect(name) {
  const socket = new WebSocket(url)
  sockets.push(socket)
  await new Promise((resolve, reject) => {
    socket.once('open', resolve)
    socket.once('error', reject)
  })
  socket.send(JSON.stringify({ type: 'hello', userId: name.toLowerCase(), name }))
  return socket
}

async function joinDebate(index) {
  const socket = await connect(`Speaker ${index}`)
  const roomEvent = waitFor(socket, (message) => message.type === 'debateRoom')
  socket.send(JSON.stringify({ type: 'joinDebate' }))
  return { socket, room: await roomEvent }
}

try {
  const statsSocket = await connect('Lobby observer')
  const initialStats = waitFor(statsSocket, (message) => message.type === 'roomStats')
  statsSocket.send(JSON.stringify({ type: 'subscribeRoomStats' }))
  await initialStats

  const speakers = []
  for (let index = 1; index <= 10; index += 1) speakers.push(await joinDebate(index))
  const elevenOnlinePromise = waitFor(
    statsSocket,
    (message) => message.type === 'roomStats' && message.rooms.debate.online === 11,
  )
  speakers.push(await joinDebate(11))

  const [firstRoom, secondRoom, thirdRoom] = [speakers[0].room.roomId, speakers[5].room.roomId, speakers[10].room.roomId]
  assert.equal(new Set(speakers.slice(0, 5).map(({ room }) => room.roomId)).size, 1)
  assert.equal(new Set(speakers.slice(5, 10).map(({ room }) => room.roomId)).size, 1)
  assert.notEqual(firstRoom, secondRoom)
  assert.notEqual(secondRoom, thirdRoom)
  assert.equal(speakers[0].room.capacity, 5)
  assert.equal(typeof speakers[0].room.topic.motion, 'string')
  assert.equal(speakers[0].room.topic.followUps.length, 2)

  const elevenOnline = await elevenOnlinePromise
  assert.equal(elevenOnline.rooms.debate.activeRooms, 3)
  assert.equal(elevenOnline.rooms.debate.openSeats, 4)

  const tenOnlinePromise = waitFor(statsSocket, (message) => message.type === 'roomStats' && message.rooms.debate.online === 10)
  speakers[0].socket.close()
  await tenOnlinePromise
  const replacement = await joinDebate(12)
  assert.equal(replacement.room.roomId, firstRoom, 'A newly open seat must be back-filled before creating another room.')

  const questions = await connect('Question learner')
  const questionsSnapshot = waitFor(questions, (message) => message.type === 'discussionSnapshot')
  questions.send(JSON.stringify({ type: 'joinDiscussion', roomId: 'hard-questions' }))
  await questionsSnapshot
  const discussionMessage = waitFor(questions, (message) => message.type === 'discussionMessage')
  questions.send(JSON.stringify({ type: 'discussionMessage', roomId: 'hard-questions', text: 'How can I improve coherence?' }))
  assert.equal((await discussionMessage).message.userId, 'question learner')

  const admissions = await connect('Admissions learner')
  const admissionsSnapshot = waitFor(admissions, (message) => message.type === 'discussionSnapshot')
  admissions.send(JSON.stringify({ type: 'joinDiscussion', roomId: 'study-abroad' }))
  await admissionsSnapshot

  const partner = await connect('Partner learner')
  const partnerQueued = waitFor(partner, (message) => message.type === 'queued')
  const allRoomsLivePromise = waitFor(
    statsSocket,
    (message) => message.type === 'roomStats'
      && message.rooms.questions.online === 1
      && message.rooms.admissions.online === 1
      && message.rooms.partner.online === 1,
  )
  partner.send(JSON.stringify({ type: 'queue', part: 2, level: 'advanced' }))
  await partnerQueued

  const allRoomsLive = await allRoomsLivePromise
  assert.equal(allRoomsLive.rooms.debate.online, 11)

  console.log('Realtime rooms valid: 5-seat grouping, overflow rooms, back-fill, discussions, partner queue, and live stats.')
} finally {
  sockets.forEach((socket) => socket.close())
  signaling.close()
  await new Promise((resolve) => server.close(resolve))
}
