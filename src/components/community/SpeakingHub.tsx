import { useCopy } from '@/i18n/interface'
import UiText from '@/components/common/UiText'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, AudioLines, Check, ChevronDown, Copy, Crown, Hand, Headphones, Loader2, LockKeyhole, MessageCircle, Mic, MicOff, PhoneOff, Plus, Radio, Search, Send, Settings2, Users, X, Shuffle, Swords, Timer, Play, Pause, SkipForward } from 'lucide-react'
import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import { cn } from '@/components/ui/utils'
import type { RoomDraft, SpeakingCommunity, SpeakingMember, SpeakingRoom } from '@/hooks/useSpeakingCommunity'
import { useCommunityCopy } from '@/i18n/community'
import { AudioSetup } from './SpeakingTools'
import { useCallFeedback } from '@/hooks/useCallFeedback'
import { Phone, Volume2, VolumeX, RefreshCw } from 'lucide-react'
import '@/styles/speaking-calls.css'
import IncomingCall from './IncomingCall'
import { ShieldBan } from 'lucide-react'

const KINDS = { conversation: 'Conversation', debate: 'Debate', ielts: 'IELTS practice' }
function roomTone(room: SpeakingRoom) {
  return room.kind === 'debate' ? 'lilac' : room.kind === 'ielts' ? 'blue' : room.id.charCodeAt(0) % 2 ? 'peach' : 'mint'
}

