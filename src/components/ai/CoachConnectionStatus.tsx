import { useEffect, useState } from 'react'
import { PlugZap, RotateCcw } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import { useAuthStore } from '@/store/authStore'
import { useCopy } from '@/i18n/interface'

export default function CoachConnectionStatus() {
  const { language } = useCopy()
  const userId = useAuthStore((state) => state.user?.id)
  const [ready, setReady] = useState<boolean | null>(null)
  const [failed, setFailed] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    if (!userId) return
    const controller = new AbortController()
    setReady(null); setFailed(false)
    void apiClient.get<{ textChat?: boolean }>('/ai/voice/capabilities', { signal: controller.signal })
      .then((result) => { if (!controller.signal.aborted) setReady(result.textChat ?? true) })
      .catch(() => { if (!controller.signal.aborted) setFailed(true) })
    return () => controller.abort()
  }, [userId, retry])
  if (ready !== false && !failed) return null
  const text = language.startsWith('uz')
    ? { unavailable: 'Tutor hali ulanmagan. O‘quv muhiti tayyor; suhbat xizmat yoqilgach ishlaydi.', failed: 'Tutor ulanishini tekshirib bo‘lmadi.', retry: 'Qayta tekshirish' }
    : language.startsWith('ru')
      ? { unavailable: 'Наставник ещё не подключён. Учебная среда готова; разговор заработает после подключения сервиса.', failed: 'Не удалось проверить соединение с наставником.', retry: 'Проверить снова' }
      : { unavailable: 'Your tutor is not connected yet. The studio is ready; conversations will work once the service is connected.', failed: 'Could not check the tutor connection.', retry: 'Check again' }
  return <div role="status" className="coach-connection-status"><PlugZap size={16}/><p>{failed ? text.failed : text.unavailable}</p><button type="button" onClick={() => setRetry((value) => value + 1)}><RotateCcw size={13}/>{text.retry}</button></div>
}
