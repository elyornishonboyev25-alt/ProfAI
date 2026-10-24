const messages = {
  en: {
    checking: 'Checking account access...',
    blocked: 'Your account is open on another device',
    explanation: 'For security, the account can be used on only one device at a time. This device unlocks automatically as soon as the other one stops.',
    activeDevice: 'Device in use now',
    lastActive: 'Last activity',
    nextCheck: 'Checking again in',
    checkingNow: 'Checking...',
    faster: 'To continue sooner, close the site or sign out on the other device.',
    ruleDevices: 'Up to 3 devices can be linked to one account',
    ruleOneAtATime: 'Tests and practice run on one device at a time',
    ruleBrowsers: 'Chrome, Edge and other browsers on one computer count as one device',
    limitTitle: 'Device limit reached',
    limitExplanation: 'This account is already signed in on 3 devices. Sign out on one of them to sign in here.',
    limitHint: 'Lost or replaced a device? On a signed-in device open Profile → Devices and remove it. Devices that stay unused for a long time are released automatically.',
    slots: 'devices',
    unavailable: 'Could not verify account access',
    reconnect: 'Check your connection and try again. Your session and saved work are kept.',
    retry: 'Check now',
    logout: 'Sign out',
    close: 'Got it',
    thisDevice: 'This device',
    devicesTitle: 'Devices',
    devicesLead: 'Devices signed in to your account. All browsers on one computer count as a single device.',
    remove: 'Remove',
    removing: 'Removing...',
    removeConfirm: 'This device will be signed out of your account. Continue?',
    removed: 'Device removed',
    devicesError: 'Could not load your devices.',
    types: { DESKTOP: 'Computer', PHONE: 'Phone', TABLET: 'Tablet' } as Record<string, string>,
  },
  uz: {
    checking: 'Akkauntga kirish tekshirilmoqda...',
    blocked: 'Akkauntingiz hozir boshqa qurilmada ochiq',
    explanation: 'Xavfsizlik uchun akkauntdan bir vaqtning o‘zida faqat bitta qurilmada foydalanish mumkin. U qurilmada ish to‘xtashi bilan bu yer avtomatik ochiladi.',
    activeDevice: 'Hozir ishlayotgan qurilma',
    lastActive: 'Oxirgi faollik',
    nextCheck: 'Qayta tekshiruvgacha',
    checkingNow: 'Tekshirilmoqda...',
    faster: 'Tezroq davom etish uchun boshqa qurilmada saytni yoping yoki akkauntdan chiqing.',
    ruleDevices: 'Bitta akkauntga 3 tagacha qurilma ulash mumkin',
    ruleOneAtATime: 'Test va mashqlar bir vaqtda faqat bitta qurilmada ishlaydi',
    ruleBrowsers: 'Bitta kompyuterdagi Chrome, Edge va boshqa brauzerlar bitta qurilma hisoblanadi',
    limitTitle: 'Qurilmalar limiti to‘ldi',
    limitExplanation: 'Bu akkauntga allaqachon 3 ta qurilmadan kirilgan. Shu qurilmadan kirish uchun ulardan birida akkauntdan chiqing.',
    limitHint: 'Qurilma yo‘qolgan yoki almashtirilganmi? Akkaunt ochiq qurilmada Profil → Qurilmalar bo‘limidan uni o‘chiring. Uzoq vaqt ishlatilmagan qurilma o‘zi bo‘shaydi.',
    slots: 'qurilma',
    unavailable: 'Akkauntga kirishni tekshirib bo‘lmadi',
    reconnect: 'Internet aloqasini tekshirib, qayta urinib ko‘ring. Seansingiz va saqlangan ishlaringiz saqlanadi.',
    retry: 'Hozir tekshirish',
    logout: 'Akkauntdan chiqish',
    close: 'Tushunarli',
    thisDevice: 'Shu qurilma',
    devicesTitle: 'Qurilmalar',
    devicesLead: 'Akkauntingizga kirgan qurilmalar. Bitta kompyuterdagi barcha brauzerlar bitta qurilma hisoblanadi.',
    remove: 'Chiqarish',
    removing: 'Chiqarilmoqda...',
    removeConfirm: 'Bu qurilmadan akkauntingiz chiqariladi. Davom etasizmi?',
    removed: 'Qurilma chiqarildi',
    devicesError: 'Qurilmalarni yuklab bo‘lmadi.',
    types: { DESKTOP: 'Kompyuter', PHONE: 'Telefon', TABLET: 'Planshet' } as Record<string, string>,
  },
  ru: {
    checking: 'Проверяем доступ к аккаунту...',
    blocked: 'Аккаунт сейчас открыт на другом устройстве',
    explanation: 'В целях безопасности аккаунтом можно пользоваться только на одном устройстве одновременно. Это устройство откроется автоматически, как только работа там прекратится.',
    activeDevice: 'Сейчас используется',
    lastActive: 'Последняя активность',
    nextCheck: 'Повторная проверка через',
    checkingNow: 'Проверяем...',
    faster: 'Чтобы продолжить быстрее, закройте сайт или выйдите из аккаунта на другом устройстве.',
    ruleDevices: 'К одному аккаунту можно подключить до 3 устройств',
    ruleOneAtATime: 'Тесты и практика работают только на одном устройстве одновременно',
    ruleBrowsers: 'Chrome, Edge и другие браузеры на одном компьютере считаются одним устройством',
    limitTitle: 'Достигнут лимит устройств',
    limitExplanation: 'В этот аккаунт уже вошли с 3 устройств. Чтобы войти здесь, выйдите из аккаунта на одном из них.',
    limitHint: 'Устройство потеряно или заменено? На устройстве, где выполнен вход, откройте Профиль → Устройства и удалите его. Давно не используемые устройства освобождаются автоматически.',
    slots: 'устройства',
    unavailable: 'Не удалось проверить доступ к аккаунту',
    reconnect: 'Проверьте подключение и повторите попытку. Сеанс и сохранённые работы сохраняются.',
    retry: 'Проверить сейчас',
    logout: 'Выйти',
    close: 'Понятно',
    thisDevice: 'Это устройство',
    devicesTitle: 'Устройства',
    devicesLead: 'Устройства, на которых выполнен вход. Все браузеры на одном компьютере считаются одним устройством.',
    remove: 'Удалить',
    removing: 'Удаляем...',
    removeConfirm: 'На этом устройстве будет выполнен выход из аккаунта. Продолжить?',
    removed: 'Устройство удалено',
    devicesError: 'Не удалось загрузить устройства.',
    types: { DESKTOP: 'Компьютер', PHONE: 'Телефон', TABLET: 'Планшет' } as Record<string, string>,
  },
}

