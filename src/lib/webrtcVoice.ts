// Minimal, audio-only WebRTC wrapper for the live partner sessions. Camera is never
// requested — this is a microphone-only experience by design. Signaling (SDP + ICE)
// is delegated to whatever transport the caller passes in (BroadcastChannel or WS).

function iceServers(): RTCIceServer[] {
  const env = import.meta.env as Record<string, string | undefined>
  const servers: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
  const turnUrls = env.VITE_WEBRTC_TURN_URL?.split(',').map((value) => value.trim()).filter(Boolean)
  if (turnUrls?.length) {
    servers.push({
      urls: turnUrls,
      username: env.VITE_WEBRTC_TURN_USERNAME ?? '',
      credential: env.VITE_WEBRTC_TURN_CREDENTIAL ?? '',
    })
  }
  return servers
}

type SignalPayload = { sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit }

export type VoiceConnection = {
  start: (localStream: MediaStream) => Promise<void>
  handleSignal: (data: unknown) => Promise<void>
  replaceAudioTrack: (track: MediaStreamTrack | null) => Promise<void>
  close: () => void
}

export function createVoiceConnection(opts: {
  isCaller: boolean
  sendSignal: (data: SignalPayload) => void
  onRemoteStream: (stream: MediaStream) => void
  onStateChange?: (state: RTCPeerConnectionState) => void
}): VoiceConnection {
  const pc = new RTCPeerConnection({ iceServers: iceServers() })
  let remoteDescriptionSet = false
  const pendingCandidates: RTCIceCandidateInit[] = []
  let audioSender: RTCRtpSender | null = null
  let localTrack: MediaStreamTrack | null = null

  pc.onicecandidate = (event) => {
    if (event.candidate) opts.sendSignal({ candidate: event.candidate.toJSON() })
  }
  pc.ontrack = (event) => {
    opts.onRemoteStream(event.streams[0] ?? new MediaStream([event.track]))
  }
  pc.onconnectionstatechange = () => opts.onStateChange?.(pc.connectionState)

  const flushCandidates = async () => {
    while (pendingCandidates.length > 0) {
      const candidate = pendingCandidates.shift()
      if (candidate) {
        try {
          await pc.addIceCandidate(candidate)
        } catch {
          // ignore late/invalid candidate
        }
      }
    }
  }

  const start = async (localStream: MediaStream) => {
    const track = localStream.getAudioTracks()[0]
    localTrack = track ?? null
    // Listeners negotiate an audio sender without accessing the microphone.
    // Replacing its track later lets them speak without reconnecting the room.
    if (track) audioSender = pc.addTrack(track, localStream)
    else if (opts.isCaller) audioSender = pc.addTransceiver('audio', { direction: 'sendrecv' }).sender
    if (opts.isCaller) {
      const offer = await pc.createOffer({ offerToReceiveAudio: true })
      await pc.setLocalDescription(offer)
      // Send a PLAIN { type, sdp } — an RTCSessionDescription's fields are prototype
      // getters that vanish through JSON.stringify / structured clone.
      opts.sendSignal({ sdp: { type: offer.type, sdp: offer.sdp } })
    }
  }

  const handleSignal = async (data: unknown) => {
    const payload = data as SignalPayload
    if (!payload) return

    if (payload.sdp) {
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp))
      remoteDescriptionSet = true
      await flushCandidates()
      if (payload.sdp.type === 'offer') {
        // An empty answerer must use the transceiver created by the offer.
        // Adding a separate one before the offer leaves its sender unnegotiated.
        const audio = pc.getTransceivers().find(transceiver => transceiver.mid !== null && transceiver.receiver.track.kind === 'audio')
        if (audio) {
          audio.direction = 'sendrecv'
          audioSender = audio.sender
          await audioSender.replaceTrack(localTrack)
        }
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        opts.sendSignal({ sdp: { type: answer.type, sdp: answer.sdp } })
      }
      return
    }

    if (payload.candidate) {
      if (!remoteDescriptionSet) {
        pendingCandidates.push(payload.candidate)
        return
      }
      try {
        await pc.addIceCandidate(payload.candidate)
      } catch {
        // ignore
      }
    }
  }

  const close = () => {
    try {
      // Media-stream ownership belongs to the session controller. A debate uses
      // the same microphone track in several peer connections, so stopping it
      // here would mute every remaining speaker when only one peer leaves.
      pc.onicecandidate = null
      pc.ontrack = null
      pc.onconnectionstatechange = null
      pc.close()
    } catch {
      // ignore
    }
  }

  return { start, handleSignal, close, replaceAudioTrack: async track => { localTrack = track; await audioSender?.replaceTrack(track) } }
}