export default function SpeakingHub({ hub, invitedRoom, view = 'rooms' }: { hub: SpeakingCommunity; invitedRoom: string | null; view?: 'rooms' | 'partner' | 'hidden' }) {
  const { c: uiCopy } = useCopy()
  const t = useCommunityCopy()
  const [creating, setCreating] = useState(false)
  const [query, setQuery] = useState('')
  const [text, setText] = useState('')
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [topicDraft, setTopicDraft] = useState('')
  const chatRef = useRef<HTMLDivElement>(null)
  const visible = useMemo(() => hub.rooms.filter(room => `${room.title} ${room.topic}`.toLowerCase().includes(query.trim().toLowerCase())), [hub.rooms, query])
  const room = hub.room
  const speakers = room?.members.filter(member => member.role === 'speaker') ?? []
  const listeners = room?.members.filter(member => member.role === 'listener') ?? []
  const isHost = room?.hostId === hub.selfId
  const blocked = !room && !hub.busy && !hub.invitation && hub.activity !== 'idle'
  const canStart = hub.connected && !hub.busy && !blocked && !hub.invitation
  const { sound, toggleSound } = useCallFeedback(!!hub.invitation, !!hub.outgoingInvitation)

  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' }) }, [hub.messages])
  useEffect(() => { if (hub.room) setCreating(false); setCopied(false); setShareUrl('') }, [hub.room?.id])

  const share = async () => {
    if (!room) return
    const url = new URL('/community', window.location.origin)
    url.searchParams.set('mode', 'voice')
    url.searchParams.set('room', room.id)
    setShareUrl(url.toString())
    try { await navigator.clipboard.writeText(url.toString()); setCopied(true) } catch { setCopied(false) }
  }
  return <section className="speaking-hub" aria-label={uiCopy("Speaking Zone")}>
    {invitedRoom && !room ? <div className="hub-invitation"><LockKeyhole size={22} /><div><b>{t('Invitation link')}</b><p>{t('Someone invited you to a speaking room.')}</p></div><button type="button" className="hub-button is-primary" disabled={!canStart} onClick={() => void hub.join(invitedRoom)}>{t('Join invited room')}<ArrowRight size={17} /></button></div> : null}
    {hub.error ? <div className="hub-feedback is-error" role="alert"><span>{t(hub.error)}</span><button type="button" onClick={hub.clearError} aria-label={t('Close')}><X size={17} /></button></div> : null}
    {hub.notice && !hub.outgoingInvitation ? <div className="hub-feedback" role="status">{t(hub.notice)}</div> : null}
    {blocked ? <div className="hub-activity-recovery" role="status"><Headphones size={23} /><div><b>{t('You already have an active session')}</b><p>{t('A room, search or invitation is still active in this account. End it to start a new conversation. This also closes it in other tabs.')}</p></div><button type="button" className="hub-button" onClick={hub.resetActivity}><PhoneOff size={16} />{t('End session & start again')}</button></div> : null}
    {view === 'partner' && hub.connected && !hub.publicProfile ? <div className="hub-activity-recovery"><LockKeyhole size={23} /><div><b>{t('Enable your public profile to find a speaking partner.')}</b><p>{t('Your nickname and study goals help other learners find you.')}</p></div><a className="hub-button" href="/profile">{t('Edit profile')}<ArrowRight size={16} /></a></div> : null}
    {hub.blockedPeople.length ? <details className="hub-blocked-callers"><summary><ShieldBan size={16} />{t('Blocked callers')}<span>{hub.blockedPeople.length}</span></summary><p>{t('Blocked people cannot call or match with you.')}</p><ul>{hub.blockedPeople.map(person => <li key={person.id}><span className="hub-blocked-avatar"><ProfileAvatar src={person.avatarUrl} name={person.name} alt="" /></span><b>@{person.name}</b><button type="button" className="hub-button" disabled={!hub.connected || hub.blockBusy} onClick={() => hub.unblockCaller(person.id)}>{t('Unblock')}</button></li>)}</ul></details> : null}
    <IncomingCall key={hub.invitation?.id ?? 'no-call'} hub={hub} />
    {room ? <>
      <header className="hub-room-header">
        <div><span className="hub-eyebrow"><Radio size={14} />{t(room.private ? 'Private room' : 'Live')} <UiText text={"· English"} /></span><h2>{room.title}</h2></div>
        <div className="hub-room-header-actions"><span><Users size={16} />{room.members.length} {t('participants')}</span><button type="button" className="hub-button" onClick={() => void share()}>{copied ? <Check size={17} /> : <Copy size={17} />}{t(copied ? 'Link copied' : 'Invite friends')}</button></div>
      </header>
      {shareUrl ? <label className="hub-share-link">{t('Invitation link')}<input readOnly value={shareUrl} onFocus={event => event.target.select()} /></label> : null}
      <div className="hub-session-status" role="status"><span className={cn('hub-mic-state', hub.self?.role === 'speaker' && !hub.self.muted && 'is-on')}>{hub.self?.role === 'speaker' && !hub.self.muted ? <Mic size={16} /> : <MicOff size={16} />}{t(hub.self?.role === 'listener' ? 'You are listening' : hub.self?.muted ? 'Your microphone is off' : 'Your microphone is on')}</span><span>{t(hub.self?.role === 'listener' ? 'Take a seat when you are ready to speak.' : 'Take turns. Give everyone time to speak.')}</span></div>
      <div className={cn('hub-session-layout', `hub-session-${room.kind}`)}>
        <div className={cn('hub-stage', `tone-${roomTone(room)}`)}>
          <div className="hub-stage-top"><span><AudioLines size={16} />{t(KINDS[room.kind as keyof typeof KINDS])}</span><span>{speakers.length}/{room.capacity} {t('on stage')}</span></div>
          <div className="hub-topic"><span className="hub-eyebrow"><MessageCircle size={13} />{t('Conversation topic')}</span><h2>{room.topic}</h2><p>{t(room.kind === 'debate' ? 'Listen, take turns and challenge ideas respectfully. Raise your hand when you want to speak.' : 'Good conversations start with listening.')}</p>{isHost ? <details className="hub-topic-editor"><summary><Settings2 size={14} />{t('Change topic')}</summary><form onSubmit={event => { event.preventDefault(); if (topicDraft.trim()) { hub.setTopic(topicDraft.trim()); setTopicDraft('') } }}><input value={topicDraft} maxLength={200} placeholder={room.topic} aria-label={t('What will you talk about?')} onChange={event => setTopicDraft(event.target.value)} /><button type="submit" className="hub-button" disabled={!topicDraft.trim()}>{t('Save topic')}</button></form></details> : null}</div>
          <div className="hub-stage-label"><Mic size={15} /><b>{t('Speakers')}</b><span>{t('Turn on your mic when you are ready.')}</span></div>
          {room.kind === 'debate' ? <DebateStage hub={hub} /> : <div className={cn('hub-speakers', room.private && room.capacity === 2 && 'is-pair')}>
            {speakers.map(member => <StageMember key={member.id} member={member} hub={hub} />)}
            {Array.from({ length: Math.min(1, Math.max(0, room.capacity - speakers.length)) }, (_, index) => <button type="button" className="hub-speaker is-empty" key={`seat-${index}`} disabled={hub.busy || hub.self?.role === 'speaker'} onClick={() => void hub.takeSeat()} aria-label={t('Take a seat')}><span className="hub-empty-seat"><Plus size={24} /></span><b>{t('Take a seat')}</b></button>)}
          </div>}
          <div className="hub-audience-heading"><Headphones size={16} /><b>{t('Listening')}</b><span>{listeners.length}</span>{hub.self?.role === 'listener' ? <small>{t('You are listening. Tap a seat to speak.')}</small> : null}</div>
          <div className="hub-listeners">
            {listeners.map(member => <div key={member.id} className="hub-listener"><span><ProfileAvatar src={member.avatarUrl} name={member.name} alt="" />{member.hand ? <i><Hand size={12} /></i> : null}</span><b>@{member.name}</b>{hub.selfId === room.hostId ? <button type="button" title={t('Remove from room')} aria-label={`${t('Remove from room')}: ${member.name}`} onClick={() => hub.remove(member.id)}><X size={12} /></button> : null}</div>)}
            {!listeners.length ? <p>{t('Invite a friend to listen in.')}</p> : null}
          </div>
          <div className="hub-call-controls">
            <button type="button" className={cn('hub-button', !hub.self?.muted && 'is-primary')} disabled={hub.busy} onClick={() => hub.self?.role === 'listener' ? void hub.takeSeat() : hub.changeState({ muted: !hub.self?.muted })}>{hub.busy ? <Loader2 size={18} className="animate-spin" /> : hub.self?.role === 'listener' ? <Mic size={18} /> : hub.self?.muted ? <MicOff size={18} /> : <Mic size={18} />}{t(hub.self?.role === 'listener' ? 'Take a seat' : hub.self?.muted ? 'Unmute' : 'Mute')}</button>
            {hub.self?.role === 'listener' ? <button type="button" className={cn('hub-button', hub.self.hand && 'is-selected')} aria-pressed={hub.self.hand} onClick={() => hub.changeState({ hand: !hub.self?.hand })}><Hand size={18} />{t(hub.self.hand ? 'Lower hand' : 'Raise hand')}</button> : <button type="button" className="hub-button" onClick={hub.stepDown}><Headphones size={18} />{t('Listen instead')}</button>}
            <button type="button" className="hub-button is-leave" onClick={hub.leave}><PhoneOff size={18} />{t('Leave room')}</button>
          </div>
          {room.private && room.capacity === 2 ? <button type="button" className="hub-next-partner hub-button" disabled={hub.busy || !hub.publicProfile} onClick={hub.nextPartner}><Shuffle size={16} />{t('Find next partner')}</button> : null}
        </div>
        <aside className="hub-chat">
          <h3><MessageCircle size={18} />{t('Room chat')}</h3>
          <div className="hub-chat-messages" ref={chatRef} role="log" aria-live="polite">{hub.messages.length ? hub.messages.map(message => <div key={message.id} className="hub-chat-message"><div><b>@{message.name}</b><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div><p>{message.text}</p></div>) : <div className="hub-chat-empty"><MessageCircle size={28} /><p>{t('Say hello or share a question.')}</p></div>}</div>
          <form onSubmit={event => { event.preventDefault(); if (text.trim() && hub.connected) { hub.chat(text.trim()); setText('') } }}><input value={text} onChange={event => setText(event.target.value)} maxLength={500} placeholder={t('Write a message')} aria-label={t('Write a message')} /><button type="submit" disabled={!text.trim() || !hub.connected} aria-label={t('Send')}><Send size={18} /></button></form>
        </aside>
      </div>
      {Object.entries(hub.streams).map(([id, stream]) => <RemoteAudio key={id} stream={stream} />)}
    </> : view === 'hidden' ? null : <>
      {view === 'partner' ? <>
        <section className="zone-partner-start" aria-labelledby="zone-partner-title">
          <span className="zone-partner-symbol" aria-hidden="true"><Headphones size={30} strokeWidth={1.5} /></span>
          <h2 id="zone-partner-title">{t('Speak with a partner')}</h2>
          <p>{t('Meet someone new and practise English together.')}</p>
          <button type="button" className="hub-button is-primary" disabled={!canStart || !hub.publicProfile} onClick={() => void hub.match()}><Shuffle size={18} />{t('Find a random partner')}</button>
          <small><span className="hub-live-dot" />{hub.available.filter(name => name !== hub.selfName).length} {t('Ready to talk')}</small>
        </section>
        <PartnerDiscovery hub={hub} />
      </> : <section className="hub-lobby" aria-label={t('Live rooms')}>
        <div className="zone-list-heading"><h2>{t('Voice rooms')} <span>{hub.rooms.length}</span></h2><button type="button" className="hub-button is-primary" disabled={!canStart} onClick={() => { hub.clearError(); setCreating(true) }}><Plus size={17} />{t('Create a room')}</button></div>
        {hub.rooms.length || query ? <label className="hub-room-search"><Search size={17} /><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t('Search rooms or topics')} aria-label={t('Search rooms or topics')} /></label> : null}
        <div className="hub-room-grid">{visible.map(room => <SocialRoomCard key={room.id} room={room} hub={hub} />)}</div>
        {!visible.length ? <div className="hub-lobby-empty"><Mic size={28} strokeWidth={1.5} /><h3>{t(query.trim() ? 'No rooms match yet' : 'No rooms yet')}</h3><p>{t(query.trim() ? 'Try another topic or open your own room.' : 'Create a room and invite others to join.')}</p>{query.trim() ? <button type="button" className="hub-button" onClick={() => setQuery('')}>{t('Clear search')}</button> : null}</div> : null}
      </section>}
    </>}
    <details className="hub-settings"><summary><Settings2 size={15} />{t('Call settings')}<ChevronDown size={14} /></summary>
    <div className="hub-audio-preferences"><button type="button" className="hub-button" aria-pressed={sound} onClick={toggleSound}>{sound ? <Volume2 size={16} /> : <VolumeX size={16} />}{t(sound ? 'Call sounds on' : 'Call sounds off')}</button>{!hub.connected ? <button type="button" className="hub-button" onClick={hub.reconnect}><RefreshCw size={16} />{t('Reconnect')}</button> : null}</div>
      <AudioSetup disabled={!!room || hub.busy} />
    </details>
    {hub.busy && !room ? <PendingConnection hub={hub} /> : null}
    {creating ? <QuickCreate onClose={() => { if (hub.busy) hub.leave(); setCreating(false) }} onCreate={hub.create} busy={hub.busy} error={hub.error} /> : null}
  </section>
}

