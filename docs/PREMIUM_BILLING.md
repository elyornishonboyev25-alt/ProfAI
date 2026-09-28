# Premium va qo‘lda to‘lovni tasdiqlash

## Hozirgi tariflar

| Muddat | Narx | Bir oy hisobida |
| --- | ---: | ---: |
| 1 oy | 79 000 so‘m | 79 000 so‘m |
| 3 oy | 219 000 so‘m | 73 000 so‘m |
| 12 oy | 699 000 so‘m | 58 250 so‘m |

Har uch tarif bir xil premium huquqini beradi. Bu takrorlanuvchi obuna emas: muddati tugagach, yangi buyurtma beriladi. Narxlar `backend/src/utils/premiumPlans.ts` da bitta manbada saqlanadi va saytga API orqali keladi.

79 000 so‘mlik oylik narx 2026-yil sentabrdagi mahalliy IELTS amaliyot servislarining ochiq narxlari orasida joylashadi: [TestPilot Standard/Premium](https://testpilot.uz/pricing) 66 000/99 000 so‘m, [BandScore Monthly Preparation](https://bandscore.uz/en/pricing) 74 900 so‘m. Bu bozor taqqoslashidir; haqiqiy xarajat va konversiya ma’lumotlariga qarab narxni keyin qayta ko‘rish kerak.

## Xaridor yo‘li

1. `/premium` sahifasida tarif tanlanadi. Server narx bilan buyurtma yaratadi.
2. Xaridor ko‘rsatilgan kartaga aniq summani Click, Payme yoki bank ilovasidan o‘tkazadi.
3. Chekni `@nishonboyev7` Telegram hisobiga buyurtma kodi va akkaunt emaili bilan yuboradi.
4. Saytda **Chekni yubordim** tugmasini bosadi. Bu faqat tekshiruv navbatiga qo‘shadi; premiumni bermaydi.
5. Egasi `/owner` sahifasida tushumni karta/bank tarixida tekshiradi va buyurtmani tasdiqlaydi yoki rad etadi. Tasdiq va premium muddatini uzaytirish bitta baza tranzaksiyasida bajariladi.

**Telegram xabari va bankdagi tushum avtomatik tekshirilmaydi.** Merchant API ulanmaguncha sayt pulni mustaqil tasdiqlay olmaydi. Kartani va Telegram username ni chiqarishdan oldin ularning to‘g‘riligini egasi tekshirishi kerak.

## Egasi uchun

`/owner` sahifasi faqat `elyornishonboyev000@gmail.com` hisobiga ochiladi. Server har bir so‘rovda foydalanuvchi ID si bo‘yicha bazadan emailni tekshiradi. Boshqa foydalanuvchiga 1, 3, 12 oylik yoki muddatsiz premium berish mumkin. Muddatli grant mavjud bo‘lsa, qo‘shimcha muddat uning tugash sanasidan hisoblanadi. Muddatsiz grant to‘lov buyurtmasi tasdiqlansa ham muddatsiz qoladi.

Avvalgi email/nickname premium ro‘yxati saqlangan. U yerdagi huquqni paneldan bekor qilib bo‘lmaydi; ular koddagi doimiy grantlardir.

## Joylashtirish

Backend ishga tushganda mavjud `prisma migrate deploy` bu o‘zgarishdagi `PremiumGrant` va `PaymentRequest` jadvallarini yaratadi. Joylashtirgandan keyin quyidagilarni tekshiring:

1. Egasi `/owner` da foydalanuvchilar va to‘lov so‘rovlarini ko‘radi; boshqa hisob `403` oladi.
2. Sinov hisobi buyurtma yaratadi, Telegramga chek yuboradi va so‘rovni yuborilgan deb belgilaydi.
3. Egasi haqiqiy test to‘lovini bank tarixida tasdiqlab, so‘rovni ma’qullaydi.
4. Sinov hisobi sahifani yangilaganda premium faol bo‘ladi; muddat tugagan hisobda huquq avtomatik o‘chadi.
