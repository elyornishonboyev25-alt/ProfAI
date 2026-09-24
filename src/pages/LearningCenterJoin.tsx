import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowRight, Loader2, ShieldCheck } from 'lucide-react'
import { BrandMark } from '@/components/brand/BrandLogo'
import { learningCenterApi } from '@/features/learningCenter/api'
import { primaryButton, secondaryButton } from '@/features/learningCenter/components'
import '@/features/learningCenter/learning-center.css'

export default function LearningCenterJoin() {
  const { code = '' } = useParams()
  return <JoinInvitation key={code} code={code} />
}

function JoinInvitation({ code }: { code: string }) {
  const navigate = useNavigate()
  const pending = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function accept() {
    if (pending.current) return
    pending.current = true
    setBusy(true); setError('')
    try {
      const response = await learningCenterApi.join(code)
      navigate('/learning-center/' + response.workspace.slug, { replace: true })
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'This invitation could not be accepted.')
    } finally { pending.current = false; setBusy(false) }
  }
  return <div className="learning-center lc-portal grid min-h-screen place-items-center p-4"><div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-blue-900/5"><BrandMark size={54} className="mx-auto" /><span className="mx-auto mt-7 grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600"><ShieldCheck className="h-7 w-7" /></span><h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-950">Your team is one step away</h1><p className="mt-3 text-sm leading-6 text-slate-500">Accept this invitation to connect your ProfAI account to your learning center.</p>{error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<button type="button" disabled={busy || !code} onClick={() => void accept()} className={primaryButton + ' mt-6 w-full'}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}{busy ? 'Joining workspace...' : error ? 'Try again' : 'Accept invitation'}</button><Link to="/learning-center" className={secondaryButton + ' mt-3 w-full'}>Back to Learning Center</Link></div></div>
}
