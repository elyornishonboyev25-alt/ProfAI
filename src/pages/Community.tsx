import { useEffect } from 'react'
import { Mic, Users } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import SpeakingHub from '@/components/community/SpeakingHub'
import { cn } from '@/components/ui/utils'
import { useSpeakingCommunity } from '@/hooks/useSpeakingCommunity'
import { useCommunityCopy } from '@/i18n/community'
import '@/styles/community.css'
import '@/styles/speaking-hub.css'
import '@/styles/speaking-zone-minimal.css'

export type CommunityMode = 'voice' | 'partner'

export default function Community() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedMode = searchParams.get('mode')
  const mode: CommunityMode = requestedMode === 'voice' ? 'voice' : 'partner'
  const hub = useSpeakingCommunity(true)
  const t = useCommunityCopy()

  useEffect(() => {
    if (requestedMode === 'ai') {
      navigate('/ielts/speaking/tests?coach=1', { replace: true })
      return
    }
    if (['debate', 'questions', 'admissions', 'progress', 'people'].includes(requestedMode ?? '')) {
      const next = new URLSearchParams(searchParams)
      next.set('mode', requestedMode === 'people' ? 'partner' : 'voice')
      setSearchParams(next, { replace: true })
    }
  }, [navigate, requestedMode, searchParams, setSearchParams])

  useEffect(() => {
    if (!hub.room || !searchParams.has('room')) return
    const next = new URLSearchParams(searchParams)
    next.delete('room')
    setSearchParams(next, { replace: true })
  }, [hub.room, searchParams, setSearchParams])

  const selectMode = (nextMode: CommunityMode) => {
    const next = new URLSearchParams(searchParams)
    next.delete('room')
    next.set('mode', nextMode)
    setSearchParams(next, { replace: true })
  }

  return <main className={cn('workspace-page community-page speaking-zone-minimal min-h-screen', hub.room && 'has-live-room')}>
    <div className="community-shell">
      <header className="community-header">
        <div className="community-brand-row"><span className="speaking-zone-mark"><Mic size={21} aria-hidden="true" /></span><div><h1>Speaking Zone</h1><p>{t('Find a partner or create a room.')}</p></div></div>
        <span className={cn('hub-connection', hub.connected && 'is-live')} role="status">{hub.connected ? `${hub.online} ${t('online now')}` : t('Connecting...')}</span>
      </header>
      {!hub.room && !searchParams.get('room') ? <nav className="community-main-nav" aria-label="Speaking Zone">
        <button type="button" aria-pressed={mode === 'partner'} className={cn(mode === 'partner' && 'is-active')} onClick={() => selectMode('partner')}><Users size={18} />{t('Partner')}</button>
        <button type="button" aria-pressed={mode === 'voice'} className={cn(mode === 'voice' && 'is-active')} onClick={() => selectMode('voice')}><Mic size={18} />{t('Voice rooms')}</button>
      </nav> : null}
      <SpeakingHub hub={hub} invitedRoom={searchParams.get('room')} view={searchParams.get('room') ? 'hidden' : mode === 'partner' ? 'partner' : 'rooms'} />
    </div>
  </main>
}