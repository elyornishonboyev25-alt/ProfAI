import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MonitorSmartphone } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { useToastStore } from '@/store/toastStore'
import { accountUsageText, relativeTime } from '@/i18n/accountUsage'
import { DeviceIcon, deviceLabel, type DeviceSummary } from '@/components/auth/DeviceAccessPanel'

type DevicesResponse = { maxDevices: number; devices: Array<DeviceSummary & { id: string }> }

/** Profile → Devices: the physical devices signed in, with remote sign-out. */
export default function AccountDevices() {
  const { i18n } = useTranslation()
  const text = accountUsageText(i18n.language)
  const pushToast = useToastStore(state => state.pushToast)
  const [data, setData] = useState<DevicesResponse | null>(null)
  const [failed, setFailed] = useState(false)
  const [removing, setRemoving] = useState('')
  const load = useCallback(async () => {
    try { setData(await apiClient.get<DevicesResponse>('/auth/devices')); setFailed(false) } catch { setFailed(true) }
  }, [])
  useEffect(() => { void load() }, [load])

  const remove = async (id: string) => {
    if (!window.confirm(text.removeConfirm)) return
    setRemoving(id)
    try {
      await apiClient.delete(`/auth/devices/${encodeURIComponent(id)}`)
      pushToast({ type: 'success', title: text.removed, message: '' })
      await load()
    } catch (error) {
      pushToast({ type: 'error', title: text.devicesError, message: error instanceof Error ? error.message : '' })
    } finally { setRemoving('') }
  }

  return (
    <section id="devices" className="account-profile-card mt-6 scroll-mt-24 surface-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-2 text-xl font-semibold text-slate-900">
          <MonitorSmartphone className="h-5 w-5 text-red-600" aria-hidden="true" />{text.devicesTitle}
        </h2>
        {data ? <span className="soft-chip">{data.devices.length}/{data.maxDevices} {text.slots}</span> : null}
      </div>
      <p className="mt-2 text-sm text-slate-600">{text.devicesLead}</p>
      {failed ? <p className="mt-4 text-sm text-red-700" role="alert">{text.devicesError}</p> : null}
      {data ? (
        <ul className="account-devices-list">
          {data.devices.map(device => (
            <li key={device.id} className={device.current ? 'is-current' : ''}>
              <span className="device-access-device-icon"><DeviceIcon type={device.deviceType} size={18} /></span>
              <div>
                <strong>{deviceLabel(device, text.types)}</strong>
                {device.current ? <em>{text.thisDevice}</em> : <span>{text.lastActive}: {relativeTime(device.lastSeenAt, i18n.language)}</span>}
              </div>
              {!device.current ? <button type="button" disabled={!!removing} onClick={() => { void remove(device.id) }}>{removing === device.id ? text.removing : text.remove}</button> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
