import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import DeviceAccessPanel, { type DeviceSummary } from '@/components/auth/DeviceAccessPanel'

type DeviceAccessEvent = { code: string; details?: { devices?: DeviceSummary[]; maxDevices?: number; activeDevice?: DeviceSummary } }

/** Explains a sign-in refused because of the device limit or another active device. */
export default function DeviceAccessDialog() {
  const [refusal, setRefusal] = useState<DeviceAccessEvent | null>(null)
  useEffect(() => {
    const show = (event: Event) => setRefusal((event as CustomEvent<DeviceAccessEvent>).detail)
    window.addEventListener('profai:device-access', show)
    return () => window.removeEventListener('profai:device-access', show)
  }, [])
  useEffect(() => {
    if (!refusal) return
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setRefusal(null) }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [refusal])
  if (!refusal) return null
  const close = () => setRefusal(null)
  return createPortal(
    <div className="device-access-overlay" onClick={event => { if (event.target === event.currentTarget) close() }}>
      <DeviceAccessPanel asDialog variant={refusal.code === 'DEVICE_LIMIT_REACHED' ? 'limit' : 'in-use'}
        devices={refusal.details?.devices} maxDevices={refusal.details?.maxDevices} activeDevice={refusal.details?.activeDevice} onClose={close} />
    </div>,
    document.body,
  )
}
