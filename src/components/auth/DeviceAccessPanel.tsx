import { useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, LogOut, Monitor, RefreshCw, Smartphone, Tablet } from 'lucide-react'
import { BrandMark } from '@/components/brand/BrandLogo'
import { accountUsageText, relativeTime } from '@/i18n/accountUsage'
import '@/styles/device-access.css'

export type DeviceSummary = { id?: string; deviceType?: string; os?: string; browsers?: string[]; lastSeenAt?: string; current?: boolean }
type Variant = 'in-use' | 'limit' | 'unavailable'

export function DeviceIcon({ type, size = 20 }: { type?: string; size?: number }) {
  if (type === 'PHONE') return <Smartphone size={size} aria-hidden="true" />
  if (type === 'TABLET') return <Tablet size={size} aria-hidden="true" />
  return <Monitor size={size} aria-hidden="true" />
}

export function deviceLabel(device: DeviceSummary, types: Record<string, string>) {
  const browsers = device.browsers?.filter(browser => browser && browser !== 'Unknown').join(', ')
  const os = device.os && device.os !== 'Unknown' ? device.os : types[device.deviceType ?? 'DESKTOP'] ?? types.DESKTOP
  return browsers ? `${os} · ${browsers}` : os
}

// Two linked devices guarded by a shield: one account, one device at a time.
function Emblem({ variant }: { variant: Variant }) {
  return (
    <svg className="device-access-emblem" viewBox="0 0 120 96" aria-hidden="true">
      <defs>
        <linearGradient id="device-access-shield" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f4224b" /><stop offset=".55" stopColor="#df0030" /><stop offset="1" stopColor="#b60025" />
        </linearGradient>
      </defs>
      <rect x="6" y="18" width="62" height="42" rx="6" className="device-access-emblem-screen" />
      <rect x="12" y="24" width="50" height="30" rx="3" className="device-access-emblem-glass" />
      <path d="M0 64h74a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4Z" className="device-access-emblem-screen" />
      <rect x="80" y="26" width="30" height="52" rx="6" className="device-access-emblem-screen" />
      <rect x="84" y="32" width="22" height="38" rx="3" className="device-access-emblem-glass" />
      <path d="M70 42c4-6 8-8 12-8" className="device-access-emblem-link" />
      <path d="M60 46 74 40l14 6v10c0 10-6.5 17-14 20-7.5-3-14-10-14-20Z" fill="url(#device-access-shield)" className="device-access-emblem-shield" />
      {variant === 'unavailable'
        ? <path d="M68 52l12 12M80 52 68 64" className="device-access-emblem-mark" />
        : <><rect x="68.5" y="54" width="11" height="9" rx="2" fill="#fff" /><path d="M71 54v-3a3 3 0 0 1 6 0v3" className="device-access-emblem-mark" /></>}
    </svg>
  )
}

function Countdown({ seconds, label, onDone, startedAt }: { seconds: number; label: string; onDone: () => void; startedAt: number }) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    setLeft(seconds)
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, seconds - Math.floor((Date.now() - startedAt) / 1000))
      setLeft(remaining)
      if (remaining === 0) { window.clearInterval(timer); onDone() }
    }, 250)
    return () => window.clearInterval(timer)
  }, [seconds, startedAt, onDone])
  const progress = 1 - left / seconds
  return (
    <div className="device-access-countdown" aria-live="off">
      <svg viewBox="0 0 36 36" aria-hidden="true">
        <circle cx="18" cy="18" r="15.5" className="device-access-countdown-track" />
        <circle cx="18" cy="18" r="15.5" className="device-access-countdown-value" style={{ strokeDashoffset: 97.4 * (1 - progress) }} />
      </svg>
      <span>{label}</span>
      <strong>{`0:${String(left).padStart(2, '0')}`}</strong>
    </div>
  )
}

