import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMotionPreferences } from '@/hooks/useMotionPreferences'
import { apiClient } from '@/lib/apiClient'

type GoogleCredentialResponse = {
  credential: string
}

type GoogleInitializeOptions = {
  client_id: string
  callback: (response: GoogleCredentialResponse) => void
  ux_mode?: 'popup' | 'redirect'
  auto_select?: boolean
  context?: 'signin' | 'signup' | 'use'
  itp_support?: boolean
  use_fedcm_for_prompt?: boolean
}

type GoogleRenderButtonOptions = {
  type?: 'standard' | 'icon'
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  logo_alignment?: 'left' | 'center'
  width?: number
}

type GoogleIdentityApi = {
  accounts: {
    id: {
      initialize: (options: GoogleInitializeOptions) => void
      renderButton: (parent: HTMLElement, options: GoogleRenderButtonOptions) => void
      prompt: () => void
    }
  }
}

declare global {
  interface Window {
    google?: GoogleIdentityApi
  }
}

type GoogleAuthButtonProps = {
  mode: 'signin' | 'signup'
  disabled?: boolean
  onCredential: (idToken: string) => Promise<void> | void
}

type GoogleConfigResponse = {
  enabled: boolean
  clientId: string | null
}

const SCRIPT_ID = 'google-identity-script'

export default function GoogleAuthButton({ mode, disabled = false, onCredential }: GoogleAuthButtonProps) {
  const { minimalMotion } = useMotionPreferences()
  const frontendGoogleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim()
  const [googleClientId, setGoogleClientId] = useState(frontendGoogleClientId)
  const [isResolvingClientId, setIsResolvingClientId] = useState(false)
  const [setupMessage, setSetupMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const onCredentialRef = useRef(onCredential)

  useEffect(() => {
    onCredentialRef.current = onCredential
  }, [onCredential])

  useEffect(() => {
    let canceled = false

    if (frontendGoogleClientId) {
      setGoogleClientId(frontendGoogleClientId)
      setSetupMessage('')
      return () => {
        canceled = true
      }
    }

    const resolveClientId = async () => {
      setIsResolvingClientId(true)
      try {
        const payload = await apiClient.get<GoogleConfigResponse>('/auth/google/config', { auth: false })
        if (canceled) return
        const resolved = (payload.clientId ?? '').trim()
        if (payload.enabled && resolved) {
          setGoogleClientId(resolved)
          setSetupMessage('')
          return
        }
        setGoogleClientId('')
        setSetupMessage('Google Sign-In setup incomplete. Set GOOGLE_CLIENT_ID (backend) or VITE_GOOGLE_CLIENT_ID (frontend).')
      } catch {
        if (!canceled) {
          setGoogleClientId('')
          setSetupMessage('Google Sign-In setup failed. Backend /auth/google/config endpoint is unavailable.')
        }
      } finally {
        if (!canceled) {
          setIsResolvingClientId(false)
        }
      }
    }

    void resolveClientId()

    return () => {
      canceled = true
    }
  }, [frontendGoogleClientId])

  useEffect(() => {
    if (!googleClientId) {
      return
    }

    let canceled = false

    const initGoogleButton = () => {
      if (canceled || !window.google?.accounts?.id || !containerRef.current) return

      const buttonContainer = containerRef.current
      buttonContainer.innerHTML = ''

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        ux_mode: 'popup',
        auto_select: false,
        context: mode,
        itp_support: true,
        use_fedcm_for_prompt: true,
        callback: async (response: GoogleCredentialResponse) => {
          if (!response.credential || canceled) {
            return
          }

          setSetupMessage('')
          setIsProcessing(true)
          try {
            await onCredentialRef.current(response.credential)
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Google sign-in failed.'
            setSetupMessage(message)
          } finally {
            if (!canceled) {
              setIsProcessing(false)
            }
          }
        },
      })

      const renderWidth = Math.max(230, Math.min(300, buttonContainer.clientWidth || 260))
      window.google.accounts.id.renderButton(buttonContainer, {
        theme: 'outline',
        size: 'medium',
        shape: 'pill',
        logo_alignment: 'left',
        text: mode === 'signup' ? 'signup_with' : 'continue_with',
        width: renderWidth,
      })

      setSetupMessage('')
    }

    const existingScript = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
    if (window.google?.accounts?.id) {
      initGoogleButton()
      return () => {
        canceled = true
      }
    }

    const script = existingScript ?? document.createElement('script')
    if (!existingScript) {
      script.id = SCRIPT_ID
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }

    const handleLoad = () => initGoogleButton()
    const handleError = () => {
      if (!canceled) {
        setSetupMessage('Google script could not be loaded. Check internet connection.')
      }
    }

    script.addEventListener('load', handleLoad)
    script.addEventListener('error', handleError)

    return () => {
      canceled = true
      script.removeEventListener('load', handleLoad)
      script.removeEventListener('error', handleError)
    }
  }, [googleClientId, mode])

  return (
    <div className="space-y-2">
      <div className="relative mx-auto flex w-fit items-center justify-center overflow-hidden rounded-full">
        {googleClientId ? (
          <motion.div
            initial={minimalMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: minimalMotion ? 0.12 : 0.2, ease: [0.22, 1, 0.36, 1] }}
            ref={containerRef}
            className="flex min-h-[36px] items-center justify-center"
          />
        ) : (
          <div className="flex min-h-[36px] items-center justify-center rounded-full border border-dashed border-blue-200 bg-blue-50/45 px-4 py-2 text-center text-[11px] font-semibold text-blue-700">
            {isResolvingClientId ? 'Resolving Google OAuth...' : 'Google OAuth is not configured yet.'}
          </div>
        )}

        {(disabled || isProcessing || isResolvingClientId) ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/85 backdrop-blur-[1px]">
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Connecting...
            </span>
          </div>
        ) : null}
      </div>

      {setupMessage ? <p className="text-center text-xs text-error-600">{setupMessage}</p> : null}
    </div>
  )
}
