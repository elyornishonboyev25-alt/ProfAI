// Landing product tour. Every screen uses a real Ivygoo screenshot from
// public/assets/landing; hotspot x/y are percentages of that screenshot.
export type Copy = readonly [en: string, uz: string, ru: string]
export type TourStep = { title: Copy; body: Copy; x: number; y: number }
export type TourFeature = {
  id: string
  label: Copy
  kicker: Copy
  title: Copy
  body: Copy
  image: string
  address: string
  alt: Copy
  float?: { image: string; alt: Copy }
  route: string
  steps: TourStep[]
}

export const tourFeatures: TourFeature[] = [
  {
    id: 'dashboard', route: '/register', image: '/assets/landing/dashboard-ivygoo.jpg', address: 'ivygoo.com/dashboard',
    label: ['Dashboard', 'Boshqaruv paneli', 'Панель'],
    kicker: ['YOUR COMMAND CENTER', 'SIZNING BOSHQARUV MARKAZINGIZ', 'ВАШ ЦЕНТР УПРАВЛЕНИЯ'],
    title: ['See your whole preparation on one screen.', 'Butun tayyorgarligingiz bitta ekranda.', 'Вся подготовка на одном экране.'],
    body: ['Targets, weekly rhythm, scores and rank stay together, so every session starts with a clear next step.', 'Maqsadlar, haftalik ritm, ballar va reyting bir joyda — har bir mashg‘ulot aniq keyingi qadam bilan boshlanadi.', 'Цели, недельный ритм, баллы и рейтинг собраны вместе — каждое занятие начинается с понятного следующего шага.'],
    alt: ['Ivygoo learning dashboard with target progress, weekly activity and leaderboard', 'Maqsad, haftalik faollik va reyting ko‘rsatilgan Ivygoo boshqaruv paneli', 'Панель Ivygoo с прогрессом к цели, недельной активностью и рейтингом'],
    steps: [
      { x: 32, y: 44, title: ['Target ring', 'Maqsad halqasi', 'Кольцо цели'], body: ['See how close you are to your IELTS and SAT goals.', 'IELTS va SAT maqsadingizga qanchalik yaqinligingizni ko‘ring.', 'Видно, насколько вы близки к целям IELTS и SAT.'] },
      { x: 59, y: 48, title: ['Live stats', 'Jonli statistika', 'Живая статистика'], body: ['Study time, completed practice, average score and rank.', 'O‘qish vaqti, bajarilgan mashqlar, o‘rtacha ball va o‘rin.', 'Время занятий, выполненная практика, средний балл и место.'] },
      { x: 59, y: 76, title: ['Weekly rhythm', 'Haftalik ritm', 'Недельный ритм'], body: ['A daily chart shows how consistently you study.', 'Kunlik grafik qanchalik muntazam o‘qiyotganingizni ko‘rsatadi.', 'Дневной график показывает, насколько регулярно вы учитесь.'] },
      { x: 87, y: 40, title: ['Leaderboard', 'Reyting', 'Рейтинг'], body: ['Compare XP with learners preparing beside you.', 'Siz bilan birga tayyorlanayotganlar bilan XPni solishtiring.', 'Сравнивайте XP с теми, кто готовится рядом с вами.'] },
    ],
  },
  {
    id: 'reading', route: '/ielts', image: '/assets/landing/reading.webp', address: 'ivygoo.com/ielts/reading',
    label: ['IELTS Reading', 'IELTS Reading', 'IELTS Reading'],
    kicker: ['IELTS READING', 'IELTS READING', 'IELTS READING'],
    title: ['The real computer-delivered exam, rehearsed.', 'Haqiqiy kompyuterdagi imtihon — oldindan mashq qilib.', 'Настоящий компьютерный экзамен — заранее.'],
    body: ['Passage on the left, questions on the right and a strict timer above — exactly how test day feels.', 'Chapda matn, o‘ngda savollar, tepada qat’iy taymer — xuddi imtihon kunidagidek.', 'Текст слева, вопросы справа, строгий таймер сверху — как в день экзамена.'],
    alt: ['IELTS Reading test with passage, questions and timer', 'Matn, savollar va taymer bilan IELTS Reading testi', 'Тест IELTS Reading с текстом, вопросами и таймером'],
    steps: [
      { x: 49, y: 4, title: ['Exam timer', 'Imtihon taymeri', 'Таймер экзамена'], body: ['A 60-minute countdown keeps your pacing honest.', '60 daqiqalik hisob vaqtni to‘g‘ri taqsimlashga yordam beradi.', '60-минутный отсчёт помогает держать темп.'] },
      { x: 24, y: 44, title: ['Split passage view', 'Ikki panelli ko‘rinish', 'Разделённый экран'], body: ['Read and highlight while the answers stay in sight.', 'Javoblarni ko‘z oldida saqlagan holda o‘qing va belgilang.', 'Читайте и выделяйте, не теряя ответы из виду.'] },
      { x: 74, y: 46, title: ['Questions workspace', 'Savollar maydoni', 'Рабочая область вопросов'], body: ['Every official question type, ready to answer.', 'Barcha rasmiy savol turlari bir joyda.', 'Все официальные типы вопросов.'] },
      { x: 30, y: 95, title: ['Question navigator', 'Savollar navigatori', 'Навигатор вопросов'], body: ['Jump between parts and see what is still open.', 'Qismlar orasida o‘ting va qolgan savollarni ko‘ring.', 'Переходите между частями и видьте, что осталось.'] },
    ],
  },
  {
    id: 'listening', route: '/ielts', image: '/assets/landing/listening.webp', address: 'ivygoo.com/ielts/listening',
    label: ['IELTS Listening', 'IELTS Listening', 'IELTS Listening'],
    kicker: ['IELTS LISTENING', 'IELTS LISTENING', 'IELTS LISTENING'],
    title: ['Hear it once. Answer like it counts.', 'Bir marta eshiting. Haqiqiydek javob bering.', 'Слушайте один раз. Отвечайте как на экзамене.'],
    body: ['Full four-part recordings play without pausing, then a two-minute answer review begins after the final track.', 'To‘rt qismli yozuvlar to‘xtamasdan ijro etiladi, oxirgi trekdan so‘ng 2 daqiqalik tekshiruv vaqti boshlanadi.', 'Четыре части звучат без пауз, а после последнего трека начинаются 2 минуты на проверку ответов.'],
    alt: ['IELTS Listening test with audio bar and note completion questions', 'Audio va bo‘sh joy to‘ldirish savollari bilan IELTS Listening testi', 'Тест IELTS Listening с аудио и заполнением пропусков'],
    steps: [
      { x: 49, y: 16, title: ['Continuous audio', 'Uzluksiz audio', 'Непрерывное аудио'], body: ['The recording plays straight through, just like the exam.', 'Yozuv imtihondagidek boshidan oxirigacha ijro etiladi.', 'Запись звучит без остановок, как на экзамене.'] },
      { x: 49, y: 28, title: ['Part by part', 'Qismma-qism', 'По частям'], body: ['Clear part banners keep you oriented.', 'Aniq bannerlar qaysi qismdaligingizni ko‘rsatadi.', 'Понятные баннеры показывают текущую часть.'] },
      { x: 27, y: 62, title: ['Type as you listen', 'Eshitib yozing', 'Пишите, пока слушаете'], body: ['Notes, forms and tables accept answers instantly.', 'Eslatma, forma va jadvallarga javobni darhol yozing.', 'Заметки, формы и таблицы принимают ответы сразу.'] },
      { x: 86, y: 4, title: ['Final check', 'Yakuniy tekshiruv', 'Финальная проверка'], body: ['Track answered questions before you submit.', 'Topshirishdan oldin javob berilgan savollarni kuzating.', 'Отслеживайте ответы перед отправкой.'] },
    ],
  },
  {
    id: 'writing', route: '/ielts', image: '/assets/landing/writing.webp', address: 'ivygoo.com/ielts/writing',
    label: ['IELTS Writing', 'IELTS Writing', 'IELTS Writing'],
    kicker: ['IELTS WRITING · AI FEEDBACK', 'IELTS WRITING · AI BAHO', 'IELTS WRITING · ОЦЕНКА AI'],
    title: ['Write with the task right beside you.', 'Topshiriq yoningizda turgan holda yozing.', 'Пишите, когда задание прямо перед вами.'],
    body: ['Task 1 visuals and Task 2 prompts sit next to your response, with live word counts and AI band feedback when you finish.', 'Task 1 grafiklari va Task 2 savollari javobingiz yonida, so‘zlar soni jonli hisoblanadi, yakunda AI band bahosini beradi.', 'Графики Task 1 и темы Task 2 рядом с ответом, счётчик слов в реальном времени и оценка AI по бэндам в конце.'],
    alt: ['IELTS Writing Task 1 process diagram with response editor', 'IELTS Writing Task 1 jarayon diagrammasi va javob muharriri', 'Диаграмма процесса IELTS Writing Task 1 и редактор ответа'],
    steps: [
      { x: 25, y: 69, title: ['Task visual', 'Topshiriq tasviri', 'Визуал задания'], body: ['Charts, maps and processes shown in full detail.', 'Grafik, xarita va jarayonlar to‘liq ko‘rsatiladi.', 'Графики, карты и процессы во всех деталях.'] },
      { x: 74, y: 47, title: ['Focused editor', 'Qulay muharrir', 'Удобный редактор'], body: ['Write freely while every word is saved.', 'Erkin yozing — har bir so‘z saqlanadi.', 'Пишите свободно — каждое слово сохраняется.'] },
      { x: 93, y: 87, title: ['Live word count', 'Jonli so‘z hisobi', 'Счётчик слов'], body: ['Know the moment you pass 150 or 250 words.', '150 yoki 250 so‘zdan o‘tganingizni darhol biling.', 'Сразу видно, когда вы превысили 150 или 250 слов.'] },
      { x: 74, y: 16, title: ['Two tasks, AI feedback', 'Ikki topshiriq, AI baho', 'Два задания, оценка AI'], body: ['Switch between Task 1 and Task 2, then get criteria-based band feedback.', 'Task 1 va Task 2 orasida o‘ting, so‘ng mezonlar bo‘yicha band bahosini oling.', 'Переключайтесь между Task 1 и Task 2 и получайте оценку по критериям.'] },
    ],
  },
  {
    id: 'speaking', route: '/ielts', image: '/assets/landing/speaking.webp', address: 'ivygoo.com/ielts/speaking',
    label: ['IELTS Speaking', 'IELTS Speaking', 'IELTS Speaking'],
    kicker: ['IELTS SPEAKING · AI EXAMINER', 'IELTS SPEAKING · AI IMTIHONCHI', 'IELTS SPEAKING · AI-ЭКЗАМЕНАТОР'],
    title: ['Practise with an examiner who really listens.', 'Sizni chindan tinglaydigan imtihonchi bilan mashq qiling.', 'Практикуйтесь с экзаменатором, который слушает.'],
    body: ['Alex, the AI examiner, runs all three parts, records your answers automatically and gives an estimated band.', 'AI imtihonchi Alex uchala qismni olib boradi, javoblaringizni avtomatik yozib oladi va taxminiy band beradi.', 'AI-экзаменатор Alex проводит все три части, записывает ответы автоматически и даёт примерный бэнд.'],
    alt: ['IELTS Speaking room with AI examiner and three test parts', 'AI imtihonchi va uch qismli IELTS Speaking xonasi', 'Комната IELTS Speaking с AI-экзаменатором и тремя частями'],
    steps: [
      { x: 27, y: 67, title: ['AI examiner', 'AI imtihonchi', 'AI-экзаменатор'], body: ['A natural English voice asks every question.', 'Tabiiy ingliz ovozi har bir savolni beradi.', 'Естественный английский голос задаёт вопросы.'] },
      { x: 70, y: 46, title: ['Three-part test', 'Uch qismli test', 'Тест из трёх частей'], body: ['Interview, long turn and discussion in order.', 'Suhbat, uzun javob va muhokama — tartib bilan.', 'Интервью, монолог и дискуссия по порядку.'] },
      { x: 31, y: 84, title: ['Automatic recording', 'Avtomatik yozib olish', 'Автоматическая запись'], body: ['Your microphone starts after the examiner finishes.', 'Imtihonchi gapirib bo‘lgach mikrofon o‘zi yoqiladi.', 'Микрофон включается после вопроса экзаменатора.'] },
      { x: 42, y: 84, title: ['Band estimate', 'Taxminiy band', 'Примерный бэнд'], body: ['See where your speaking stands after each attempt.', 'Har urinishdan keyin darajangizni ko‘ring.', 'Узнайте свой уровень после каждой попытки.'] },
    ],
  },
  {
    id: 'mocks', route: '/ielts', image: '/assets/landing/mock-ivygoo.jpg', address: 'ivygoo.com/mock/ielts',
    label: ['Full mocks', 'To‘liq mocklar', 'Полные пробники'],
    kicker: ['IELTS FULL MOCK EXAMS', 'IELTS TO‘LIQ MOCK IMTIHONLAR', 'ПОЛНЫЕ ПРОБНЫЕ IELTS'],
    title: ['Thirty full mocks. Four skills. One sitting.', '30 ta to‘liq mock. 4 ko‘nikma. Bir o‘tirishda.', '30 полных пробников. 4 навыка. Один подход.'],
    body: ['Listening, Reading, Writing and Speaking run in the official order, and your overall band opens when you finish.', 'Listening, Reading, Writing va Speaking rasmiy tartibda o‘tadi, yakunda umumiy bandingiz ochiladi.', 'Listening, Reading, Writing и Speaking идут в официальном порядке, а общий бэнд открывается в конце.'],
    alt: ['Library of thirty IELTS full mock exams', '30 ta IELTS to‘liq mock imtihonlar kutubxonasi', 'Библиотека из 30 полных пробных IELTS'],
    steps: [
      { x: 59, y: 10, title: ['Skill switcher', 'Ko‘nikma tanlovi', 'Выбор навыка'], body: ['Move between skill libraries and full mocks.', 'Ko‘nikma kutubxonalari va mocklar orasida o‘ting.', 'Переключайтесь между навыками и пробниками.'] },
      { x: 36, y: 31, title: ['Progress at a glance', 'Bir qarashda natija', 'Прогресс с первого взгляда'], body: ['See ready, in-progress and completed mocks.', 'Tayyor, jarayondagi va tugagan mocklarni ko‘ring.', 'Готовые, начатые и завершённые пробники.'] },
      { x: 29, y: 50, title: ['Official order', 'Rasmiy tartib', 'Официальный порядок'], body: ['Every mock runs Listening → Reading → Writing → Speaking.', 'Har bir mock: Listening → Reading → Writing → Speaking.', 'Каждый пробник: Listening → Reading → Writing → Speaking.'] },
      { x: 34, y: 62, title: ['Resume anytime', 'Istalgan payt davom eting', 'Продолжайте в любой момент'], body: ['Open a mock and continue where you stopped.', 'Mockni oching va to‘xtagan joydan davom eting.', 'Откройте пробник и продолжите с того же места.'] },
    ],
  },
  {
    id: 'sat', route: '/sat', image: '/assets/landing/sat-run.webp', address: 'ivygoo.com/sat/mock',
    float: { image: '/assets/landing/sat-arena-ivygoo.jpg', alt: ['SAT Arena with full mocks and question bank', 'To‘liq mocklar va savollar banki bilan SAT Arena', 'SAT Arena с пробниками и банком вопросов'] },
    label: ['Digital SAT', 'Digital SAT', 'Digital SAT'],
    kicker: ['DIGITAL SAT', 'DIGITAL SAT', 'DIGITAL SAT'],
    title: ['A Bluebook-style runner for the real thing.', 'Haqiqiy imtihon uchun Bluebook uslubidagi muhit.', 'Среда в стиле Bluebook для настоящего экзамена.'],
    body: ['Reading & Writing and Math modules with the layout, tools and timing you will meet on test day — plus 40 full mocks and a question bank.', 'Reading & Writing va Math modullari imtihon kunidagi ko‘rinish, vositalar va vaqt bilan — hamda 40 ta to‘liq mock va savollar banki.', 'Модули Reading & Writing и Math с тем же интерфейсом, инструментами и таймингом, что и на экзамене, плюс 40 пробников и банк вопросов.'],
    alt: ['Digital SAT Reading and Writing question in a Bluebook-style runner', 'Bluebook uslubidagi muhitda Digital SAT savoli', 'Вопрос Digital SAT в среде в стиле Bluebook'],
    steps: [
      { x: 49, y: 6, title: ['Module timer', 'Modul taymeri', 'Таймер модуля'], body: ['Hide or show the clock, just like Bluebook.', 'Soatni Bluebookdagidek yashiring yoki ko‘rsating.', 'Скрывайте или показывайте часы, как в Bluebook.'] },
      { x: 60, y: 15, title: ['Mark for review', 'Ko‘rib chiqish belgisi', 'Отметка для проверки'], body: ['Flag questions and return before the module ends.', 'Savollarni belgilang va modul tugashidan oldin qayting.', 'Отмечайте вопросы и возвращайтесь до конца модуля.'] },
      { x: 74, y: 38, title: ['Answer choices', 'Javob variantlari', 'Варианты ответа'], body: ['Clean, readable choices with instant checks in practice.', 'Aniq variantlar va mashq rejimida darhol tekshiruv.', 'Чёткие варианты и мгновенная проверка в практике.'] },
      { x: 86, y: 6, title: ['Highlights & notes', 'Belgilash va eslatmalar', 'Выделения и заметки'], body: ['Annotate passages while you work.', 'Ishlash davomida matnga izoh qoldiring.', 'Делайте пометки в тексте по ходу работы.'] },
    ],
  },
  {
    id: 'vocabulary', route: '/register', image: '/assets/landing/vocab-ivygoo.jpg', address: 'ivygoo.com/vocabulary',
    label: ['Vocabulary', 'Lug‘at', 'Словарь'],
    kicker: ['VOCABULARY ARENA', 'LUG‘AT ARENASI', 'АРЕНА СЛОВАРЯ'],
    title: ['Thousands of words, learned in context.', 'Minglab so‘zlar — kontekst ichida.', 'Тысячи слов — в контексте.'],
    body: ['5,028 IELTS and SAT terms matched to real tests and articles, practised with flashcards, matching, quizzes and typing drills.', 'Haqiqiy test va maqolalarga bog‘langan 5 028 ta IELTS va SAT so‘zi: kartochka, moslashtirish, quiz va yozish mashqlari.', '5 028 терминов IELTS и SAT, привязанных к тестам и статьям: карточки, сопоставление, квизы и набор текста.'],
    alt: ['Vocabulary arena with IELTS, SAT, articles and personal tracks', 'IELTS, SAT, maqolalar va shaxsiy treklar bilan lug‘at arenasi', 'Арена словаря с треками IELTS, SAT, статей и личным'],
    steps: [
      { x: 87, y: 22, title: ['Total terms', 'Jami so‘zlar', 'Всего терминов'], body: ['See how much vocabulary is waiting for you.', 'Sizni qancha so‘z kutayotganini ko‘ring.', 'Сколько слов вас ждёт.'] },
      { x: 41, y: 53, title: ['IELTS track', 'IELTS treki', 'Трек IELTS'], body: ['Words matched to every test, passage and topic.', 'Har bir test, matn va mavzuga mos so‘zlar.', 'Слова для каждого теста, текста и темы.'] },
      { x: 78, y: 53, title: ['SAT track', 'SAT treki', 'Трек SAT'], body: ['40 mocks with 20 challenging words per module.', '40 ta mock, har modulda 20 ta qiyin so‘z.', '40 пробников, по 20 сложных слов на модуль.'] },
      { x: 78, y: 84, title: ['My Words', 'Mening so‘zlarim', 'Мои слова'], body: ['Save any word and review it anywhere.', 'Istalgan so‘zni saqlang va istalgan joyda takrorlang.', 'Сохраняйте любое слово и повторяйте где угодно.'] },
    ],
  },
  {
    id: 'nova', route: '/register', image: '/assets/landing/aitutor-ivygoo.jpg', address: 'ivygoo.com/ai-tutor',
    label: ['Nova AI coach', 'Nova AI murabbiy', 'AI-коуч Nova'],
    kicker: ['NOVA · AI COACH', 'NOVA · AI MURABBIY', 'NOVA · AI-КОУЧ'],
    title: ['Ask anything. Hear the answer.', 'Istalgan savolni bering. Javobni eshiting.', 'Спросите что угодно. Услышьте ответ.'],
    body: ['Nova explains IELTS strategies, SAT math and English grammar by chat or voice, whenever you get stuck.', 'Nova IELTS strategiyalari, SAT matematikasi va ingliz grammatikasini chat yoki ovoz orqali tushuntiradi.', 'Nova объясняет стратегии IELTS, математику SAT и грамматику английского в чате или голосом.'],
    alt: ['Nova AI coach chat with subject shortcuts and voice input', 'Mavzu tugmalari va ovozli kiritish bilan Nova AI murabbiy chati', 'Чат AI-коуча Nova с темами и голосовым вводом'],
    steps: [
      { x: 60, y: 45, title: ['Your coach', 'Sizning murabbiyingiz', 'Ваш коуч'], body: ['Nova adapts explanations to your level.', 'Nova tushuntirishlarni darajangizga moslaydi.', 'Nova подстраивает объяснения под ваш уровень.'] },
      { x: 60, y: 77, title: ['Pick a subject', 'Mavzuni tanlang', 'Выберите тему'], body: ['IELTS, SAT & Math or English in one tap.', 'IELTS, SAT & Math yoki English — bir bosishda.', 'IELTS, SAT & Math или English — в одно касание.'] },
      { x: 91, y: 92, title: ['Voice or text', 'Ovoz yoki matn', 'Голос или текст'], body: ['Type a question or tap the microphone.', 'Savol yozing yoki mikrofonni bosing.', 'Напишите вопрос или нажмите микрофон.'] },
      { x: 93, y: 13, title: ['Talk with Nova', 'Nova bilan gaplashing', 'Говорите с Nova'], body: ['Start a live spoken conversation.', 'Jonli og‘zaki suhbatni boshlang.', 'Начните живой разговор голосом.'] },
    ],
  },
  {
    id: 'listen-speak', route: '/register', image: '/assets/landing/podcast-ivygoo.jpg', address: 'ivygoo.com/podcast',
    float: { image: '/assets/landing/shadowing-ivygoo.jpg', alt: ['Shadowing lab for listening, repeating and recording', 'Tinglash, takrorlash va yozib olish uchun Shadowing lab', 'Shadowing lab: слушайте, повторяйте и записывайте'] },
    label: ['Podcasts & shadowing', 'Podkast va shadowing', 'Подкасты и шэдоуинг'],
    kicker: ['PODCASTS & SHADOWING', 'PODKAST VA SHADOWING', 'ПОДКАСТЫ И ШЭДОУИНГ'],
    title: ['Train your ear. Then train your voice.', 'Avval qulog‘ingizni, keyin ovozingizni charxlang.', 'Тренируйте слух. Затем — голос.'],
    body: ['Curated English podcasts with captions, plus a shadowing lab where you listen, repeat and record phrase by phrase.', 'Subtitrli saralangan ingliz podkastlari va ibora-ibora tinglab, takrorlab, yozib oladigan shadowing lab.', 'Подборка английских подкастов с субтитрами и лаборатория шэдоуинга: слушайте, повторяйте и записывайте по фразам.'],
    alt: ['English podcast library with featured episode and player', 'Tanlangan epizod va pleyer bilan ingliz podkastlari', 'Библиотека английских подкастов с эпизодом и плеером'],
    steps: [
      { x: 45, y: 33, title: ['Curated episodes', 'Saralangan epizodlar', 'Подборка эпизодов'], body: ['300 episodes from A2 to C1.', 'A2 dan C1 gacha 300 ta epizod.', '300 эпизодов от A2 до C1.'] },
      { x: 68, y: 72, title: ['English captions', 'Inglizcha subtitrlar', 'Английские субтитры'], body: ['Follow every line as you listen.', 'Tinglash davomida har bir qatorni kuzating.', 'Следите за каждой фразой.'] },
      { x: 86, y: 84, title: ['Continue listening', 'Davom ettirish', 'Продолжить'], body: ['Pick up exactly where you paused.', 'To‘xtagan joyingizdan davom eting.', 'Продолжайте с места паузы.'] },
      { x: 48, y: 92, title: ['Cinematic player', 'Kinematik pleyer', 'Кинематографичный плеер'], body: ['Fullscreen playback with focused controls.', 'To‘liq ekran va qulay boshqaruv.', 'Полноэкранный режим и удобное управление.'] },
    ],
  },
  {
    id: 'admissions', route: '/register', image: '/assets/landing/universities-ivygoo.jpg', address: 'ivygoo.com/admission',
    label: ['Admissions', 'Qabul', 'Поступление'],
    kicker: ['UNIVERSITY ADMISSIONS', 'UNIVERSITETGA QABUL', 'ПОСТУПЛЕНИЕ В УНИВЕРСИТЕТ'],
    title: ['From your score to your shortlist.', 'Balingizdan — universitetlar ro‘yxatigacha.', 'От балла — к списку университетов.'],
    body: ['Explore 1,506 universities with QS 2027 ranking context, IELTS requirements and living budgets, then follow 30 guided lessons.', 'QS 2027 reytingi, IELTS talablari va yashash xarajatlari bilan 1 506 ta universitetni o‘rganing, so‘ng 30 ta yo‘riqnoma darsni o‘ting.', 'Изучайте 1 506 университетов с рейтингом QS 2027, требованиями IELTS и бюджетом, затем проходите 30 уроков.'],
    alt: ['University catalog with search, filters and QS rank cards', 'Qidiruv, filtrlar va QS reyting kartalari bilan universitetlar katalogi', 'Каталог университетов с поиском, фильтрами и рейтингом QS'],
    steps: [
      { x: 74, y: 38, title: ['Search', 'Qidiruv', 'Поиск'], body: ['Find any university by name.', 'Istalgan universitetni nomi bo‘yicha toping.', 'Найдите любой университет по названию.'] },
      { x: 74, y: 45, title: ['Smart filters', 'Aqlli filtrlar', 'Умные фильтры'], body: ['Filter by country, budget, IELTS and QS rank.', 'Davlat, byudjet, IELTS va QS reyting bo‘yicha saralang.', 'Страна, бюджет, IELTS и рейтинг QS.'] },
      { x: 69, y: 58, title: ['QS rank', 'QS reytingi', 'Рейтинг QS'], body: ['Ranking context on every university card.', 'Har bir universitet kartasida reyting.', 'Рейтинг на каждой карточке.'] },
      { x: 69, y: 90, title: ['Your fit', 'Sizga mosligi', 'Ваше соответствие'], body: ['See how each university matches your profile.', 'Har bir universitet profilingizga qanchalik mosligini ko‘ring.', 'Насколько университет подходит вашему профилю.'] },
    ],
  },
]