export default function DeviceAccessPanel({ variant, activeDevice, devices = [], maxDevices = 3, startedAt = 0, checking = false, onRetry, onLogout, onClose, loggingOut = false, asDialog = false }: {
  variant: Variant
  activeDevice?: DeviceSummary
  devices?: DeviceSummary[]
  maxDevices?: number
  startedAt?: number
  checking?: boolean
  onRetry?: () => void
  onLogout?: () => void
  onClose?: () => void
  loggingOut?: boolean
  asDialog?: boolean
}) {
  const { i18n } = useTranslation()
  const text = accountUsageText(i18n.language)
  const title = variant === 'in-use' ? text.blocked : variant === 'limit' ? text.limitTitle : text.unavailable
  const lead = variant === 'in-use' ? text.explanation : variant === 'limit' ? text.limitExplanation : text.reconnect
  const rules: ReactNode = variant === 'unavailable' ? null : (
    <ul className="device-access-rules">
      {[text.ruleDevices, text.ruleOneAtATime, text.ruleBrowsers].map(rule => <li key={rule}><CheckCircle2 size={16} aria-hidden="true" />{rule}</li>)}
    </ul>
  )
  return (
    <section className={`device-access-card is-${variant}`} role={asDialog ? 'alertdialog' : 'alert'} aria-modal={asDialog || undefined} aria-labelledby="device-access-title" aria-describedby="device-access-lead">
      <header className="device-access-header">
        <span className="device-access-eyebrow"><BrandMark size={18} />Ivygoo</span>
        <Emblem variant={variant} />
        <h1 id="device-access-title">{title}</h1>
        <p id="device-access-lead">{lead}</p>
      </header>

      {variant === 'in-use' && activeDevice ? (
        <div className="device-access-active">
          <span className="device-access-device-icon"><DeviceIcon type={activeDevice.deviceType} /><i aria-hidden="true" /></span>
          <div>
            <small>{text.activeDevice}</small>
            <strong>{deviceLabel(activeDevice, text.types)}</strong>
            {activeDevice.lastSeenAt ? <span>{text.lastActive}: {relativeTime(activeDevice.lastSeenAt, i18n.language)}</span> : null}
          </div>
        </div>
      ) : null}

      {variant === 'limit' ? (
        <div className="device-access-devices">
          <div className="device-access-slots" aria-label={`${devices.length}/${maxDevices} ${text.slots}`}>
            {Array.from({ length: maxDevices }, (_, index) => <span key={index} className={index < devices.length ? 'is-used' : ''} />)}
            <strong>{devices.length}/{maxDevices}</strong><small>{text.slots}</small>
          </div>
          <ul>
            {devices.map((device, index) => (
              <li key={device.id ?? index}>
                <span className="device-access-device-icon"><DeviceIcon type={device.deviceType} size={18} /></span>
                <div><strong>{deviceLabel(device, text.types)}</strong>{device.lastSeenAt ? <span>{text.lastActive}: {relativeTime(device.lastSeenAt, i18n.language)}</span> : null}</div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {rules}

      {variant === 'in-use' ? (
        <>
          {onRetry ? (checking
            ? <div className="device-access-countdown is-checking"><RefreshCw size={16} className="device-access-spin" aria-hidden="true" /><span>{text.checkingNow}</span></div>
            : <Countdown seconds={15} label={text.nextCheck} onDone={onRetry} startedAt={startedAt || Date.now()} />) : null}
          <p className="device-access-note">{text.faster}</p>
        </>
      ) : variant === 'limit' ? <p className="device-access-note">{text.limitHint}</p> : null}

      <footer className="device-access-actions">
        {onRetry ? <button type="button" className="device-access-primary" onClick={onRetry}><RefreshCw size={16} aria-hidden="true" />{text.retry}</button> : null}
        {onClose ? <button type="button" className="device-access-primary" onClick={onClose}>{text.close}</button> : null}
        {onLogout ? <button type="button" className="device-access-secondary" disabled={loggingOut} onClick={onLogout}><LogOut size={16} aria-hidden="true" />{text.logout}</button> : null}
      </footer>
    </section>
  )
}
