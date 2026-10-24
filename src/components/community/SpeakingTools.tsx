import { useEffect, useRef, useState } from 'react'
import { AudioLines, Check, Headphones, Loader2, Mic, MicOff, RefreshCw, Sparkles, Users } from 'lucide-react'
import { useCommunityCopy } from '@/i18n/community'

export function SpeakingGettingStarted({ partner }: { partner: boolean }) {
  const t = useCommunityCopy()
  const steps = partner
    ? [['Choose your partner', 'Invite a learner or try random matching.', Users], ['Meet in a private room', 'An invitation starts after they accept. Random matching connects you automatically.', Headphones], ['Start speaking', 'Turn on your mic and use a conversation prompt.', Mic]] as const
    : [['Find your room', 'Choose conversation, IELTS practice or debate.', Users], ['Listen first', 'Join with your microphone off. Get comfortable.', Headphones], ['Start speaking', 'Take a seat, turn on your mic and take turns.', Mic]] as const
  return <ol className="hub-onboarding" aria-label={t('How to start speaking')}>
    {steps.map(([title, detail, Icon], index) => <li key={title}><span className="hub-onboarding-icon"><Icon size={20} /><i>{index + 1}</i></span><div><b>{t(title)}</b><p>{t(detail)}</p></div></li>)}
  </ol>
}

export function AudioSetup({ disabled }: { disabled: boolean }) {
  const t = useCommunityCopy()
  const [state, setState] = useState<'idle' | 'requesting' | 'testing' | 'done' | 'error'>('idle')
  const [volume, setVolume] = useState(0)
  const [heard, setHeard] = useState(false)
  const resources = useRef<{ stream?: MediaStream; context?: AudioContext; frame?: number; timer?: number }>({})
  const generation = useRef(0)
  const stop = () => {
    generation.current += 1
    const current = resources.current
    if (current.frame !== undefined) cancelAnimationFrame(current.frame)
    if (current.timer !== undefined) window.clearTimeout(current.timer)
    current.stream?.getTracks().forEach(track => track.stop())
    void current.context?.close().catch(() => {})
    resources.current = {}
  }
  useEffect(() => stop, [])
  useEffect(() => { if (disabled) { stop(); setState('idle') } }, [disabled])
  const test = async () => {
    stop()
    const request = generation.current
    setState('requesting')
    setHeard(false)
    setVolume(0)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false })
      if (request !== generation.current) { stream.getTracks().forEach(track => track.stop()); return }
      resources.current.stream = stream
      const context = new AudioContext()
      resources.current.context = context
      await context.resume()
      if (request !== generation.current) return
      const analyser = context.createAnalyser()
      analyser.fftSize = 256
      context.createMediaStreamSource(stream).connect(analyser)
      const samples = new Uint8Array(analyser.fftSize)
      setState('testing')
      const measure = () => {
        if (request !== generation.current) return
        analyser.getByteTimeDomainData(samples)
        const rms = Math.sqrt(samples.reduce((sum, sample) => sum + ((sample - 128) / 128) ** 2, 0) / samples.length)
        setVolume(Math.min(100, Math.round(rms * 500)))
        if (rms > .015) setHeard(true)
        resources.current.frame = requestAnimationFrame(measure)
      }
      measure()
      resources.current.timer = window.setTimeout(() => { stop(); setState('done'); setVolume(0) }, 10_000)
    } catch {
      if (request !== generation.current) return
      stop()
      setState('error')
    }
  }
  return <details className="hub-audio-setup">
    <summary><Headphones size={17} />{t('Check your microphone')}<span>{t('Optional · 10 seconds')}</span></summary>
    <div className="hub-audio-setup-body"><div><b>{t('Use headphones for clearer conversations.')}</b><p role="status">{t(state === 'testing' ? 'Say a few words. The meter shows your microphone input.' : state === 'requesting' ? 'Allow microphone access in your browser.' : state === 'error' ? 'Allow microphone access in your browser, then try again.' : state === 'done' ? heard ? 'Microphone works. You are ready to speak.' : 'No sound detected. Check your input device and try again.' : 'Test your mic before joining. The test stops automatically.')}</p></div>
      <div className="hub-audio-meter" role="meter" aria-label={t('Microphone input')} aria-valuemin={0} aria-valuemax={100} aria-valuenow={volume}><span style={{ width: `${volume}%` }} /></div>
      <button type="button" className="hub-button" disabled={disabled} onClick={() => { if (state === 'testing' || state === 'requesting') { stop(); setState('done'); setVolume(0) } else void test() }}>{state === 'requesting' ? <Loader2 size={16} className="animate-spin" /> : state === 'testing' ? <MicOff size={16} /> : heard && state === 'done' ? <Check size={16} /> : <Mic size={16} />}{t(state === 'requesting' || state === 'testing' ? 'Stop test' : 'Test microphone')}</button>
    </div>
  </details>
}

const PROMPTS = {
  conversation: ['Introduce yourself and share one thing you enjoy doing.', 'What is something you would like to learn this year? Why?', 'Describe your favourite place and ask your partner about theirs.', 'What made you smile this week?', 'If you could travel anywhere, where would you go and why?', 'Tell a short story about a memorable day. Ask a follow-up question.'],
  ielts: ['Part 1: Do you work or study? What do you enjoy about it?', 'Part 1: How do you usually spend your weekends?', 'Part 2: Describe a skill you would like to learn. Say what it is, how you would learn it and why it matters to you.', 'Part 3: How has technology changed the way people learn?', 'Part 2: Describe a person who inspires you. Say who they are, how you know them and why they inspire you.', 'Part 3: Why is it important for people to learn from each other?'],
  debate: ['State your position: I believe… because…', 'Give a concrete example that supports your argument.', 'Respond to the other side: I understand your point, but…', 'Ask the other team a question about their argument.', 'Consider the strongest argument against your position.', 'Summarise your view and one thing you learned from the other team.'],
}

export function ConversationToolkit({ kind }: { kind: string }) {
  const t = useCommunityCopy()
  const [index, setIndex] = useState(0)
  const prompts = PROMPTS[kind as keyof typeof PROMPTS] ?? PROMPTS.conversation
  return <section className="hub-conversation-toolkit" aria-label={t('Speaking prompts')}>
    <div><b><Sparkles size={16} />{t(kind === 'debate' ? 'Build your argument' : 'Need something to say?')}</b><span>{index + 1}/{prompts.length}</span></div>
    <p lang="en" aria-live="polite">{prompts[index]}</p>
    <footer><span><AudioLines size={13} />{t('Speak, listen, ask a follow-up.')}</span><button type="button" onClick={() => setIndex(value => (value + 1) % prompts.length)}><RefreshCw size={14} />{t('Next prompt')}</button></footer>
  </section>
}