function PartnerDiscovery({ hub }: { hub: SpeakingCommunity }) {
  const t = useCommunityCopy()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const available = hub.available.filter(name => name !== hub.selfName)
  const partners = available.filter(name => name.toLowerCase().includes(query.trim().toLowerCase()))
  return <section className="hub-partner-discovery" aria-label={t('Partner')}>
    <div className="zone-list-heading"><h2>{t('Ready to talk')} <span>{available.length}</span></h2>{available.length || query ? <label className="hub-room-search"><Search size={16} /><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={t('Search by nickname')} aria-label={t('Search by nickname')} /></label> : null}</div>
    <div className="hub-partner-grid">{partners.map(name => <article key={name} className="hub-partner-card">
      <button type="button" className="zone-partner-profile" onClick={() => navigate('/u/' + encodeURIComponent(name), { state: { from: '/community?mode=partner' } })} aria-label={t('View profile') + ': @' + name}><span className="hub-partner-avatar"><ProfileAvatar src={hub.availablePeople.find(person => person.name === name)?.avatarUrl} name={name} alt="" /><i /></span><span className="hub-partner-identity"><b>@{name}</b><small>{t('Ready to talk')}</small></span></button>
      <button type="button" className="hub-button zone-call-partner" aria-label={t('Call now') + ': @' + name} disabled={!hub.connected || !hub.publicProfile || hub.activity !== 'idle' || hub.busy || !!hub.invitation} onClick={() => void hub.invite(name)}><Phone size={16} /><span>{t('Call now')}</span></button>
    </article>)}</div>
    {!partners.length ? <div className="zone-partner-empty"><p>{t(query.trim() ? 'No partner found' : 'No partners available yet. Try random matching.')}</p>{query.trim() ? <button type="button" className="hub-button" onClick={() => setQuery('')}>{t('Clear search')}</button> : null}</div> : null}
  </section>
}

