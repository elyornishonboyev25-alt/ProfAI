import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/apiClient'
import { ownerText, type OwnerLanguage } from '@/i18n/owner'
import ReportConversation from './ReportConversation'

export default function UserReportReply({ notificationId, language }: { notificationId: string; language: OwnerLanguage }) {
  const t = (text: string) => ownerText(text, language)
  const [reports, setReports] = useState<Array<{ id: string; description: string }> | null>(null)
  const [selected, setSelected] = useState('')
  const [error, setError] = useState(false)
  const [reload, setReload] = useState(0)
  useEffect(() => {
    let active = true
    setError(false)
    void apiClient.get<{ items: Array<{ id: string; description: string }> }>(`/support/notifications/${encodeURIComponent(notificationId)}/reports`)
      .then(result => { if (active) { setReports(result.items); setSelected(result.items[0]?.id ?? '') } })
      .catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [notificationId, reload])
  if (error) return <div role="alert" className="mt-3 text-xs text-red-700">{t('Could not load replies.')} <button type="button" onClick={() => setReload(value => value + 1)} className="min-h-9 underline">{t('Refresh')}</button></div>
  if (!reports) return <p role="status" className="mt-3 text-xs text-slate-500">{t('Loading replies...')}</p>
  if (!reports.length) return <p className="mt-3 text-xs text-slate-500">{t('This report is no longer available.')}</p>
  return <div>
    {reports.length > 1 && <label className="mt-3 block text-xs font-bold text-slate-700">{t('Choose the report to reply to')}<select value={selected} onChange={event => setSelected(event.target.value)} className="mt-2 w-full min-w-0 rounded-lg border border-slate-200 bg-white p-2 text-sm">{reports.map((report, index) => <option key={report.id} value={report.id}>{index + 1}. {report.description.slice(0, 100)}</option>)}</select></label>}
    <ReportConversation key={selected} reportId={selected} language={language} />
  </div>
}
