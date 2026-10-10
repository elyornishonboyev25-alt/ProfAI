import { useEffect, useState } from 'react'
import { Activity, ChevronDown, ChevronUp, History, Monitor, Search, Smartphone, Tablet, Users } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { activityText } from '@/i18n/ownerActivity'
import type { OwnerLanguage } from '@/i18n/owner'

type Device = { deviceId: string; deviceType: string; browser: string; os: string; ipAddress: string | null; online: boolean; firstSeenAt: string; lastSeenAt: string; loginAt: string }
type Account = { id: string; fullName: string; email: string; deviceCount: number; onlineDevices: number; lastSeenAt: string }
type Entry = { id: string; user: Pick<Account, 'id' | 'fullName' | 'email'>; deviceType: string; browser: string; os: string; method: string; ipAddress: string | null; loginAt: string }
type Data = { items: (Account | Entry)[]; total: number; page: number; pageSize: number; updatedAt: string; trackingSince: string | null; metrics: { onlineUsers: number; totalDevices: number; multipleDeviceAccounts: number; logins: number } }

function DeviceIcon({ type }: { type: string }) {
  const Icon = type === 'PHONE' ? Smartphone : type === 'TABLET' ? Tablet : Monitor
  return <Icon size={19} aria-hidden="true" />
}

