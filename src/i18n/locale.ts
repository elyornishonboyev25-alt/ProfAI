import i18n from 'i18next'

/** Locale for interface dates and numbers. Source exam material keeps its own formatting. */
export function interfaceLocale() {
  const language = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0]
  return language === 'uz' ? 'uz-UZ' : language === 'ru' ? 'ru-RU' : 'en-GB'
}
