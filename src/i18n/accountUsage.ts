const messages = {
  en: {
    checking: 'Checking account access...',
    blocked: 'Your account is active on another device',
    explanation: 'You can sign in on up to 3 devices, but only one device can use the account at a time. Sign out on the other device, or close the site there and wait up to 2 minutes.',
    unavailable: 'Could not verify account access',
    reconnect: 'Check your connection and try again. Your session and saved work are kept.',
    retry: 'Try again',
    logout: 'Sign out',
  },
  uz: {
    checking: 'Akkauntga kirish tekshirilmoqda...',
    blocked: 'Akkauntingiz boshqa qurilmada ishlatilmoqda',
    explanation: 'Akkauntga jami 3 ta qurilma kirishi mumkin, lekin bir vaqtda faqat bittasi ishlaydi. Boshqa qurilmada akkauntdan chiqing yoki saytni yopib, 2 daqiqagacha kuting.',
    unavailable: 'Akkauntga kirishni tekshirib bo‘lmadi',
    reconnect: 'Internet aloqasini tekshirib, qayta urinib ko‘ring. Seansingiz va saqlangan ishlaringiz saqlanadi.',
    retry: 'Qayta urinish',
    logout: 'Akkauntdan chiqish',
  },
  ru: {
    checking: 'Проверяем доступ к аккаунту...',
    blocked: 'Аккаунт используется на другом устройстве',
    explanation: 'В аккаунт можно войти на 3 устройствах, но пользоваться им одновременно можно только на одном. Выйдите из аккаунта на другом устройстве или закройте там сайт и подождите до 2 минут.',
    unavailable: 'Не удалось проверить доступ к аккаунту',
    reconnect: 'Проверьте подключение и повторите попытку. Сеанс и сохранённые работы сохраняются.',
    retry: 'Повторить',
    logout: 'Выйти',
  },
}

export function accountUsageText(language: string) {
  return messages[language.startsWith('uz') ? 'uz' : language.startsWith('ru') ? 'ru' : 'en']
}
