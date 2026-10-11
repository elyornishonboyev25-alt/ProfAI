import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, AudioLines, Check, ChevronDown, Copy, Crown, Hand, Headphones, Loader2, LockKeyhole, MessageCircle, Mic, MicOff, PhoneOff, Plus, Radio, Search, Send, Settings2, Users, X, Shuffle, Sparkles, Swords, Timer, Play, Pause, SkipForward } from 'lucide-react'
import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import { cn } from '@/components/ui/utils'
import type { RoomDraft, SpeakingCommunity, SpeakingMember, SpeakingRoom } from '@/hooks/useSpeakingCommunity'
import { useCommunityCopy } from '@/i18n/community'

const KINDS = { conversation: 'Conversation', debate: 'Debate', ielts: 'IELTS practice' }
const LEVELS = { all: 'All levels', beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }
const STARTERS = [
  { title: 'Say hello', topic: 'Meet new people, introduce yourself and share something about your day.', kind: 'conversation', emoji: '👋', tone: 'peach' },
  { title: 'Daily conversation', topic: 'Talk about hobbies, favourite places and everyday life.', kind: 'conversation', emoji: '☕', tone: 'mint' },
  { title: 'Debate club', topic: 'Does technology bring us closer together? Pick a side and share your opinion.', kind: 'debate', emoji: '💬', tone: 'lilac' },
  { title: 'IELTS speaking', topic: 'Describe a place you would love to visit. Ask each other follow-up questions.', kind: 'ielts', emoji: '🎯', tone: 'blue' },
] as const

function roomTone(room: SpeakingRoom) {
  return room.kind === 'debate' ? 'lilac' : room.kind === 'ielts' ? 'blue' : room.id.charCodeAt(0) % 2 ? 'peach' : 'mint'
}

