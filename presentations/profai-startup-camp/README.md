# ProfAI — Startup Camp pitch

English slides with Uzbek scripts for a 3-minute or 5-minute pitch. Presenter: Elyor Nishonboyev. Ten main slides and two optional Q&A slides. Prepared from the founder's information on 7 October 2026 and the repository's implemented features.

## Noutbukda ochish

1. `ProfAI-Startup-Camp.html` faylini yuklab oling yoki noutbukingizda toping.
2. Faylni Chrome yoki Microsoft Edge brauzerida oching. Alohida dastur yoki internet kerak emas. Sayt va Telegram havolalarini ochish uchun internet kerak bo‘ladi.
3. `Full screen` tugmasini yoki `F` ni bosing. Slaydlar qo‘lda almashadi. Keyingi slayd uchun o‘ng strelka, Space yoki Page Down, oldingi slayd uchun chap strelkani bosing.
4. `5 min` tugmasi bilan 3 yoki 5 daqiqalik nutqni tanlang. Inglizcha slaydlar bir xil qoladi, o‘zbekcha spiker izohlari qisqaradi yoki kengayadi.
5. `ProfAI-Nutq-UZ.md` nutqni va `ProfAI-Savol-Javob-UZ.md` savollarga javoblarni o‘qib, ovoz chiqarib mashq qiling. `ProfAI-90-Kunlik-Reja-UZ.md` pitchdan keyingi marketing uchrashuvi uchun taklif rejasidir. Belgilangan vaqtlar taxminiy. `Start timer` faqat mashq uchun, slaydni o‘zi almashtirmaydi.
6. Taqdimotning PDF nusxasi animatsiyasiz ulashish va zaxira uchun. Asosiy pitch oxirida to‘xtang. PDF’ning oxirgi ikki sahifasi qo‘shimcha savol-javob slaydlari.

## Spiker izohlari

- `UZ notes` yoki `N` asosiy oynada o‘zbekcha izohni ochadi. Bu panel proyektorda ham ko‘rinadi, uni faqat mashq paytida ishlating.
- `Speaker view` yoki `P` izohlar va boshqaruv bilan alohida oynani ochadi. Windows’da ikkinchi ekran bo‘lsa, `Win + P` orqali `Extend` ni tanlang. Asosiy taqdimot oynasini proyektorga olib o‘ting, spiker oynasi noutbukda qolsin. Brauzer popup’ni to‘ssa, ushbu lokal fayl uchun ruxsat bering yoki nutqni alohida qurilmada oching.
- Bir ekran bo‘lsa, spiker oynasini sahnada yoping va oldindan mashq qiling.
- `G` slaydlar ro‘yxatini ochadi. `A` qo‘shimcha slaydlarga o‘tadi yoki asosiy pitchga qaytaradi. Qo‘shimcha slaydda `Esc` asosiy pitchga qaytaradi.
- `B` ekranni vaqtincha qoraytiradi. Istalgan tugma yoki bosish ekranni qaytaradi. `M` nutq variantini almashtiradi. `T` timer’ni boshlaydi/to‘xtatadi, `R` uni nolga tushiradi.
- `Motion off` animatsiyalarni o‘chiradi. Operatsion tizimning kamaytirilgan animatsiya sozlamasi ham hisobga olinadi.
- Mahalliy HTML fayl yangi tabiiy holatda ochiladi. Tarixiy URL’da `#...` bo‘lsa, o‘sha slayddan boshlanadi. `Home` birinchi slaydga qaytaradi.

## Mazmunning chegaralari

- 40 foydalanuvchi va launch day 3 — asoschi bergan ma’lumot. Bu kunlik faol yoki pullik foydalanuvchilar soni deb ko‘rsatilmagan.
- 5 o‘quv markazi — hamkorlik bo‘yicha muzokaralar. Ular imzolangan pullik mijozlar deb ko‘rsatilmagan.
- 14 kun — taklif qilingan sinov. Sinovdan pullik xizmatga o‘tish hali tasdiqlanmagan.
- Xalqaro kengayish va 90 kunlik hamkorlik — taklif qilinayotgan reja. Xalqaro mijozlar, daromad, bozor hajmi yoki baholash mezonlari to‘qib yozilmagan.
- Narxlar faqat qo‘shimcha slaydda ko‘rsatilgan. Ular `backend/src/utils/billingCatalog.ts` dagi bir oylik konfiguratsiya: learner $6, center student $4, teacher $8. Jonli saytning checkout narxlari mustaqil tekshirilmagan. Markazlar bilan yakuniy shartlar alohida kelishiladi.
- Sinf jarayoni chizma bilan tushuntirilgan. Bu haqiqiy mijoz ekrani yoki natijalari sifatida ko‘rsatilmagan. Barcha topshiriqlarni avtomatik baholash, IELTS ball oshishi yoki o‘qituvchi vaqtining kamayishi bo‘yicha isbotlanmagan da’vo yo‘q.
- Pitch davomiyligi va Startup Camp mezonlari rasman berilmagan. 3 va 5 daqiqalik nutqlar shu noaniqlik uchun tayyorlangan. Bu deck campning rasmiy shabloni deb taqdim etilmagan.

## Sources

- Founder-supplied launch facts, team and contact in this conversation, 7 October 2026.
- Product: `README.md`, `src/config/workspaceNavigation.ts`, `src/features/learningCenter/AssignmentsView.tsx`, `StudentDetailView.tsx`, `TeacherNotesPanel.tsx`, `types.ts`.
- Pricing: `backend/src/utils/billingCatalog.ts`.
- [YC: clear slide design](https://www.ycombinator.com/blog/how-to-design-a-better-pitch-deck/).
- [YC: Demo Day narrative and rehearsal](https://www.ycombinator.com/blog/guide-to-demo-day-pitches/).
- [Sequoia: pitch structure](https://sequoiacap.com/article/writing-a-business-plan/).

## Rebuild from source

Run `node presentations/profai-startup-camp/build.mjs` from the repository root. An optional first argument selects the output folder. This creates a self-contained HTML deck, Uzbek scripts and instructions without package installation or network requests. PDF export is available from the deck's help panel through browser printing. Choose landscape and background graphics if your browser asks for print settings.

Generated deliverables are kept under `output/pitch/` and are not committed. Presentation source is isolated from the main website.
