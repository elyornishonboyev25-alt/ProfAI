import { getSpeakingWebSocketUrl } from '@/lib/speakingWebSocketUrl'

export type CommunityRoomStats = {
  debate: { online: number; activeRooms: number; capacity: number; openSeats: number }
  questions: { online: number }
  admissions: { online: number }
  partner: { online: number }
}

export const EMPTY_COMMUNITY_ROOM_STATS: CommunityRoomStats = {
  debate: { online: 0, activeRooms: 0, capacity: 5, openSeats: 0 },
  questions: { online: 0 },
  admissions: { online: 0 },
  partner: { online: 0 },
}

type RoomStatsMessage = {
  type?: string
  rooms?: Partial<CommunityRoomStats>
}

export function subscribeToCommunityRoomStats(
  onStats: (stats: CommunityRoomStats) => void,
  onConnectionChange?: (connected: boolean) => void,
) {
  let socket: WebSocket | null = null
  let reconnectTimer = 0
  let attempts = 0
  let closed = false

  const connect = () => {
    if (closed) return
    try {
      socket = new WebSocket(getSpeakingWebSocketUrl())
    } catch {
      scheduleReconnect()
      return
    }

    socket.onopen = () => {
      attempts = 0
      onConnectionChange?.(true)
      socket?.send(JSON.stringify({ type: 'subscribeRoomStats' }))
    }
    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as RoomStatsMessage
        if (message.type !== 'roomStats' || !message.rooms) return
        onStats({
          debate: { ...EMPTY_COMMUNITY_ROOM_STATS.debate, ...message.rooms.debate },
          questions: { ...EMPTY_COMMUNITY_ROOM_STATS.questions, ...message.rooms.questions },
          admissions: { ...EMPTY_COMMUNITY_ROOM_STATS.admissions, ...message.rooms.admissions },
          partner: { ...EMPTY_COMMUNITY_ROOM_STATS.partner, ...message.rooms.partner },
        })
      } catch {
        // Ignore malformed realtime payloads and keep listening.
      }
    }
    socket.onerror = () => {}
    socket.onclose = () => {
      socket = null
      onConnectionChange?.(false)
      scheduleReconnect()
    }
  }

  const scheduleReconnect = () => {
    if (closed || reconnectTimer) return
    const delay = Math.min(1_000 * 2 ** attempts, 12_000)
    attempts += 1
    reconnectTimer = window.setTimeout(() => {
      reconnectTimer = 0
      connect()
    }, delay)
  }

  connect()

  return () => {
    closed = true
    window.clearTimeout(reconnectTimer)
    socket?.close()
    socket = null
  }
}