export default function SpeakingHub({ hub, invitedRoom, view = 'rooms' }: { hub: SpeakingCommunity; invitedRoom: string | null; view?: 'rooms' | 'partner' | 'hidden' }) {
  const t = useCommunityCopy()
  const [creating, setCreating] = useState(false)
  const [kind, setKind] = useState('all')
  const [query, setQuery] = useState('')
  const [text, setText] = useState('')
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [topicDraft, setTopicDraft] = useState('')
  const chatRef = useRef<HTMLDivElement>(null)
  const visible = useMemo(() => hub.rooms.filter(room => (kind === 'all' || room.kind === kind) && `${room.title} ${room.topic}`.toLowerCase().includes(query.toLowerCase())), [hub.rooms, kind, query])
  const room = hub.room
  const speakers = room?.members.filter(member => member.role === 'speaker') ?? []
  const listeners = room?.members.filter(member => member.role === 'listener') ?? []
  const isHost = room?.hostId === hub.selfId

  useEffect(() => { chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' }) }, [hub.messages])
  useEffect(() => { if (hub.room) setCreating(false); setCopied(false); setShareUrl('') }, [hub.room?.id])

  const openStarter = (index: number) => {
    const starter = STARTERS[index]
    void hub.create({ title: t(starter.title), topic: t(starter.topic), kind: starter.kind, capacity: 8, level: 'all', private: false })
  }
  const share = async () => {
    if (!room) return
    const url = new URL('/community', window.location.origin)
    url.searchParams.set('room', room.id)
    setShareUrl(url.toString())
    try { await navigator.clipboard.writeText(url.toString()); setCopied(true) } catch { setCopied(false) }
  }
  return <section className="speaking-hub" aria-label={t('Speaking community')}>
    {invitedRoom && !room ? <div className="hub-invitation"><LockKeyhole size={22} /><div><b>{t('Invitation link')}</b><p>{t('Someone invited you to a speaking room.')}</p></div><button type="button" className="hub-button is-primary" disabled={!hub.connected || hub.busy} onClick={() => void hub.join(invitedRoom)}>{t('Join invited room')}<ArrowRight size={17} /></button></div> : null}
    {hub.error ? <div className="hub-feedback is-error" role="alert"><span>{t(hub.error)}</span><button type="button" onClick={hub.clearError} aria-label={t('Close')}><X size={17} /></button></div> : null}
    {hub.notice && !hub.outgoingInvitation ? <div className="hub-feedback" role="status">{t(hub.notice)}</div> : null}
    {hub.invitation ? <div className="hub-invitation" role="status">
      <span className="hub-invite-icon"><Headphones /></span>
      <div><b>{t('Speaking invitation')}</b><p>@{hub.invitation.from.name} {t('invites you to a private voice conversation.')}</p></div>
      <button type="button" className="hub-button is-primary" disabled={!hub.connected || hub.busy || !!room} onClick={() => void hub.reply(true)}>{t('Accept & join')}</button>
      <button type="button" className="hub-button" onClick={() => void hub.reply(false)}>{t('Decline')}</button>
    </div> : null}
    {room ? <>
      <header className="hub-room-header">
        <div><span className="hub-eyebrow"><Radio size={14} />{t(room.private ? 'Private room' : 'Live')} · English</span><h1>{room.title}</h1></div>
        <div className="hub-room-header-actions"><span><Users size={16} />{room.members.length}</span><button type="button" className="hub-button" onClick={() => void share()}>{copied ? <Check size={17} /> : <Copy size={17} />}{t(copied ? 'Link copied' : 'Invite friends')}</button></div>
      </header>
      {shareUrl ? <label className="hub-share-link">{t('Invitation link')}<input readOnly value={shareUrl} onFocus={event => event.target.select()} /></label> : null}
      <div className="hub-mode-bar"><div><span className="hub-eyebrow">{t('Room mode')}</span><div className="hub-mode-switch" aria-label={t('Room mode')}>{Object.entries(KINDS).map(([value, label]) => <button type="button" key={value} disabled={!isHost} aria-pressed={room.kind === value} onClick={() => hub.setMode(value)}>{value === 'debate' ? <Swords size={16} /> : <AudioLines size={16} />}{t(label)}</button>)}</div></div><p>{t(isHost ? 'Switch modes without leaving. Debate teams are assigned automatically.' : 'The host chooses the mode. Your voice connection stays active.')}</p></div>
      <div className="hub-session-layout">
        <div className={cn('hub-stage', `tone-${roomTone(room)}`)}>
          <div className="hub-stage-top"><span><AudioLines size={16} />{t(KINDS[room.kind as keyof typeof KINDS])}</span><span>{speakers.length}/{room.capacity} {t('on stage')}</span></div>
          <div className="hub-topic"><h2>{room.topic}</h2><p>{t(room.kind === 'debate' ? 'Listen, take turns and challenge ideas respectfully. Raise your hand when you want to speak.' : 'Good conversations start with listening.')}</p>{isHost ? <details className="hub-topic-editor"><summary><Settings2 size={14} />{t('Change topic')}</summary><form onSubmit={event => { event.preventDefault(); if (topicDraft.trim()) { hub.setTopic(topicDraft.trim()); setTopicDraft('') } }}><input value={topicDraft} maxLength={200} placeholder={room.topic} aria-label={t('What will you talk about?')} onChange={event => setTopicDraft(event.target.value)} /><button type="submit" className="hub-button" disabled={!topicDraft.trim()}>{t('Save topic')}</button></form></details> : null}</div>
          {room.kind === 'debate' ? <DebateStage hub={hub} /> : <div className={cn('hub-speakers', room.private && room.capacity === 2 && 'is-pair')}>
            {speakers.map(member => <StageMember key={member.id} member={member} hub={hub} />)}
            {Array.from({ length: Math.max(0, room.capacity - speakers.length) }, (_, index) => <button type="button" className="hub-speaker is-empty" key={`seat-${index}`} disabled={hub.busy || hub.self?.role === 'speaker'} onClick={() => void hub.takeSeat()} aria-label={t('Take a seat')}><span className="hub-empty-seat"><Plus size={24} /></span><b>{t('Take a seat')}</b></button>)}
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
          {room.private && room.capacity === 2 ? <button type="button" className="hub-next-partner hub-button" onClick={hub.nextPartner}><Shuffle size={16} />{t('Find next partner')}</button> : null}
        </div>
        <aside className="hub-chat">
          <h3><MessageCircle size={18} />{t('Room chat')}</h3>
          <div className="hub-chat-messages" ref={chatRef} role="log" aria-live="polite">{hub.messages.length ? hub.messages.map(message => <div key={message.id} className="hub-chat-message"><div><b>@{message.name}</b><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div><p>{message.text}</p></div>) : <div className="hub-chat-empty"><MessageCircle size={28} /><p>{t('Say hello or share a question.')}</p></div>}</div>
          <form onSubmit={event => { event.preventDefault(); if (text.trim()) { hub.chat(text.trim()); setText('') } }}><input value={text} onChange={event => setText(event.target.value)} maxLength={500} placeholder={t('Write a message')} aria-label={t('Write a message')} /><button type="submit" disabled={!text.trim()} aria-label={t('Send')}><Send size={18} /></button></form>
        </aside>
      </div>
      {Object.entries(hub.streams).map(([id, stream]) => <RemoteAudio key={id} stream={stream} />)}
    </> : view === 'hidden' ? null : <>
      <header className="hub-discovery-heading">
        <div><span className="hub-eyebrow"><AudioLines size={16} />{t(view === 'partner' ? 'One-to-one voice practice' : 'Conversation & team debate')}</span><h1>{t(view === 'partner' ? 'Meet your speaking partner.' : 'A little courage. A real conversation.')}</h1><p>{t(view === 'partner' ? 'One-to-one practice. A new person, a new perspective.' : 'One community. Real voices. More confidence every day.')}</p><div className="hub-hero-actions">{view === 'partner' ? <button type="button" className="hub-button is-primary" disabled={!hub.connected || hub.busy || !!hub.invitation} onClick={() => void hub.match()}><Shuffle size={18} />{t('Find a random partner')}</button> : <><button type="button" className="hub-button is-primary" disabled={!hub.connected || hub.busy} onClick={() => { hub.clearError(); setCreating(true) }}><Plus size={19} />{t('Create a room')}</button></>}</div></div>
        <div className="hub-hero-art" aria-hidden="true"><span className="hub-art-orbit" /><div className="hub-art-mic"><AudioLines size={54} /></div><span className="hub-art-label"><Headphones size={14} />{t('Listen. Speak. Grow.')}</span><span className="hub-art-spark"><Sparkles size={22} /></span><span className="hub-art-chat"><MessageCircle size={26} /></span></div>
      </header>
      {view === 'partner' ? <PartnerDiscovery hub={hub} /> : <><section className="hub-starters" aria-label={t('Start a room in one tap')}>
        <div className="hub-section-label"><b>{t('Start a room in one tap')}</b><small>{t('Pick a topic. Your room is ready.')}</small></div>
        <div className="hub-starter-grid">{STARTERS.map((starter, index) => <button type="button" key={starter.title} className={`hub-starter tone-${starter.tone}`} disabled={!hub.connected || hub.busy} onClick={() => openStarter(index)}><span className="hub-starter-emoji" aria-hidden="true">{starter.emoji}</span><span><b>{t(starter.title)}</b><small>{t('Open room')} <ArrowRight size={13} /></small></span><Plus size={17} /></button>)}</div>
      </section>
      <section className="hub-lobby" aria-label={t('Live rooms')}>
        <div className="hub-lobby-filters"><nav aria-label={t('Room type')}>{Object.entries({ all: 'For you', ...KINDS }).map(([value, label]) => <button type="button" key={value} aria-pressed={kind === value} className={cn(kind === value && 'is-active')} onClick={() => setKind(value)}>{t(label)}</button>)}</nav><label className="hub-room-search"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={t('Search rooms or topics')} aria-label={t('Search rooms or topics')} /></label></div>
        <div className="hub-section-label"><h2><span className="hub-live-dot" />{t('Live rooms')}<span>{visible.length}</span></h2><small><Headphones size={14} />{t('Enter and listen. No mic needed.')}</small></div>
        <div className="hub-room-grid">{visible.map(room => <SocialRoomCard key={room.id} room={room} hub={hub} />)}</div>
        {!visible.length ? <div className="hub-lobby-empty"><span>🫶</span><div><h3>{t(query || kind !== 'all' ? 'No rooms match yet' : 'Be the first voice in the room')}</h3><p>{t(query || kind !== 'all' ? 'Try another topic or open your own room.' : 'A hello is all it takes. Pick a topic above and welcome people in.')}</p></div><button type="button" className="hub-button is-primary" disabled={!hub.connected || hub.busy} onClick={() => openStarter(0)}><Mic size={17} />{t('Start talking')}</button></div> : null}
      </section></>}
    </>}
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
    <div className="hub-partner-guide"><span><Shuffle size={26} /></span><div><h2>{t('Let a conversation surprise you.')}</h2><p>{t('Random matching connects two ready learners in a private voice room. Turn on your mic when you feel ready.')}</p><ol className="hub-partner-steps"><li><b>1</b>{t('Choose a partner')}</li><li><b>2</b>{t('Accept the invitation')}</li><li><b>3</b>{t('Turn on your mic')}</li></ol></div><span className="hub-partner-badge"><LockKeyhole size={15} />{t('Private room')}</span></div>
    <div className="hub-section-label"><div><h2>{t('Choose your partner')} <span className="hub-partner-count">{available.length}</span></h2><small>{t('Send an invitation. The call starts when they accept.')}</small></div><label className="hub-room-search"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={t('Search by nickname')} aria-label={t('Search by nickname')} />{query ? <button type="button" onClick={() => setQuery('')} aria-label={t('Clear search')}><X size={15} /></button> : null}</label></div>
    <div className="hub-partner-grid">{partners.map(name => <article key={name} className="hub-partner-card"><span className="hub-partner-card-label"><span className="hub-live-dot" />{t('Ready to talk')}</span><div className="hub-partner-avatar"><ProfileAvatar src={hub.availablePeople.find(person => person.name === name)?.avatarUrl} name={name} alt="" /><i /></div><div className="hub-partner-identity"><h3>@{name}</h3><span><Headphones size={13} />{t('One-to-one voice practice')}</span></div><div className="hub-partner-card-actions"><button type="button" className="hub-button" disabled={!hub.connected || hub.busy || !!hub.invitation} onClick={() => void hub.invite(name)}><Mic size={16} />{t('Invite to talk')}<ArrowRight size={14} /></button><button type="button" className="hub-partner-profile" onClick={() => navigate('/u/' + encodeURIComponent(name), { state: { from: '/community?mode=partner' } })}>{t('View profile')}<ArrowRight size={13} /></button></div></article>)}</div>
    {!partners.length && !hub.busy && !hub.invitation ? <div className="hub-lobby-empty"><Headphones size={28} /><div><h3>{t(!hub.connected ? 'Connecting to partners...' : query.trim() ? 'No partner found' : 'Your next partner is on their way.')}</h3><p>{t(query.trim() ? 'Try another nickname or use random matching.' : 'Join random matching, or invite a learner when they appear online here.')}</p></div>{query.trim() ? <button type="button" className="hub-button" onClick={() => setQuery('')}>{t('Clear search')}</button> : null}</div> : null}
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
  return <div className={cn('hub-pending', outgoing && 'is-inviting')} role="status"><span className="hub-pending-icon">{outgoing ? <Send size={22} /> : <Loader2 className="animate-spin" size={22} />}</span><div><b>{outgoing ? `${t('Waiting for')} @${outgoing.nickname}` : t(hub.matching ? 'Looking for your next conversation…' : 'Connecting…')}</b><p>{t(outgoing ? 'Your invitation is on its way. The call opens when they accept.' : hub.matching ? 'Stay here. We will connect you when another learner is ready.' : 'Preparing your voice room.')}</p>{outgoing ? <small>{Math.max(0, Math.ceil((outgoing.expiresAt - now) / 1000))}s · {t('Invitation expires automatically')}</small> : null}</div><button type="button" className="hub-button" onClick={hub.leave}>{t('Cancel')}</button></div>
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
    <div className="hub-debate-teams">{(['for', 'against'] as const).map(side => {
      const team = speakers.filter(member => member.side === side)
      return <section key={side} className={cn('hub-debate-team', `team-${side}`, current?.side === side && room.debate.running && 'is-current')}><header><span><Swords size={16} />{t(side === 'for' ? 'For' : 'Against')}<small>{team.length}/{Math.ceil(room.capacity / 2)}</small></span><button type="button" disabled={hub.self?.role !== 'speaker' || hub.self?.side === side || team.length >= Math.ceil(room.capacity / 2)} onClick={() => hub.changeState({ side })}>{t(hub.self?.side === side ? 'Your team' : 'Join team')}</button></header><div className="hub-speakers">{team.map(member => <StageMember key={member.id} member={member} hub={hub} />)}{Array.from({ length: Math.max(0, Math.ceil(room.capacity / 2) - team.length) }, (_, index) => <button type="button" key={index} className="hub-speaker is-empty" disabled={hub.busy || hub.self?.role === 'speaker' || speakers.length >= room.capacity} onClick={() => void hub.takeSeat()}><span className="hub-empty-seat"><Plus size={21} /></span><b>{t('Take a seat')}</b></button>)}</div></section>
    })}</div><p className="hub-debate-note">{t('Speakers are automatically placed in two balanced teams. The host manages turns.')}</p>
  </div>
}

function SocialRoomCard({ room, hub }: { room: SpeakingRoom; hub: SpeakingCommunity }) {
  const t = useCommunityCopy()
  const host = room.members.find(member => member.id === room.hostId)
  const speakers = room.members.filter(member => member.role === 'speaker')
  const full = room.members.length >= room.maxParticipants
  return <article className={`hub-room-card tone-${roomTone(room)}`}>
    <div className="hub-room-cover"><div className="hub-room-tags"><span>English</span><span><Radio size={11} />{t('Live')}</span></div><span className="hub-room-cover-emoji" aria-hidden="true">{room.kind === 'debate' ? '💬' : room.kind === 'ielts' ? '🎯' : '☕'}</span><h3>{room.title}</h3><div className="hub-card-host"><span><ProfileAvatar src={host?.avatarUrl} name={host?.name} alt="" /></span><b>@{host?.name}</b><small>{t('Host')}</small></div></div>
    <div className="hub-room-card-body"><div className="hub-room-card-info"><span>{t(KINDS[room.kind as keyof typeof KINDS])}</span><span>{t(LEVELS[room.level as keyof typeof LEVELS])}</span></div><p>{room.topic}</p><div className="hub-card-stage">{Array.from({ length: Math.min(room.capacity, 6) }, (_, index) => <span key={index} className={cn('hub-card-seat', !speakers[index] && 'is-open')}>{speakers[index] ? <ProfileAvatar src={speakers[index].avatarUrl} name={speakers[index].name} alt="" /> : <Mic size={13} />}</span>)}<small>{Math.max(0, room.capacity - speakers.length)} {t('open seats')}</small></div><div className="hub-room-card-bottom"><span><Headphones size={15} /><b>{room.members.length}</b>{t('in room')}</span><button type="button" className="hub-button" disabled={full || !hub.connected || hub.busy} onClick={() => void hub.join(room.id)}>{t(full ? 'Room full' : 'Enter room')}<ArrowRight size={15} /></button></div></div>
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
  const [starterIndex, setStarterIndex] = useState(0)
  const [title, setTitle] = useState('')
  const [topic, setTopic] = useState('')
  const [privateRoom, setPrivateRoom] = useState(false)
  const [capacity, setCapacity] = useState(8)
  const [level, setLevel] = useState('all')
  const dialog = useRef<HTMLDialogElement>(null)
  const starter = STARTERS[starterIndex]
  useEffect(() => { dialog.current?.showModal() }, [])
  return <dialog className="hub-create-dialog" ref={dialog} onCancel={onClose} aria-labelledby="create-speaking-title"><form onSubmit={event => { event.preventDefault(); void onCreate({ title: title.trim() || t(starter.title), topic: topic.trim() || t(starter.topic), kind: starter.kind, capacity, level, private: privateRoom }) }}>
    <div className="hub-dialog-heading"><span>🎙️</span><button type="button" onClick={onClose} aria-label={t('Close')}><X size={20} /></button></div><h2 id="create-speaking-title">{t('Your room. Your people.')}</h2><p>{t('Pick a vibe and go live. Everything is ready.')}</p>
    <div className="hub-create-vibes" aria-label={t('Room type')}>{STARTERS.map((item, index) => <button type="button" key={item.title} aria-pressed={starterIndex === index} className={cn(`tone-${item.tone}`, starterIndex === index && 'is-selected')} onClick={() => setStarterIndex(index)}><span>{item.emoji}</span>{t(item.title)}{starterIndex === index ? <Check size={15} /> : null}</button>)}</div>
    <label>{t('Room name')}<input maxLength={70} value={title} placeholder={t(starter.title)} onChange={event => setTitle(event.target.value)} /></label>
    <details className="hub-optional-settings"><summary><Settings2 size={16} />{t('Room settings')}<ChevronDown size={14} /></summary><label>{t('What will you talk about?')}<textarea rows={2} maxLength={200} value={topic} placeholder={t(starter.topic)} onChange={event => setTopic(event.target.value)} /></label><div className="hub-form-grid"><label>{t('Seats')}<select value={capacity} onChange={event => setCapacity(Number(event.target.value))}>{[2, 4, 6, 8].map(value => <option key={value}>{value}</option>)}</select></label><label>{t('English level')}<select value={level} onChange={event => setLevel(event.target.value)}>{Object.entries(LEVELS).map(([value, label]) => <option key={value} value={value}>{t(label)}</option>)}</select></label></div><label className="hub-private-toggle"><input type="checkbox" checked={privateRoom} onChange={event => setPrivateRoom(event.target.checked)} />{t('Private · invite link only')}</label></details>
    {error ? <div className="hub-feedback is-error" role="alert">{t(error)}</div> : null}
    <button type="submit" className="hub-button is-primary hub-go-live" disabled={busy}>{busy ? <Loader2 size={18} className="animate-spin" /> : <Radio size={18} />}{t('Open my room')}</button><small className="hub-create-note">{t('People join as listeners. You choose when to turn on your mic.')}</small>
  </form></dialog>
}

function RemoteAudio({ stream }: { stream: MediaStream }) {
  const t = useCommunityCopy()
  const audio = useRef<HTMLAudioElement>(null)
  const [blocked, setBlocked] = useState(false)
  useEffect(() => { const element = audio.current; if (!element) return; element.srcObject = stream; void element.play().catch(() => setBlocked(true)); return () => { element.srcObject = null } }, [stream])
  return <><audio ref={audio} autoPlay playsInline />{blocked ? <button type="button" className="hub-button" onClick={() => void audio.current?.play().then(() => setBlocked(false)).catch(() => {})}><Headphones size={18} />{t('Tap to play audio')}</button> : null}</>
}
