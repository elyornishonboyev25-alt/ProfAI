import { useTranslation } from 'react-i18next'
export function useBillingText() {
  const { i18n } = useTranslation()
  const language = (i18n.resolvedLanguage ?? i18n.language ?? 'en').slice(0, 2)
  return (en: string, uz: string, ru: string) => language === 'uz' ? uz : language === 'ru' ? ru : en
}
