import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
import { BrandMark } from '@/components/brand/BrandLogo'
import { learningCenterApi } from '@/features/learningCenter/api'
import { primaryButton } from '@/features/learningCenter/components'

export default function LearningCenterJoin() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading')
  const [message, setMessage] = useState('Connecting your ProfAI account securely...')
  useEffect(() => { void learningCenterApi.join(code).then((response) => { setState('done'); setMessage(`You are now connected to ${response.workspace.name}.`); window.setTimeout(() => navigate(`/learning-center/${response.workspace.slug}`), 1200) }).catch((error) => { setState('error'); setMessage(error instanceof Error ? error.message : 'This invitation could not be accepted.') }) }, [code, navigate])
  return <div className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#dbeafe,#f8fafc_44%)] p-4"><div className="w-full max-w-md rounded-[2rem] border border-white bg-white/90 p-8 text-center shadow-[0_30px_90px_rgba(30,64,175,.18)] backdrop-blur-xl"><BrandMark size={58} className="mx-auto" />{state === 'loading' ? <Loader2 className="mx-auto mt-6 h-9 w-9 animate-spin text-blue-600" /> : state === 'done' ? <CheckCircle2 className="mx-auto mt-6 h-10 w-10 text-emerald-600" /> : <ShieldCheck className="mx-auto mt-6 h-10 w-10 text-red-600" />}<h1 className="mt-5 text-2xl font-black tracking-[-.04em] text-slate-950">{state === 'loading' ? 'Joining learning center' : state === 'done' ? 'Welcome to the workspace' : 'Invitation unavailable'}</h1><p className="mt-3 text-sm leading-6 text-slate-500">{message}</p>{state === 'error' ? <button type="button" onClick={() => navigate('/learning-center')} className={`${primaryButton} mt-6`}>Return to Learning Centers</button> : null}</div></div>
}
