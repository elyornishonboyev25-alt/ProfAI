import { useState } from 'react'
import { ArrowRight, AudioLines, Headphones, Mic, MicOff, Plus, RefreshCw, Shuffle, Sparkles, Users } from 'lucide-react'
import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import { useCommunityCopy } from '@/i18n/community'
import type { SpeakingCommunity } from '@/hooks/useSpeakingCommunity'

const SPARKS = [
  'If you could travel anywhere tomorrow, where would you go?',
  'What is one small thing that always makes your day better?',
  'Would you rather explore the ocean or outer space? Why?',
  'What could you talk about for hours without getting bored?',
  'If you could learn any skill overnight, what would it be?',
] as const

export function ConversationSpark({ disabled, onStart }: { disabled: boolean; onStart: (topic: string) => void }) {
  const t = useCommunityCopy()
  const [index, setIndex] = useState(0)
  return <section className="zone-spark" aria-labelledby="zone-spark-title">
    <div className="zone-spark-heading"><span><Sparkles size={16} />{t('Break the ice')}</span><span className="zone-spark-counter">{String(index + 1).padStart(2, '0')} / {String(SPARKS.length).padStart(2, '0')}</span></div>
    <h2 id="zone-spark-title">{t('One question. Endless conversations.')}</h2>
    <div className="zone-spark-question" aria-live="polite"><span aria-hidden="true">“</span><p key={index} lang="en">{SPARKS[index]}</p></div>
    <div className="zone-spark-footer"><button type="button" disabled={disabled} onClick={() => onStart(SPARKS[index])}>{t('Talk about this')}<ArrowRight size={17} /></button><button type="button" className="zone-shuffle" onClick={() => setIndex(value => (value + 1) % SPARKS.length)} aria-label={t('Another question')} title={t('Another question')}><RefreshCw size={18} /></button></div>
    <small>{t('Opens a voice room with this question. Invite others to join.')}</small>
  </section>
}

export default function SpeakingLaunchpad({ hub, partner, canStart, onCreate, onStart }: {
  hub: SpeakingCommunity
  partner: boolean
  canStart: boolean
  onCreate: () => void
  onStart: () => void
}) {
  const t = useCommunityCopy()
  const people = hub.availablePeople.filter(person => person.name !== hub.selfName).slice(0, 3)
  return <header className="zone-launchpad">
    <div className="zone-launch-copy">
      <span className="zone-kicker"><span />{t('REAL PEOPLE. REAL CONVERSATIONS.')}</span>
      <h2>{t(partner ? 'New people.' : 'Less overthinking.')}<em>{t(partner ? 'New perspectives.' : 'More speaking.')}</em></h2>
      <p>{t(partner ? 'Your next favourite conversation could be with someone you have not met yet.' : 'Your English does not need to be perfect. It just needs a conversation. Find your people and let it flow.')}</p>
      <div className="zone-launch-actions">
        <button type="button" className="hub-button is-primary zone-start" disabled={!canStart || (partner && !hub.publicProfile)} onClick={partner ? () => void hub.match() : onStart}>{partner ? <Shuffle size={19} /> : <Mic size={19} />}{t(partner ? 'Find a random partner' : 'Start speaking')}<ArrowRight size={18} /></button>
        {!partner ? <button type="button" className="zone-create" disabled={!canStart} onClick={onCreate}><Plus size={17} />{t('Create a room')}</button> : null}
      </div>
      <div className="zone-reassurance"><span><MicOff size={14} />{t('Your mic starts off')}</span><span><Headphones size={14} />{t('Listen first. No pressure.')}</span></div>
      <div className="zone-presence">
        {people.length ? <div className="zone-presence-avatars">{people.map(person => <span key={person.name}><ProfileAvatar src={person.avatarUrl} name={person.name} alt="" /></span>)}</div> : <span className="zone-presence-icon"><Users size={17} /></span>}
        <div><b>{hub.connected ? <>{hub.available.filter(name => name !== hub.selfName).length} {t('Ready to talk')}</> : t('Connecting...')}</b><small>{t('A shared language. A world of stories.')}</small></div>
      </div>
    </div>
    <div className="zone-voice-art" aria-hidden="true">
      <div className="zone-orbit zone-orbit-outer" /><div className="zone-orbit zone-orbit-inner" />
      <div className="zone-orbit-dot zone-orbit-dot-one" /><div className="zone-orbit-dot zone-orbit-dot-two" />
      <div className="zone-art-note"><span>✦</span>{t('Your voice belongs here.')}</div>
      <div className="zone-hello"><span>{t('It starts with…')}</span><b>Hello<span>!</span></b><AudioLines size={22} /></div>
      <div className="zone-mic-halo"><div className="zone-mic-sculpture"><Mic size={66} strokeWidth={1.3} /><span className="zone-mic-light" /></div></div>
      <div className="zone-wave">{Array.from({ length: 23 }, (_, index) => <i key={index} style={{ '--wave-height': `${14 + Math.round(Math.sin(index * .95) ** 2 * 35)}px`, '--wave-delay': `${index * -.12}s` } as React.CSSProperties} />)}</div>
      <div className="zone-art-label"><span /><b>{t('A little courage. A real connection.')}</b></div>
      <span className="zone-art-star zone-art-star-one">✳</span><span className="zone-art-star zone-art-star-two">✦</span>
    </div>
    <div className="zone-launch-foot"><span><AudioLines size={15} />{t('English, out loud.')}</span><span>{t(partner ? 'One connection can change your confidence.' : 'Conversation · IELTS · Friendly debates')}</span><span className="zone-foot-arrow" aria-hidden="true">↗</span></div>
  </header>
}