export default function OwnerAccountActivity({ language, reload }: { language: OwnerLanguage; reload: number }) {
  const t = (text: string, params?: Record<string, string | number>) => activityText(text, language, params)
  const locale = language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-US'
  const date = (value: string) => new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Tashkent' }).format(new Date(value))
  const [view, setView] = useState<'accounts' | 'history'>('accounts')
  const [filter, setFilter] = useState('all')
  const [days, setDays] = useState('7')
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<(Data & { view: 'accounts' | 'history' }) | null>(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [devices, setDevices] = useState<Device[] | null>(null)
  const [deviceError, setDeviceError] = useState(false)

  useEffect(() => {
    const timeout = window.setTimeout(() => { setQuery(search.trim()); setPage(1) }, 350)
    return () => window.clearTimeout(timeout)
  }, [search])
  useEffect(() => {
    const refresh = () => { if (document.visibilityState !== 'hidden') setTick(value => value + 1) }
    const timer = window.setInterval(refresh, 30_000)
    document.addEventListener('visibilitychange', refresh)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh) }
  }, [])
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    const params = new URLSearchParams({ view, filter, days, q: query, page: String(page) })
    void apiClient.get<Data>(`/auth/owner/activity?${params}`, { signal: controller.signal }).then(result => {
      if (controller.signal.aborted) return
      setData({ ...result, view }); setError(false)
      const max = Math.max(1, Math.ceil(result.total / result.pageSize))
      if (page > max) setPage(max)
    }).catch(() => { if (!controller.signal.aborted) setError(true) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [view, filter, days, query, page, tick, reload])
  useEffect(() => {
    setSelected(null); setData(null)
  }, [view, filter, days, query, page])
  useEffect(() => {
    if (!selected) { setDevices(null); return }
    const controller = new AbortController()
    setDeviceError(false)
    void apiClient.get<{ items: Device[] }>(`/auth/owner/activity/users/${selected}/devices`, { signal: controller.signal })
      .then(result => { if (!controller.signal.aborted) setDevices(result.items) })
      .catch(() => { if (!controller.signal.aborted) setDeviceError(true) })
    return () => controller.abort()
  }, [selected, tick, reload])

  const metrics = [
    { label: 'Online now', value: data?.metrics.onlineUsers, icon: Activity, filter: 'online' },
    { label: 'Tracked devices', value: data?.metrics.totalDevices, icon: Monitor, filter: 'all' },
    { label: 'Multiple devices', value: data?.metrics.multipleDeviceAccounts, icon: Users, filter: 'multiple' },
    { label: 'Sign-ins in period', value: data?.metrics.logins, icon: History, filter: null },
  ]
  const typeLabel = (type: string) => t(type === 'PHONE' ? 'Phone' : type === 'TABLET' ? 'Tablet' : 'Desktop')
  const method = (value: string) => t(({ PASSWORD: 'Password', EMAIL_CODE: 'Email code', REGISTER: 'Registration', GOOGLE: 'Google', RESTORED: 'Existing session' } as Record<string, string>)[value] ?? 'Unknown')
  const maxPage = Math.max(1, Math.ceil((data?.total ?? 0) / 20))
  return <section className="owner-activity" aria-labelledby="account-activity-title">
    <div className="owner-activity-heading">
      <div><p className="owner-eyebrow">PROFAI · {t('Owner dashboard')}</p><h2 id="account-activity-title">{t('Account activity')}</h2><p>{t('Devices and sign-in history, visible only to owners.')}</p></div>
      <span className={`owner-live ${error ? 'is-stale' : ''}`}><span />{t('Auto-refresh every 30 seconds')}</span>
    </div>
    <div className="owner-activity-metrics">{metrics.map(metric => <button key={metric.label} type="button" onClick={() => {
      setView(metric.filter ? 'accounts' : 'history'); setFilter(metric.filter ?? 'all'); setPage(1)
    }}><div><metric.icon size={18} /><span>{t(metric.label)}</span></div><strong>{metric.value === undefined ? '—' : new Intl.NumberFormat(locale).format(metric.value)}</strong></button>)}</div>
    <div className="owner-activity-tools">
      <div className="owner-segments" role="group" aria-label={t('Account activity')}>{(['accounts', 'history'] as const).map(tab => <button type="button" key={tab} aria-pressed={view === tab} className={view === tab ? 'is-active' : ''} onClick={() => { setView(tab); setPage(1) }}>{t(tab === 'accounts' ? 'Accounts' : 'Sign-in history')}</button>)}</div>
      <label className="owner-activity-search"><Search size={17} /><input aria-label={t('Name or email')} placeholder={t('Name or email')} value={search} onChange={event => setSearch(event.target.value)} /></label>
      {view === 'accounts' && <select aria-label={t('Account filter')} value={filter} onChange={event => { setFilter(event.target.value); setPage(1) }}><option value="all">{t('All accounts')}</option><option value="online">{t('Online now')}</option><option value="multiple">{t('Multiple devices')}</option></select>}
      <select aria-label={t('Time period')} value={days} onChange={event => { setDays(event.target.value); setPage(1) }}>{['1', '7', '30', 'all'].map((value, index) => <option key={value} value={value}>{t(['Last 24 hours', 'Last 7 days', 'Last 30 days', 'All time'][index])}</option>)}</select>
    </div>
    <p className="owner-activity-note">{t('Device totals cover all tracked history. Online means active in the last 2 minutes. Times: Tashkent (UTC+5).')}</p>
    {error && <div role="alert" className="owner-activity-error">{t('Could not load activity.')} <button type="button" className="owner-secondary" onClick={() => setTick(value => value + 1)}>{t('Retry')}</button></div>}
    <div className="owner-activity-list" aria-busy={loading}>
      {loading && (!data || data.view !== view) && <p role="status" className="owner-empty">{t('Loading data…')}</p>}
      {data?.view === 'accounts' && view === 'accounts' && <>
        <div className="owner-account-columns" aria-hidden="true"><span>{t('User')}</span><span>{t('Devices')}</span><span>{t('Last active')}</span><span>{t('Status')}</span></div>
        {(data.items as Account[]).map(account => <div className="owner-account" key={account.id}>
          <div className="owner-account-row"><div className="owner-person"><span className="owner-avatar">{account.fullName.slice(0, 1).toUpperCase()}</span><div><strong>{account.fullName}</strong><span>{account.email}</span></div></div>
            <button type="button" className={`owner-device-button ${account.deviceCount > 1 ? 'is-multiple' : ''}`} aria-expanded={selected === account.id} aria-controls={`devices-${account.id}`} aria-label={`${t(selected === account.id ? 'Hide devices' : 'View devices')}: ${account.email}`} onClick={() => { setDevices(null); setSelected(selected === account.id ? null : account.id) }}><Monitor size={16} />{t('{count} devices', { count: account.deviceCount })}{selected === account.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button>
            <time className="owner-account-time" dateTime={account.lastSeenAt}>{date(account.lastSeenAt)}</time><span className={`owner-presence ${account.onlineDevices ? 'is-online' : ''}`}>{account.onlineDevices ? t('{count} online', { count: account.onlineDevices }) : t('Offline')}</span>
          </div>
          {selected === account.id && <div id={`devices-${account.id}`} className="owner-device-list">
            {deviceError ? <div role="alert">{t('Could not load devices.')} <button type="button" className="owner-secondary" onClick={() => setTick(value => value + 1)}>{t('Retry')}</button></div> : !devices ? <p role="status">{t('Loading data…')}</p> : devices.map(device => <div key={device.deviceId} className="owner-device"><div className="owner-device-title"><DeviceIcon type={device.deviceType} /><strong>{typeLabel(device.deviceType)} · {t(device.browser)} / {t(device.os)}</strong><span className={`owner-presence ${device.online ? 'is-online' : ''}`}>{t(device.online ? 'Online now' : 'Offline')}</span></div><dl><div><dt>{t('First seen')}</dt><dd>{date(device.firstSeenAt)}</dd></div><div><dt>{t('Last active')}</dt><dd>{date(device.lastSeenAt)}</dd></div><div><dt>{t('IP address')}</dt><dd>{device.ipAddress ?? '—'}</dd></div></dl></div>)}
          </div>}
        </div>)}
      </>}
      {data?.view === 'history' && view === 'history' && <div className="owner-history-list">{(data.items as Entry[]).map(entry => <div className="owner-history-row" key={entry.id}><div className="owner-person"><span className="owner-avatar"><DeviceIcon type={entry.deviceType} /></span><div><strong>{entry.user.fullName}</strong><span>{entry.user.email}</span></div></div><div className="owner-history-device"><strong>{typeLabel(entry.deviceType)} · {t(entry.browser)} / {t(entry.os)}</strong><span>{t('IP address')}: {entry.ipAddress ?? '—'}</span></div><span className="owner-method">{method(entry.method)}</span><time dateTime={entry.loginAt}><small>{t('Signed in at')}</small>{date(entry.loginAt)}</time></div>)}</div>}
      {data?.items.length === 0 && <div className="owner-empty"><History size={30} /><strong>{t(data.trackingSince ? 'No matching activity' : 'No activity yet')}</strong><p>{t(data.trackingSince ? 'Try a different search or filter.' : 'New sign-ins and active sessions will appear here automatically.')}</p></div>}
    </div>
    {data && <div className="owner-activity-footer"><span>{t('{count} results', { count: data.total })} · {t('Updated {time}', { time: new Intl.DateTimeFormat(locale, { timeStyle: 'short', timeZone: 'Asia/Tashkent' }).format(new Date(data.updatedAt)) })}</span><div><button type="button" disabled={page <= 1 || loading} onClick={() => setPage(value => value - 1)}>{t('Previous')}</button><span>{page} / {maxPage}</span><button type="button" disabled={page >= maxPage || loading} onClick={() => setPage(value => value + 1)}>{t('Next')}</button></div></div>}
    <div className="owner-activity-explanation"><p>{t('One device means one browser profile. Another browser, incognito mode or cleared storage can count as a new device; this does not identify individual people.')}</p>{data?.trackingSince && <p>{t('Tracking since {date}. Earlier sign-ins are not available.', { date: date(data.trackingSince) })} {t('Existing sessions show when tracking began, not the original sign-in time.')}</p>}</div>
  </section>
}
