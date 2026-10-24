# Telegram bot va Railway (oddiy yo'riqnoma)

Bot backend ichida ishlaydi, alohida server kerak emas. Vercel'da uzoq ishlaydigan jarayon bo'lmaydi,
shuning uchun backend (va u bilan bot) Railway'da turadi.

## 1. Botni tayyorlash (Telegram'da, bir marta)

1. @BotFather → `/revoke` → bot tokenini yangilang (eski token ochiq qolgan bo'lsa).
2. **Kanal:** https://t.me/IvyGoo kanaliga @IvyGoo_bot ni **administrator** qilib qo'shing
   (Kanal → Administratorlar → Administrator qo'shish). Faqat shunda bot "obuna bo'lganmi?" ni tekshira oladi.
   Botga hech qanday huquq berish shart emas, "a'zolarni ko'rish" yetarli.

## 2. Railway'da backend

1. Railway → **New Project → Deploy from GitHub repo** → shu repo.
2. Service → Settings → **Root Directory = `backend`**. (`railway.json` build/start/healthcheck'ni o'zi biladi.)
3. Project'ga **PostgreSQL** qo'shing va service'ga `DATABASE_URL` ni ulang (Variables → Add Reference).
4. Service → Settings → Networking → **Generate Domain**. Masalan: `ivygoo-api.up.railway.app`.
5. Variables (qiymatlarni o'zingiz yozasiz, hech qayerga commit qilinmaydi):

| O'zgaruvchi | Qiymat |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Railway Postgres'dan reference |
| `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET` | hozirgi qiymatlar (kamida 24 belgi) |
| `CORS_ORIGIN` | sayt manzili, masalan `https://ivygoo.uz` |
| `BILLING_SITE_URL` | sayt manzili |
| `GEMINI_API_KEY` (va boshqa AI kalitlar) | hozirgi qiymatlar |
| `TELEGRAM_BOT_TOKEN` | BotFather bergan yangi token |
| `TELEGRAM_BOT_USERNAME` | `IvyGoo_bot` |
| `TELEGRAM_WEBHOOK_URL` | `https://<railway-domen>/api/v1/telegram/webhook` |
| `TELEGRAM_WEBHOOK_SECRET` | o'zingiz o'ylab topgan uzun tasodifiy matn |
| `TELEGRAM_SITE_URL` | sayt manzili |
| `TELEGRAM_CHANNEL` | `@IvyGoo` |
| `TELEGRAM_CHANNEL_URL` | `https://t.me/IvyGoo` |
| `TELEGRAM_PROMO_DAYS` | promokod bergan bepul kunlar (standart 7) |

6. Deploy. Birinchi ishga tushishda `prisma migrate deploy` yangi jadvallarni o'zi yaratadi.

> **Muhim:** `TELEGRAM_BOT_TOKEN` ni faqat Railway'da qo'ying. Boshqa joyda (Vercel, lokal) ham
> qo'yilsa, ikkita nusxa bir botni boshqarmoqchi bo'ladi.

## 3. Saytni Railway backend'ga ulash (agar API hali Vercel'da bo'lsa)

Frontend (Vercel) → Environment Variables:

```
VITE_API_URL=https://<railway-domen>/api/v1
```

So'ng frontend'ni qayta deploy qiling.

## 4. Tekshirish

1. `https://<railway-domen>/api/v1/health` ochiladi.
2. Telegram'da @IvyGoo_bot ga `/start` yuboring, javob keladi.
3. Saytda **Premium → Promokod olish** → bot ochiladi → kanalga obuna bo'ling → "Tekshirish" → promokod keladi.
4. Promokodni saytda kiriting → bepul kunlar qo'shiladi.

## Muammo bo'lsa

- Bot javob bermayapti → Railway loglarida `Telegram bot: webhook mode` bor-yo'qligini ko'ring; `TELEGRAM_WEBHOOK_URL` to'g'rimi?
- "Obunani tekshirib bo'lmadi" → bot kanalga administrator qilib qo'shilmagan.
- Promokod berilmayapti → kanal nomi (`TELEGRAM_CHANNEL`) to'g'ri `@IvyGoo` ekanini tekshiring.
- Baraban ochilmayapti → `TELEGRAM_SITE_URL` **https** bilan boshlanadigan haqiqiy sayt manzili bo'lishi kerak (Telegram Mini App faqat https'da ishlaydi). Baraban sahifasi: `<sayt>/spin`.

## Tariflar, baraban va guruh (qisqacha)

| Narsa | Qoida |
|---|---|
| Free | $0, doimiy. Har oy: 4 test, 1 mock, 2 Writing + 2 Speaking AI tahlil, 15 AI xabar |
| Pro | $5.99/oy, $16.19/3 oy, $57.59/12 oy. Cheksiz test, 4 mock, 30+30 AI tahlil, classga qo'shilish |
| Max | $11.99/oy, $32.39/3 oy, $115.19/12 oy. Cheksiz mock, 150+150 AI tahlil, class yaratish |
| Baraban | Faqat kanal obunachilari, har Telegram hisob **1 marta**. Har 10 aylantirishda: 1×50%, 1×25%, 1×20%, 4×15%, 2×10%, 1×5% (tartib tasodifiy) |
| 50% chegirma | 10 daqiqa amal qiladi, qolganlari 24 soat. Ishlatilmasa ham shu 10 talik blokda qaytib kelmaydi |
| Guruh | 5+ kishi: Pro $4.99, Max $9.99 kishi boshiga. Botda `/group`. Har bir a'zo botga start berib, kanalga obuna bo'ladi; barabandan chegirmasi hisobga qo'shiladi |
| Do'st taklifi | Do'st havola orqali ro'yxatdan o'tib, botga start berib, kanalga obuna bo'lsa: taklif qilganga **+3 kun**, 5/10/25 do'stda qo'shimcha bonus |

Barcha limitlar `backend/src/utils/billingCatalog.ts` (`PLAN_QUOTAS`), baraban `backend/src/services/wheel.service.ts` (`WHEEL_BLOCK`) ichida.

> Karta orqali to'lov hali ulanmagan: guruh hisobi va chegirmali narx ko'rsatiladi, "To'lash" bosilganda "tez orada" deyiladi.
> To'lov ulanganda chegirma checkout'da avtomatik qo'llanadi (`PaymentRequest.discountPercent`) va to'lov tasdiqlangach "ishlatilgan" deb belgilanadi.
