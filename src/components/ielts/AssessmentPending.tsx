import { useEffect, useState } from 'react'
import { BrainCircuit, ShieldCheck } from 'lucide-react'
import { useCopy } from '@/i18n/interface'
import '@/styles/assessment-studio.css'

export default function AssessmentPending({ mode = 'writing' }: { mode?: 'writing' | 'speaking' }) {
  const { language } = useCopy()
  const t = (en: string, uz: string, ru: string) => language.startsWith('uz') ? uz : language.startsWith('ru') ? ru : en
  const [started] = useState(Date.now)
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => { const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - started) / 1000)), 1000); return () => window.clearInterval(timer) }, [started])
  return <div className="flex min-h-[65vh] items-center justify-center px-5 py-10"><section className="assessment-studio w-full max-w-lg p-7 text-center sm:p-10" role="status">
    <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-white bg-gradient-to-br from-white to-slate-200 text-red-700 shadow-sm"><BrainCircuit size={28} /></span>
    <h1 className="mt-6 text-2xl font-bold tracking-tight">{t(`Reviewing your ${mode}`, `${mode === 'writing' ? 'Writing' : 'Speaking'} javobingiz tekshirilmoqda`, `Анализируем ${mode === 'writing' ? 'Writing' : 'Speaking'}`)}</h1>
    <p className="mt-3 text-sm leading-7 text-slate-600">{mode === 'writing' ? t('Your original response is assessed against all four IELTS criteria. The corrected text receives a separate assessment using the same task.', 'Asl javobingiz IELTSning to‘rtta mezoni bo‘yicha tekshiriladi. Tuzatilgan matn ham shu vazifa asosida mustaqil baholanadi.', 'Исходный ответ проверяется по четырём критериям IELTS. Исправленный текст оценивается отдельно по тому же заданию.') : t('Your recordings and answers are being checked against the four IELTS criteria, with evidence for your feedback.', 'Audio va javoblaringiz IELTSning to‘rtta mezoni bo‘yicha, dalillar asosida tekshirilmoqda.', 'Записи и ответы проверяются по четырём критериям IELTS с конкретными примерами.')}</p>
    <div className="mt-6 flex items-center justify-center gap-3 text-sm font-semibold text-red-700"><span className="h-4 w-4 animate-spin rounded-full border-2 border-red-200 border-t-red-700 motion-reduce:animate-none" aria-hidden="true" /><span aria-hidden="true">{elapsed}s</span><span>{t('Deep assessment', 'Chuqur tahlil', 'Подробный анализ')}</span></div>
    <p className="mt-3 text-xs leading-6 text-slate-500">{elapsed < 50 ? t('Allow around 35–50 seconds; longer responses may take more time.', 'Taxminan 35–50 soniya kuting; uzun javoblar ko‘proq vaqt olishi mumkin.', 'Обычно около 35–50 секунд; длинные ответы могут потребовать больше времени.') : t('Still working. Provider response times vary; your answers are saved.', 'Tahlil davom etmoqda. Xizmat tezligi turlicha bo‘lishi mumkin; javoblaringiz saqlangan.', 'Анализ продолжается. Время зависит от сервиса; ответы сохранены.')}</p>
    <p className="mt-6 inline-flex items-center gap-2 text-xs text-slate-500"><ShieldCheck size={14} />{t('Your original work stays saved', 'Asl javobingiz saqlanadi', 'Исходный ответ сохранён')}</p>
  </section></div>
}
