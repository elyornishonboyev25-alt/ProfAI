# ProfAI Coach: sozlash va tekshirish

## Ishga tushirish

Kalitlarni backend hosting xizmatining maxfiy environment sozlamalariga yoki faqat mahalliy `backend/.env` fayliga kiriting. Kalitlarni `VITE_*`, frontend kodi, Git yoki chatga joylamang. Backend va frontendni yangilang; backendni qayta ishga tushiring. Mavjud foydalanuvchi bazasi va chat/memory jadvallari ishlatiladi; yangi migratsiya kerak emas.

```dotenv
# Tabiiy, uzluksiz voice chat
OPENAI_API_KEY=<serverdagi maxfiy kalit>
AI_VOICE_MODEL=gpt-realtime-2.1
AI_VOICE_MAX_MINUTES=20

# Yozma coach: tanlangan provider/model akkauntingizda mavjud bo'lishi kerak
AI_CHAT_PROVIDER=openai
AI_CHAT_MODEL=gpt-4.1

# Speaking yozuvini haqiqatan eshitib baholash uchun
GEMINI_API_KEY=<serverdagi maxfiy kalit>
GEMINI_MODELS=gemini-2.5-flash,gemini-2.5-flash-lite

# Universitet talablari, deadline, scholarship kabi joriy ma'lumotlar
# Alohida qidiruv xarajati bor; sukut bo'yicha o'chirilgan
AI_WEB_SEARCH_ENABLED=true
AI_WEB_SEARCH_MODEL=gpt-4.1-mini
```

`AI_CHAT_PROVIDER=auto` mavjud Gemini → OpenAI → Hugging Face zanjirini ishlatadi. `AI_CHAT_MODEL` bo'sh bo'lsa, mavjud provider konfiguratsiyasi ishlaydi. Javobning bir qismi ko'rsatilganidan keyin boshqa modelga o'tib matnlarni aralashtirmaydi. Audio baholash audioni tushunadigan Gemini provideriga yuboriladi; ishlamasa, interfeys matn bo'yicha baholashga o'tganini ko'rsatadi va pronunciation bahosini ko'rsatmaydi. OpenAI kaliti bo'lmasa natural voice o'chadi, foydalanuvchi standart browser voice yoki yozma chatni tanlay oladi.

WebRTC uchun HTTPS yoki localhost, mikrofon ruxsati va backenddan OpenAI WebSocket xizmatiga chiqish kerak. Reverse proxy `/api/v1/ai/assistant/stream` uchun response bufferingni o'chirishi, SSE ulanishiga yetarli timeout berishi kerak. Ko'p backend instance ishlatilsa, voice `/connect`, `/context`, `/end` so'rovlari bir instancega borishi uchun sticky routing kerak: faol voice sessiyalar server xotirasida saqlanadi. Serverni qayta ishga tushirish faol qo'ng'iroqni tugatadi.

## Qo'shilgan imkoniyatlar

- Yozma chatda bosqichma-bosqich javob, bekor qilish, screenshot tushunish, EN/UZ/RU til tanlovi va suhbat tarixi.
- Serverdagi umumiy coach siyosati: IELTS, SAT/matematika, English va admissions rejimlari; foydalanuvchining o'z profili, maqsadlari va xotirasi.
- Tabiiy WebRTC voice: semantic VAD, fikrlash pauzalari, gapni bo'lib so'zlash, transkript, mute, qayta ulanish va kichraytirilgan holatda suhbatni davom ettirish.
- Voice ham yozma coachdan tekshirilgan batafsil tushuntirish, reja yoki joriy tadqiqot so'rashi mumkin. Natija chatga tushadi.
- Sahifa ochish, test boshlash va lug'atga so'z saqlash `Allow` orqali tasdiqlanadi. AI bu ishlarni bajarilgan deb ko'rsatmasligi kerak. Listening uchun alohida timer qo'shilmaydi.
- IELTS examiner ovozli mashq rejimi savollarni beradi, suhbat davomida tuzatmaydi. Aniq vaqt bilan full mock uchun mavjud Speaking testidan foydalaniladi.
- Speaking testida to'rttagacha tanlangan haqiqiy audio javob orqali dalilli practice baholash, teng vaznli to'rtta mezon, haqiqiy iqtibos va mashq takliflari. Matnning o'zidan pronunciation yoki real pauzalar chiqarilmaydi.

## Avtomatik tekshiruvlar

```powershell
npm run test:ai-coach-ui
npm run test:speaking-ui
npm --prefix backend run test:ai-coach
npm run build
```

Testlar pulli API chaqiruvlarisiz mock bilan streaming, maxfiy account/thread chegaralari, action tekshiruvi, audio dalillar, WebRTC lifecycle, to'xtatilgan javob va mikrofonni bo'shatishni tekshiradi. Ular haqiqiy modelning bilim sifatini yoki production ovoz kechikishini tasdiqlamaydi.

## Kalitlar ulanganidan keyingi qabul tekshiruvi

1. EN, UZ va RU da qisqa va uzun yozma/ovozli suhbat; til almashinuvi, aralash tildagi so'zlar va 2–5 soniyalik fikrlash pauzalarini tekshiring.
2. AI gapirayotganda savol bering; javob to'xtashi, transkript to'xtatilgan deb belgilanishi va undan keyingi matn qo'shilmasligini tekshiring. Audio va transkript so'zma-so'z vaqt bilan moslashtirilmagan: to'xtatilgan transkriptning hamma so'zi eshitilganini anglatmaydi. Chat/sahifa almashinuvi, mikrofonni rad etish, retry, logout va qo'ng'iroq oxiridagi mikrofon indikatorini tekshiring.
3. Telefon Safari/Chrome va desktop Chrome/Edge/Firefoxda headset, shovqin va sust internet bilan ovoz/audio ijrosini tekshiring. Birinchi ovozgacha vaqt va uzilishlarni o'lchang.
4. Oldindan yechimi ma'lum SAT savollari, turli IELTS darajasidagi essaylar va audioni IELTS o'qituvchisi bilan solishtiring. Accent yoki gap uzunligi uchun sun'iy yuqori/past baho bermasligini tekshiring. Bu practice estimate; rasmiy IELTS bahosi emas.
5. Universitetning joriy deadline savolida javobdagi manbani oching; qidiruv o'chirilgan yoki ishlamaganida AI tasdiqlangan joriy fakt deb gapirmasligini tekshiring.
6. Ikki alohida accountda xotira/chat ajratilganini tekshiring. Boshqa account thread ID si bilan so'rov rad etilishi kerak.
7. `AiUsageEvent` orqali model, token, latency, fallback va xatolarni kuzating; provider konsolida xarajat limitini belgilang. Voice davomiyligi server tomonidan cheklangan; global moliyaviy limit provider hisobida boshqariladi.

Kod tekshiruvlari professional xulq uchun asos yaratadi. IELTS.gg yoki boshqa mahsulotdan ustunlik faqat haqiqiy foydalanuvchilar, kechikish o'lchovi va mutaxassis baholashi bilan aniqlanadi.

## Texnik manbalar

- [OpenAI voice agents](https://developers.openai.com/api/docs/guides/voice-agents)
- [Realtime WebRTC](https://developers.openai.com/api/docs/guides/voice-webrtc)
- [Realtime turn detection](https://developers.openai.com/api/docs/guides/realtime-vad)
- [OpenAI web search](https://developers.openai.com/api/docs/guides/tools-web-search)
- [Gemini audio understanding](https://ai.google.dev/gemini-api/docs/audio)
- [IELTS scoring](https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail)
