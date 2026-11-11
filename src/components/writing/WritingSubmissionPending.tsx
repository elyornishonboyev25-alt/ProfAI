import { BrainCircuit, CheckCircle2, CloudUpload, RefreshCw } from 'lucide-react'
import { useCopy } from '@/i18n/interface'
import type { WritingProgress } from '@/services/writingSubmissionClient'
import '@/styles/assessment-studio.css'

export default function WritingSubmissionPending({ progress, onLeave }: { progress: WritingProgress; onLeave: () => void }) {
  const { language } = useCopy()
  const t = (en: string, uz: string, ru: string) => language.startsWith('uz') ? uz : language.startsWith('ru') ? ru : en
  const processing = progress.stage === 'processing'
  const reconnecting = progress.stage === 'reconnecting'
  const title = processing ? t('Reviewing your Writing', 'Writing javobingiz tekshirilmoqda', 'Проверяем ваш Writing')
    : progress.saved ? t('Your Writing is safely saved', 'Writing javobingiz saqlandi', 'Ваш Writing сохранён')
    : t('Saving your Writing', 'Writing javobingiz saqlanmoqda', 'Сохраняем ваш Writing')
  const description = processing
    ? t('Checking all four IELTS criteria, your corrections and a separate score for the corrected text.', 'IELTSning to‘rtta mezoni, xatolar va tuzatilgan matn uchun alohida baho tekshirilmoqda.', 'Проверяем четыре критерия IELTS, исправления и отдельно оцениваем исправленный текст.')
    : reconnecting ? progress.saved
      ? t('Reconnecting automatically. Your submitted work remains saved on your account.', 'Aloqa avtomatik tiklanmoqda. Yuborgan matningiz akkauntingizda saqlangan.', 'Восстанавливаем связь. Отправленный текст сохранён в вашем аккаунте.')
      : t('Reconnecting automatically. Keep this page open until your submission is confirmed.', 'Aloqa avtomatik tiklanmoqda. Saqlash tasdiqlanguncha shu sahifani ochiq qoldiring.', 'Восстанавливаем связь. Дождитесь подтверждения отправки на этой странице.')
    : progress.saved ? t('Assessment is queued and will continue automatically. You can return to this test to see the result.', 'Tekshiruv navbatda va avtomatik davom etadi. Natijani ko‘rish uchun shu testga qaytishingiz mumkin.', 'Проверка в очереди и продолжится автоматически. Вернитесь к этому тесту, чтобы увидеть результат.')
    : t('Your original answer is being submitted securely.', 'Asl javobingiz xavfsiz yuborilmoqda.', 'Безопасно отправляем ваш исходный ответ.')
  const Icon = processing ? BrainCircuit : reconnecting ? RefreshCw : progress.saved ? CheckCircle2 : CloudUpload
  return <div className="flex min-h-[65vh] items-center justify-center px-5 py-10"><section className="assessment-studio w-full max-w-lg p-7 text-center sm:p-10" role="status" aria-live="polite">
    <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-white bg-gradient-to-br from-white to-slate-200 text-red-700 shadow-sm"><Icon size={28} /></span>
    <h1 className="mt-6 text-2xl font-bold tracking-tight">{title}</h1><p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
    <div className="mt-6 flex justify-center"><span className="h-5 w-5 animate-spin rounded-full border-2 border-red-200 border-t-red-700 motion-reduce:animate-none" aria-hidden="true" /></div>
    {progress.saved && <button type="button" className="assessment-secondary mx-auto mt-7" onClick={onLeave}>{t('Return to tests', 'Testlarga qaytish', 'Вернуться к тестам')}</button>}
  </section></div>
}