function PendingConnection({ hub }: { hub: SpeakingCommunity }) {
  const t = useCommunityCopy()
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!hub.outgoingInvitation) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [hub.outgoingInvitation])
  const outgoing = hub.outgoingInvitation
  return <div className={cn('hub-pending', outgoing && 'is-inviting')} role="status"><span className="hub-pending-icon">{outgoing ? <Phone size={22} /> : <Loader2 className="animate-spin" size={22} />}</span><div><b>{outgoing ? `${t('Waiting for')} @${outgoing.nickname}` : t(hub.matching ? 'Looking for your next conversation…' : 'Connecting…')}</b><p>{t(outgoing ? 'Your invitation is on its way. The call opens when they accept.' : hub.matching ? 'Stay here. We will connect you when another learner is ready.' : 'Preparing your voice room.')}</p>{outgoing ? <small>{Math.max(0, Math.ceil((outgoing.expiresAt - now) / 1000))}s · {t('Invitation expires automatically')}</small> : null}</div><button type="button" className="hub-button" onClick={hub.leave}>{t('Cancel')}</button></div>
}

function DebateStage({ hub }: { hub: SpeakingCommunity }) {
  const t = useCommunityCopy()
  const room = hub.room!
  const [now, setNow] = useState(Date.now())
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 500); return () => window.clearInterval(timer) }, [])
  const speakers = room.members.filter(member => member.role === 'speaker')
  const current = speakers.find(member => member.id === room.debate.turnId)
  const seconds = room.debate.endsAt === null ? 90 : Math.max(0, Math.ceil((room.debate.endsAt - now) / 1000))
  const ready = speakers.some(member => member.side === 'for') && speakers.some(member => member.side === 'against')
  return <div className="hub-debate">
    <div className="hub-debate-clock"><span><Timer size={19} /><b>{Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, '0')}</b></span><div><b>{room.debate.running && current ? `${t('Current turn')}: @${current.name}` : t('Ready for a friendly debate?')}</b><small>{t('90 seconds per turn. Listen, take turns and respect each other.')}</small></div>{hub.selfId === room.hostId ? <div className="hub-debate-actions"><button type="button" className="hub-button" disabled={!ready} onClick={() => hub.debateAction(room.debate.running ? 'pause' : 'start')}>{room.debate.running ? <Pause size={16} /> : <Play size={16} />}{t(room.debate.running ? 'Pause' : 'Start debate')}</button>{room.debate.running ? <button type="button" className="hub-button" onClick={() => hub.debateAction('next')}><SkipForward size={16} />{t('Next turn')}</button> : null}</div> : null}</div>
    <div className="hub-debate-progress" aria-hidden="true"><span style={{ width: `${seconds / 90 * 100}%` }} /></div>{!ready ? <p className="hub-debate-waiting">{t("Add a speaker to each team to start the debate.")}</p> : null}<div className="hub-debate-teams">{(['for', 'against'] as const).map(side => {
      const team = speakers.filter(member => member.side === side)
      return <section key={side} className={cn('hub-debate-team', `team-${side}`, current?.side === side && room.debate.running && 'is-current')}><header><span><Swords size={16} />{t(side === 'for' ? 'For' : 'Against')}<small>{team.length}/{Math.ceil(room.capacity / 2)}</small></span><button type="button" disabled={hub.self?.role !== 'speaker' || hub.self?.side === side || team.length >= Math.ceil(room.capacity / 2)} onClick={() => hub.changeState({ side })}>{t(hub.self?.side === side ? 'Your team' : 'Join team')}</button></header><div className="hub-speakers">{team.map(member => <StageMember key={member.id} member={member} hub={hub} />)}{Array.from({ length: Math.min(1, Math.max(0, Math.ceil(room.capacity / 2) - team.length)) }, (_, index) => <button type="button" key={index} className="hub-speaker is-empty" disabled={hub.busy || hub.self?.role === 'speaker' || speakers.length >= room.capacity} onClick={() => void hub.takeSeat()}><span className="hub-empty-seat"><Plus size={21} /></span><b>{t('Take a seat')}</b><small>{t('Teams are assigned automatically')}</small></button>)}</div></section>
    })}</div><p className="hub-debate-note">{t('Speakers are automatically placed in two balanced teams. The host manages turns.')}</p>
  </div>
}

