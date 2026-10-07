import type { PremiumLanguage } from '@/i18n/premium'

const messages = {
  'Teacher notes': ['O‘qituvchi xabarlari', 'Заметки преподавателя'],
  'Student communication': ['O‘quvchi bilan aloqa', 'Связь с учеником'],
  'New notes are sent to this student’s notifications.': ['Yangi yozuvlar shu o‘quvchining bildirishnomalariga yuboriladi.', 'Новые заметки отправляются в уведомления этого ученика.'],
  'Your message': ['Xabaringiz', 'Ваше сообщение'],
  'Write feedback, a reminder or the next step…': ['Fikr, eslatma yoki keyingi vazifani yozing…', 'Напишите отзыв, напоминание или следующий шаг…'],
  'Save note': ['Xabar yuborish', 'Отправить заметку'],
  'Sending…': ['Yuborilmoqda…', 'Отправка…'],
  'Note sent to the student’s notifications.': ['Xabar o‘quvchining bildirishnomalariga yuborildi.', 'Заметка отправлена в уведомления ученика.'],
  'Could not send your note. Your draft is saved here; please try again.': ['Xabar yuborilmadi. Matn saqlanib turibdi, qayta urinib ko‘ring.', 'Не удалось отправить заметку. Текст сохранён здесь; попробуйте ещё раз.'],
  'Write a note with 2 to 2,000 characters.': ['2 dan 2 000 tagacha belgili xabar yozing.', 'Напишите заметку длиной от 2 до 2 000 символов.'],
  'No coaching notes yet.': ['Hozircha xabarlar yo‘q.', 'Пока нет заметок.'],
  'Send a clear next step to help this student progress.': ['O‘quvchiga rivojlanish uchun keyingi qadamni yuboring.', 'Отправьте ученику следующий шаг для прогресса.'],
  'Teacher note': ['O‘qituvchidan xabar', 'Заметка преподавателя'],
  'Class assignment': ['Yangi topshiriq', 'Задание класса'],
  'Read full message': ['To‘liq xabarni o‘qish', 'Прочитать полностью'],
  'Collapse message': ['Xabarni yopish', 'Свернуть сообщение'],
  'Open assignment': ['Topshiriqni ochish', 'Открыть задание'],
  'Notifications': ['Bildirishnomalar', 'Уведомления'],
  'Student inbox': ['O‘quvchi xabarlari', 'Входящие ученика'],
  'Mark all read': ['Barchasini o‘qilgan deb belgilash', 'Прочитать все'],
  'You are all caught up': ['Barcha xabarlar o‘qilgan', 'Все уведомления прочитаны'],
  'Latest updates': ['So‘nggi xabarlar', 'Последние обновления'],
  'No updates yet': ['Hozircha yangi xabarlar yo‘q', 'Пока нет обновлений'],
  'Teacher notes and assignments will appear here.': ['O‘qituvchi xabarlari va topshiriqlar shu yerda ko‘rinadi.', 'Заметки преподавателя и задания появятся здесь.'],
  'Loading notifications…': ['Bildirishnomalar yuklanmoqda…', 'Загрузка уведомлений…'],
  'Notifications could not be refreshed.': ['Bildirishnomalar yangilanmadi.', 'Не удалось обновить уведомления.'],
  'Could not mark notifications as read. Please try again.': ['Xabarlarni o‘qilgan deb belgilab bo‘lmadi. Qayta urinib ko‘ring.', 'Не удалось отметить уведомления прочитанными. Попробуйте ещё раз.'],
  'Try again': ['Qayta urinish', 'Повторить'],
} satisfies Record<string, [string, string]>

export function classText(text: keyof typeof messages, language: PremiumLanguage): string {
  return language === 'uz' ? messages[text][0] : language === 'ru' ? messages[text][1] : text
}
