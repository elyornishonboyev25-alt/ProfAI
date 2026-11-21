import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { useCopy } from '@/i18n/interface'

type Skill = { topicKey: string; topic: string; status: string; confidence: number; evidenceCount: number; independentAttempts: number; nextExercise?: string | null; lastPractice: { quote: string; assistance: string; observedAt: string } }
export default function NovaLearningNotes({ userId, onPractice }: { userId: string; onPractice: (text: string) => void }) {
  const { language } = useCopy()
  const t = (en: string, uz: string, ru: string) => language === 'uz' ? uz : language === 'ru' ? ru : en
  const [items, setItems] = useState<Skill[]>([]), [error, setError] = useState(false), [loading, setLoading] = useState(true), [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setItems([]); setLoading(true); setError(false)
    void apiClient.get<{ items: Skill[] }>('/ai-workspace/skills', { signal: controller.signal }).then(result => {
      if (!controller.signal.aborted && useAuthStore.getState().user?.id === userId) setItems(result.items)
    }).catch(() => { if (!controller.signal.aborted) setError(true) }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [userId, retry])
  return <section className="mt-4 border-t border-slate-200 pt-4" aria-label={t('Learning notes', 'Mashq kuzatuvlari', 'Заметки об учёбе')}>
    <h3 className="text-sm font-semibold">{t('Learning notes', 'Mashq kuzatuvlari', 'Заметки об учёбе')}</h3>
    <p className="mt-1 text-xs text-slate-500">{t('Based on your practice, not an official score.', 'Mashqlaringizga asoslangan; rasmiy baho emas.', 'На основе ваших упражнений, не официальный балл.')}</p>
    {loading ? <p className="mt-3 text-xs">{t('Loading…', 'Yuklanmoqda…', 'Загрузка…')}</p> : error ? <button className="mt-3 min-h-10 text-xs underline" onClick={() => setRetry(value => value + 1)}>{t('Retry loading notes', 'Kuzatuvlarni qayta yuklash', 'Загрузить заметки повторно')}</button> : !items.length ? <p className="mt-3 text-xs text-slate-500">{t('Your practice attempts will appear here.', 'Mashq urinishlaringiz shu yerda ko‘rinadi.', 'Здесь появятся ваши попытки выполнения упражнений.')}</p> : items.slice(0, 8).map(skill => <article key={skill.topicKey} className="mt-3 rounded-lg bg-slate-50 p-3">
      <h4 className="text-xs font-semibold">{skill.topic}</h4>
      <p className="mt-1 text-xs text-slate-600">{skill.status === 'consistent' ? t('Consistent recent practice', 'Oxirgi mashqlarda barqaror natija', 'Стабильные последние попытки') : skill.status === 'needs_practice' ? t('A recurring error to revisit', 'Takrorlangan xatoni qayta ko‘rib chiqamiz', 'Вернёмся к повторяющейся ошибке') : t('Still gathering evidence', 'Hali dalil to‘playapmiz', 'Пока собираем наблюдения')}</p>
      <p className="mt-1 text-[11px] text-slate-500">{t('Attempts', 'Urinishlar', 'Попытки')}: {skill.evidenceCount}; {t('independent', 'mustaqil', 'самостоятельно')}: {skill.independentAttempts}</p>
      <blockquote className="mt-2 text-xs italic text-slate-600">“{skill.lastPractice.quote}”</blockquote>
      {skill.nextExercise && <button type="button" className="mt-2 min-h-10 text-xs text-red-700 underline" onClick={() => onPractice(skill.nextExercise!)}>{t('Try the next exercise', 'Keyingi mashqni bajarish', 'Попробовать следующее упражнение')}</button>}
    </article>)}
  </section>
}
