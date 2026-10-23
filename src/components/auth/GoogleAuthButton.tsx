import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { connectGoogleIdentity } from '@/lib/googleIdentity'
import { useCopy } from '@/i18n/interface'

type Props = { mode: 'signin' | 'signup'; disabled?: boolean; onCredential: (credential: string) => Promise<void> | void }

export default function GoogleAuthButton({ mode, disabled = false, onCredential }: Props) {
  const { c, language } = useCopy()
  const container = useRef<HTMLDivElement>(null)
  const handler = useRef(onCredential)
  handler.current = onCredential
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  useEffect(() => { if (container.current) container.current.inert = disabled || processing }, [disabled, processing])
  useEffect(() => {
    let canceled = false
    let release: (() => void) | undefined
    let observer: ResizeObserver | undefined
    setLoading(true); setError('')
    void connectGoogleIdentity(async credential => {
      if (canceled || disabled) return
      setProcessing(true); setError('')
      try { await handler.current(credential) }
      catch (failure) { if (!canceled) setError(failure instanceof Error ? failure.message : 'Google sign-in failed') }
      finally { if (!canceled) setProcessing(false) }
    }).then(connection => {
      if (canceled) { connection.release(); return }
      release = connection.release
      let lastWidth = 0
      const render = () => {
        const parent = container.current
        if (!parent) return
        const width = Math.max(200, Math.min(400, Math.floor(parent.clientWidth || 300)))
        if (width === lastWidth) return
        lastWidth = width; parent.replaceChildren()
        connection.api.renderButton(parent, { locale: language === 'ru' ? 'ru' : 'en', type: 'standard', theme: 'outline', size: 'large', shape: 'rectangular', logo_alignment: 'left', text: 'continue_with', width })
      }
      render()
      if (typeof ResizeObserver !== 'undefined' && container.current) { observer = new ResizeObserver(render); observer.observe(container.current) }
      setLoading(false)
    }).catch(failure => {
      if (!canceled) { setError(failure instanceof Error ? failure.message : 'Google sign-in failed'); setLoading(false) }
    })
    return () => { canceled = true; release?.(); observer?.disconnect() }
  }, [language, mode, disabled, retry])

  return <div className="ivygoo-google-access" aria-busy={loading || processing}>
    <div className="ivygoo-google-button-wrap">
      <div ref={container} className="ivygoo-google-button" />
      {(loading || processing) && <div className="ivygoo-google-loading" role="status"><Loader2 size={16} className="animate-spin" />{c('Connecting to Google...')}</div>}
    </div>
    {error && <div className="ivygoo-google-error" role="alert"><p>{c(error)}</p><button type="button" disabled={disabled || processing} onClick={() => setRetry(value => value + 1)}>{c('Try again')}</button></div>}
  </div>
}
