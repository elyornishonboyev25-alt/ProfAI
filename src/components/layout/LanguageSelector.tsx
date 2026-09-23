import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function LanguageSelector() {
  const { i18n } = useTranslation()
  return <label className="liquid-language">
    <Languages size={16} aria-hidden="true" />
    <span className="sr-only">{i18n.language === 'ru' ? 'Язык интерфейса' : 'Interface language'}</span>
    <select value={i18n.language === 'ru' ? 'ru' : 'en'} onChange={event => void i18n.changeLanguage(event.target.value)}>
      <option value="en">English</option><option value="ru">Русский</option>
    </select>
  </label>
}
