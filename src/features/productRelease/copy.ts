const copy = {
  en: {
    sentence: 'Meet the updated Nova, your English coach with a sense of humour.',
    action: 'Try Nova', close: 'Close announcement', illustration: 'Nova, your smiling silver and red study companion',
  },
  uz: {
    sentence: 'Nova yangilandi: ingliz tilini hazil aralash birga o‘rganamiz!',
    action: 'Novani sinab ko‘rish', close: 'E’lonni yopish', illustration: 'Nova, sizning quvnoq kumush va qizil rangli o‘quv hamrohingiz',
  },
  ru: {
    sentence: 'Обновлённая Nova поможет учить английский с улыбкой и чувством юмора.',
    action: 'Попробовать Nova', close: 'Закрыть объявление', illustration: 'Nova, ваш улыбчивый серебристо-красный помощник в учёбе',
  },
}

export function novaReleaseCopy(language: string) {
  return copy[language.slice(0, 2) as keyof typeof copy] ?? copy.en
}