function SocialRoomCard({ room, hub }: { room: SpeakingRoom; hub: SpeakingCommunity }) {
  const t = useCommunityCopy()
  const host = room.members.find(member => member.id === room.hostId)
  const full = room.members.length >= room.maxParticipants
  return <article className="hub-room-card">
    <div className="zone-room-top"><span className="zone-room-icon"><Mic size={20} strokeWidth={1.5} /></span><span><span className="hub-live-dot" />{room.members.length} {t('in room')}</span></div>
    <h3>{room.title}</h3><p>{room.topic}</p>
    <div className="zone-room-bottom"><span className="zone-room-host"><span><ProfileAvatar src={host?.avatarUrl} name={host?.name} alt="" /></span><b>@{host?.name}</b></span><button type="button" className="hub-button" disabled={full || !hub.connected || hub.busy || hub.activity !== 'idle' || !!hub.invitation} onClick={() => void hub.join(room.id)}>{t(full ? 'Room full' : 'Enter room')}<ArrowRight size={15} /></button></div>
  </article>
}
function StageMember({ member, hub }: { member: SpeakingMember; hub: SpeakingCommunity }) {
  const t = useCommunityCopy()
  return <article className={cn('hub-speaker', !member.muted && 'is-speaking', member.hand && 'has-hand', hub.room?.debate.running && hub.room.debate.turnId === member.id && 'is-turn')}>
    <div className="hub-speaker-avatar"><ProfileAvatar src={member.avatarUrl} name={member.name} alt="" /><i>{member.muted ? <MicOff size={12} /> : <Mic size={12} />}</i></div>
    <b>@{member.name}</b><span className={cn(member.id === hub.room?.hostId && 'is-host')}>{member.id === hub.room?.hostId ? <Crown size={10} /> : null}{t(member.id === hub.room?.hostId ? 'Host' : member.id === hub.selfId ? 'You' : 'Speaker')}</span>
    {member.id !== hub.selfId && ['failed', 'disconnected'].includes(hub.peerStates[member.id]) ? <small>{t('Audio interrupted')}</small> : null}
    {member.id !== hub.selfId && !['connected', 'failed', 'disconnected'].includes(hub.peerStates[member.id]) ? <small>{t('Connecting audio')}</small> : null}
    {hub.selfId === hub.room?.hostId && member.id !== hub.selfId ? <button type="button" className="hub-remove" aria-label={`${t('Remove from room')}: ${member.name}`} title={t('Remove from room')} onClick={() => hub.remove(member.id)}><X size={14} /></button> : null}
  </article>
}

