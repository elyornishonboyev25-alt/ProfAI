import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Trash2 } from 'lucide-react'
import { compressCoverToDataUrl } from '@/utils/imageCompress'
import { learningCenterApi } from './api'
import { CenterPageHeading, CenterPanel, inputClass, primaryButton, secondaryButton } from './components'
import type { CenterWorkspace } from './types'

export default function SettingsView({ workspace, onSaved }: { workspace: CenterWorkspace; onSaved: () => void }) {
  const navigate = useNavigate()
  const [name, setName] = useState(workspace.name)
  const [city, setCity] = useState(workspace.city || '')
  const [coverUrl, setCoverUrl] = useState(workspace.coverUrl)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  async function save(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return
    setBusy(true); setError(''); setSaved(false)
    try {
      await learningCenterApi.updateWorkspace(workspace.slug, { name: name.trim(), city: city.trim() || null, coverUrl })
      setSaved(true); onSaved()
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not save settings.') }
    finally { setBusy(false) }
  }

  async function remove() {
    if (busy) return
    setBusy(true); setError('')
    try { await learningCenterApi.deleteWorkspace(workspace.slug); navigate('/learning-center', { replace: true }) }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not delete class.'); setBusy(false) }
  }

  return <div className="space-y-6"><CenterPageHeading eyebrow="Owner controls" title="Class settings" description="Update your class details and cover photo." /><CenterPanel className="max-w-3xl p-6"><form onSubmit={save} className="space-y-5"><label className="block"><span className="mb-2 block text-sm font-bold">Class name</span><input required minLength={3} maxLength={120} className={inputClass} value={name} onChange={(event) => setName(event.target.value)} /></label><label className="block"><span className="mb-2 block text-sm font-bold">City</span><input maxLength={100} className={inputClass} value={city} onChange={(event) => setCity(event.target.value)} /></label><label className="block"><span className="mb-2 block text-sm font-bold">Cover photo</span><span className="lc-cover-picker">{coverUrl ? <img src={coverUrl} alt="Class cover preview" /> : <><Camera className="h-6 w-6" /> Choose a photo</>}</span><input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) void compressCoverToDataUrl(file).then(setCoverUrl).catch((failure) => setError(failure.message)) }} /></label>{coverUrl && <button type="button" onClick={() => setCoverUrl(null)} className="text-sm font-semibold text-red-700">Remove photo</button>}{error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{saved && <p role="status" className="text-sm font-semibold text-emerald-700">Settings saved.</p>}<button disabled={busy} className={primaryButton}>{busy ? 'Saving...' : 'Save changes'}</button></form></CenterPanel><CenterPanel className="max-w-3xl border-red-100 p-6"><h2 className="text-lg font-bold text-slate-950">Delete class</h2><p className="mt-2 text-sm text-slate-500">This removes the class, its groups, assignments and member access permanently.</p>{confirmDelete ? <div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" disabled={busy} onClick={() => void remove()} className={primaryButton}><Trash2 className="h-4 w-4" />{busy ? 'Deleting...' : 'Yes, delete class'}</button><button type="button" disabled={busy} onClick={() => setConfirmDelete(false)} className={secondaryButton}>Cancel</button></div> : <button type="button" onClick={() => setConfirmDelete(true)} className={`${secondaryButton} mt-5 text-red-700`}><Trash2 className="h-4 w-4" /> Delete class</button>}</CenterPanel></div>
}