export type AccountUsageText = typeof messages.en

export function accountUsageText(language: string): AccountUsageText {
  return messages[language.startsWith('uz') ? 'uz' : language.startsWith('ru') ? 'ru' : 'en']
}

const UZ_UNITS: Partial<Record<Intl.RelativeTimeFormatUnit, string>> = { minute: 'daqiqa', hour: 'soat', day: 'kun', month: 'oy', year: 'yil' }
const JUST_NOW = { uz: 'hozirgina', ru: 'только что', en: 'just now' }

/** "5 minutes ago". Browsers lack Uzbek relative-time data, so it is spelled out here. */
export function relativeTime(value: string | Date | undefined, language: string) {
  if (!value) return ''
  const seconds = Math.round((Date.now() - new Date(value).getTime()) / 1000)
  if (!Number.isFinite(seconds)) return ''
  const locale = language.startsWith('uz') ? 'uz' : language.startsWith('ru') ? 'ru' : 'en'
  if (seconds < 60) return JUST_NOW[locale]
  const steps: Array<[Intl.RelativeTimeFormatUnit, number]> = [['minute', 60], ['hour', 24], ['day', 30], ['month', 12], ['year', Infinity]]
  let amount = Math.floor(seconds / 60)
  for (const [unit, size] of steps) {
    if (amount < size) {
      if (locale === 'uz') return `${amount} ${UZ_UNITS[unit]} oldin`
      try { return new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-amount, unit) } catch { return '' }
    }
    amount = Math.floor(amount / size)
  }
  return ''
}