function QuickCreate({ onClose, onCreate, busy, error }: { onClose: () => void; onCreate: (draft: RoomDraft) => Promise<void>; busy: boolean; error: string }) {
  const t = useCommunityCopy()
  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('')
  const [privateRoom, setPrivateRoom] = useState(false)
  const [capacity, setCapacity] = useState(4)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { dialog.current?.showModal() }, [])
  return <dialog className="hub-create-dialog zone-create-dialog" ref={dialog} onCancel={onClose} aria-labelledby="create-speaking-title"><form onSubmit={event => { event.preventDefault(); if (!busy) void onCreate({ title: title.trim() || t('Say hello'), topic: topic.trim() || t('Daily conversation'), kind: 'conversation', capacity, level: 'all', private: privateRoom }) }}>
    <div className="zone-dialog-heading"><h2 id="create-speaking-title">{t('Create a room')}</h2><button type="button" onClick={onClose} aria-label={t('Close')}><X size={20} /></button></div>
    <label>{t('Room name')}<input autoFocus maxLength={70} value={title} placeholder={t('Say hello')} onChange={event => setTitle(event.target.value)} /></label>
    <label>{t('What will you talk about?')}<input maxLength={200} value={topic} placeholder={t('Daily conversation')} onChange={event => setTopic(event.target.value)} /></label>
    <details className="hub-optional-settings"><summary><Settings2 size={15} />{t('Room settings')}<ChevronDown size={14} /></summary><label>{t('Seats')}<select value={capacity} onChange={event => setCapacity(Number(event.target.value))}>{[2, 4, 6, 8].map(value => <option key={value}>{value}</option>)}</select></label><label className="hub-private-toggle"><input type="checkbox" checked={privateRoom} onChange={event => setPrivateRoom(event.target.checked)} />{t('Private · invite link only')}</label></details>
    {error ? <div className="hub-feedback is-error" role="alert">{t(error)}</div> : null}
    <button type="submit" className="hub-button is-primary hub-go-live" disabled={busy}>{busy ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}{t('Create a room')}</button><small className="hub-create-note">{t('Your mic starts off')}</small>
  </form></dialog>
}


function RemoteAudio({ stream }: { stream: MediaStream }) {
  const t = useCommunityCopy()
  const audio = useRef<HTMLAudioElement>(null)
  const [blocked, setBlocked] = useState(false)
  useEffect(() => { const element = audio.current; if (!element) return; element.srcObject = stream; void element.play().catch(() => setBlocked(true)); return () => { element.srcObject = null } }, [stream])
  return <><audio ref={audio} autoPlay playsInline />{blocked ? <button type="button" className="hub-button" onClick={() => void audio.current?.play().then(() => setBlocked(false)).catch(() => {})}><Headphones size={18} />{t('Tap to play audio')}</button> : null}</>
}
