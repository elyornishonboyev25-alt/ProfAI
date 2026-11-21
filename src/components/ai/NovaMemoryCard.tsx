import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import type { AiMemoryItem } from '@/store/aiAssistantStore'
import { useCopy } from '@/i18n/interface'

export default function NovaMemoryCard({ memory, onSave, onDelete }: {
  memory: AiMemoryItem; onSave: (id: string, value: string, revision: number) => Promise<unknown>; onDelete: (id: string) => Promise<unknown>
}) {
  const { language } = useCopy()
  const t = (en: string, uz: string, ru: string) => language === 'uz' ? uz : language === 'ru' ? ru : en
  const labels: Record<string, string> = {
    address_preference: t('How Nova addresses you', 'Nova sizga qanday murojaat qiladi', 'Как Nova к вам обращается'),
    preferred_address: t('How Nova addresses you', 'Nova sizga qanday murojaat qiladi', 'Как Nova к вам обращается'),
    humor_preference: t('Humour preference', 'Hazil afzalligi', 'Предпочтения в юморе'),
    explanation_preference: t('Explanation style', 'Tushuntirish uslubi', 'Стиль объяснений'),
    ielts_target_score: t('IELTS goal', 'IELTS maqsadi', 'Цель IELTS'),
    sat_target_score: t('SAT goal', 'SAT maqsadi', 'Цель SAT'),
    preferred_name: t('Preferred name', 'Murojaat uchun ism', 'Предпочитаемое имя'),
  }
  const label = labels[memory.key] ?? (memory.category === 'goal' ? t('Study goal', 'O‘quv maqsadi', 'Учебная цель') : t('Remembered note', 'Saqlangan qayd', 'Сохранённая заметка'))
  const [editing, setEditing] = useState(false), [value, setValue] = useState(memory.value)
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  const run = async (action: () => Promise<unknown>) => {
    setBusy(true); setError('')
    try { await action(); setEditing(false) }
    catch { setError(t('Could not save this change. Your memory is still shown. Reload if it was edited elsewhere.', 'O‘zgarish saqlanmadi. Xotira ko‘rinib turibdi. Boshqa joyda tahrirlangan bo‘lsa, qayta yuklang.', 'Изменение не сохранено. Запись остаётся видимой. Обновите страницу, если её изменили в другом месте.')) }
    finally { setBusy(false) }
  }
  return <article className="nova-memory-card rounded-xl border border-slate-200 bg-white p-3" data-memory-id={memory.id}>
    <p className="text-xs font-semibold text-slate-700">{label}</p>
    {editing ? <form onSubmit={event => { event.preventDefault(); void run(() => onSave(memory.id, value.trim(), memory.revision ?? 1)) }}>
      <textarea autoFocus aria-label={t('Memory value', 'Xotira matni', 'Текст записи')} value={value} maxLength={600} onChange={event => setValue(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 p-2 text-sm"/>
      <div className="mt-2 flex gap-2"><button disabled={busy || !value.trim()} className="min-h-10 rounded-lg bg-red-700 px-3 text-xs text-white">{t('Save', 'Saqlash', 'Сохранить')}</button><button type="button" disabled={busy} onClick={() => { setEditing(false); setValue(memory.value) }} className="min-h-10 px-3 text-xs">{t('Cancel', 'Bekor qilish', 'Отмена')}</button></div>
    </form> : <p className="mt-1 text-xs leading-5 text-slate-700">{memory.value}</p>}
    <p className="mt-2 text-[10px] text-slate-500">{memory.origin === 'legacy' || !memory.origin ? t('Earlier saved record', 'Avvalgi saqlangan yozuv', 'Ранее сохранённая запись') : memory.origin === 'model' ? t('System observation', 'Tizim kuzatuvi', 'Наблюдение системы') : t('Shared by you', 'Siz aytgansiz', 'Сообщено вами')} · {new Date(memory.updatedAt).toLocaleDateString(language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-GB')}</p>
    {!editing && <div className="mt-2 flex gap-1">
      <button type="button" disabled={busy} onClick={() => { setValue(memory.value); setEditing(true) }} className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-xs text-slate-600"><Pencil size={13}/>{t('Edit', 'Tahrirlash', 'Изменить')}</button>
      <button type="button" disabled={busy} onClick={() => { if (window.confirm(t('Delete this memory?', 'Bu xotira o‘chirilsinmi?', 'Удалить эту запись?'))) void run(() => onDelete(memory.id)) }} className="inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-xs text-red-700"><Trash2 size={13}/>{t('Delete', 'O‘chirish', 'Удалить')}</button>
    </div>}
    {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
  </article>
}
