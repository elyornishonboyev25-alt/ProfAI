# ProfAI: tangalar, tariflar va to‘lovlarni ishga tushirish

Bu o‘zgarish narxlar sahifasi, boshlang‘ich tangalar, pullik mashqlar, class yaratish huquqlari va onlayn to‘lov adapterlarini qo‘shadi. Merchant hisoblari ochilmaguncha to‘lovlar o‘chiq turadi. Kalitlarni Git yoki chatga joylamang: hostingning server environment sozlamalariga kiriting.

## Tariflar

| Tarif | Oylik UZS | Oylik USD | Bir oyga tangalar | Class yaratish |
| --- | ---: | ---: | ---: | --- |
| Mustaqil o‘quvchi | 49 999 | $4.49 | 600 | Yo‘q |
| Markaz o‘quvchisi | 39 999 | $3.49 | 600 | Yo‘q |
| O‘qituvchi Individual | 69 999 | $5.99 | 1 000 | Ha |

39 999 so‘m — **har bir o‘quvchi uchun**, butun markaz uchun emas. Markaz narxini olish uchun akkaunt classda faol STUDENT bo‘lishi kerak. O‘qituvchi tarifi har bir class yaratuvchi o‘qituvchi uchun alohida olinadi; uning o‘quvchilari o‘z tangalari yoki tarifidan foydalanadi. Classga taklif bilan kirish bepul: bu to‘lovdan oldin markaz tarifiga moslikni tekshirishga imkon beradi.

Choraklik: 3 oy, 10% chegirma. Yillik: 12 oy, 20% chegirma. Butun muddat uchun oldindan bir marta to‘lanadi; tangalar to‘liq hajmda birga beriladi. Avtomatik uzaytirish yo‘q. Tangalar muddatsiz. Tarif muddati class yaratish huquqini belgilaydi. Mavjud classlar, topshiriqlar va natijalarni ko‘rish tarif tugaganda saqlanadi; yangi class/guruh yaratish uchun tarif yangilanadi.

Mustaqil o‘quvchi narxi, USD narxlari, chegirmalar va tanga hajmlari boshlang‘ich biznes taklifidir. AI sarfi va to‘lov komissiyasi bilan solishtirib, ishga tushirishdan oldin tekshiring. Barcha summalar `backend/src/utils/billingCatalog.ts` da bir joyda turadi. USD narxlari jonli kurs bo‘yicha konvertatsiya emas, alohida narxlardir.

150 ta boshlang‘ich tanga akkaunt uchun bir marta serverda beriladi. Eski akkauntning birinchi kirishida ham hamyon yaratiladi. Eski Premium muddatigacha saqlanadi; u avtomatik class yaratish huquqini bermaydi. XP tangaga aylantirilmaydi.

Test: 10 tanga, 24 soat ichida qayta ochish/davom ettirish bepul. To‘liq mock: 50 tanga, 24 soat foydalanish, bittadan Writing va Speaking AI tekshiruvi. Writing/Speaking alohida AI tekshiruvi: 20 tanga. AI Coach matn so‘rovi: 1 tanga. AI Voice sessiyasi: 20 tanga. Podcast/shadowing: 5 tanga, bir marta ochilgach takrorlash bepul. Kutubxonadagi dastlabki uchtadan dars bepul. Lug‘at, flashcard, natijalar va saqlangan tahlillar bepul qoladi. AI xatosida band qilingan tangalar qaytariladi.

## Click bilan ishlash

1. [Click Business](https://business.click.uz/) orqali biznesingiz uchun merchant arizasi bering. Click talab qiladigan yuridik ma’lumotlar, hisob raqami va sayt haqidagi ma’lumotlarni tayyorlang; aniq ro‘yxatni Click bilan tasdiqlang.
2. Saytda haqiqiy xizmat tavsifi, tariflar, yordam uchun aloqa, maxfiylik va qaytarish shartlari bo‘lsin. Hujjatlar biznesingizning haqiqiy ma’lumotlari bilan to‘ldirilishi kerak.
3. Click’dan Shop API uchun `merchant_id`, `service_id`, `secret_key` va test tartibini oling.
4. Prepare va Complete callback manzillariga bir xil HTTPS endpoint kiriting: `https://profai.uz/api/v1/billing/callbacks/click`. Haqiqiy domeningiz boshqa bo‘lsa, uni qo‘llang.
5. Hosting server sozlamalariga `CLICK_MERCHANT_ID`, `CLICK_SERVICE_ID`, `CLICK_SECRET_KEY` ni kiriting. Sayt narxi va buyurtma ID serverda belgilanadi; callback imzosi, summa va holat tekshiriladi.
6. Click testlari bilan noto‘g‘ri imzo, noto‘g‘ri summa, Prepare/Complete takrori va bekor qilingan buyurtmani tekshiring. Faqat provayder tasdiqlagandan keyin production to‘lovlarini yoqing.

Rasmiy hujjatlar: [Click hujjatlari](https://docs.click.uz/). Merchant yoqilishi va fiskal ma’lumotlarga qo‘yiladigan talablarni Click bilan yakunlang.

## Payme bilan ishlash

1. [Payme Business](https://business.payme.uz/) orqali merchant ro‘yxatdan o‘ting va shartnoma jarayonini yakunlang.
2. Merchant kabinetida web-kassa yarating. Account maydonini `order_id` qilib sozlang: bu ProfAI buyurtma ID qiymatini oladi.
3. Merchant API endpoint: `https://profai.uz/api/v1/billing/callbacks/payme`.
4. Hostingga `PAYME_MERCHANT_ID`, `PAYME_SECRET_KEY` ni kiriting. Test uchun `PAYME_CHECKOUT_URL=https://test.paycom.uz`, jonli rejim uchun `https://checkout.paycom.uz` ishlatiladi. Test va jonli merchant kalitlarini aralashtirmang.
5. [Payme sandbox](https://test.paycom.uz/) bilan CheckPerformTransaction, CreateTransaction, PerformTransaction, CheckTransaction, CancelTransaction va GetStatement’ni tekshiring. Bir xil transaction ID takrorlansa, tanga qayta qo‘shilmasligi kerak.
6. CreateTransaction’dan so‘ng buyurtma PROCESSING bo‘ladi; to‘lov bajarilmaguncha mahsulot berilmaydi. Tayyorlangan transaction 12 soatdan keyin bekor qilinadi. Xizmat berilgan APPROVED buyurtma uchun avtomatik bekor qilish rad etiladi; qaytarish bo‘yicha yordam so‘rovini merchant kabinetida ko‘rib chiqish kerak.

Rasmiy hujjatlar: [Merchant API](https://developer.help.paycom.uz/metody-merchant-api/), [GET checkout](https://developer.help.paycom.uz/initsializatsiya-platezhey/otpravka-cheka-po-metodu-get/), [CancelTransaction](https://developer.help.paycom.uz/metody-merchant-api/canceltransaction/).

## USD va xalqaro kartalar

Kodda Stripe Checkout adapteri tayyor. **O‘zbekistonda ro‘yxatdan o‘tgan biznes uchun Stripe merchant ochish imkonini oldindan tekshiring:** O‘zbekiston [Stripe qo‘llaydigan mamlakatlar ro‘yxatida](https://stripe.com/global) yo‘q. Stripe uchun haqiqiy biznesingiz qo‘llab-quvvatlanadigan mamlakatda ro‘yxatdan o‘tgan bo‘lishi kerak. Noto‘g‘ri mamlakat yoki shaxs ma’lumotlari bilan akkaunt ochmang.

Stripe mos kelmasa, biznesingizga xizmat ko‘rsatadigan xalqaro provayder yoki bankingizning Visa/Mastercard internet acquiring xizmatini tanlang va USD hisob-kitobi mavjudligini ulardan tasdiqlang. Boshqa provayder tanlansa, uning checkout/callback adapterini qo‘shish zarur; hozirgi USD adapteri Stripe uchundir. Provayder nomi tanlanmaguncha xalqaro to‘lov tugmasi ishga tushirilmaydi.

Stripe mos kelganda:

1. [Stripe Dashboard](https://dashboard.stripe.com/register) da haqiqiy biznes ma’lumotlari bilan ro‘yxatdan o‘ting va verifikatsiyani tugating.
2. Test secret key’ni `STRIPE_SECRET_KEY` ga kiriting. Bu server kaliti, `VITE_` o‘zgaruvchisiga yozilmaydi.
3. Webhook endpoint yarating: `https://profai.uz/api/v1/billing/callbacks/stripe`. Eventlar: `checkout.session.completed`, `checkout.session.async_payment_succeeded`.
4. Endpoint signing secret’ni `STRIPE_WEBHOOK_SECRET` ga kiriting. Checkout success sahifasi to‘lov tasdig‘i emas: to‘g‘ri imzolangan webhook va aniq USD summa talab etiladi.
5. Stripe test rejimida muvaffaqiyatli, rad etilgan va takroriy webhook holatlarini tekshiring. Bekor qilish serverda checkout session’ni expire qiladi.
6. Business verifikatsiya va testlar tugagandan keyin production kalitlari va production webhook secret bilan almashtiring.

Rasmiy hujjatlar: [Checkout](https://docs.stripe.com/payments/checkout), [Webhooks](https://docs.stripe.com/webhooks).

## Server sozlamalari va ishga tushirish

Hostingning environment panelida quyidagilarni belgilang. Bu hujjatdagi joylar kalitlarning o‘zi emas.

```text
AUTOMATED_BILLING_ENABLED=false
BILLING_SITE_URL=https://profai.uz
PAYME_MERCHANT_ID=<merchant kabinetidan>
PAYME_SECRET_KEY=<server kaliti>
PAYME_CHECKOUT_URL=https://test.paycom.uz
CLICK_MERCHANT_ID=<merchant kabinetidan>
CLICK_SERVICE_ID=<merchant kabinetidan>
CLICK_SECRET_KEY=<server kaliti>
STRIPE_SECRET_KEY=<test yoki production secret key>
STRIPE_WEBHOOK_SECRET=<endpoint signing secret>
```

Avval backend build va yangi migration kerak:

```powershell
npm.cmd --prefix backend run build
npm.cmd --prefix backend run prisma:deploy
```

Production start skripti ham `prisma migrate deploy` bajaradi. Migration mavjud foydalanuvchilarni va eski Premium/to‘lov yozuvlarini saqlaydi. Deploymentdan oldin standart database backup oling. UI va backendni bir release sifatida chiqaring.

Merchant testlari vaqtida test kalitlarini qo‘llang; kerakli provayder sozlangach `AUTOMATED_BILLING_ENABLED=true` qiling. Faqat to‘liq sozlangan provayder tugmasi ochiladi. Konfiguratsiya brauzerga kalitlarni yubormaydi.

Owner dashboard yangi tanga/tarif mahsulotlarini qo‘lda berishi mumkin. Bular OWNER ledger yozuvi bilan qayd etiladi va to‘lov sifatida hisoblanmaydi. Onlayn buyurtmalarni owner to‘lov tasdig‘i o‘rniga APPROVED qila olmaydi. Eski karta o‘tkazmasi buyurtmalari eski jarayon bilan ko‘rib chiqiladi.

## Tekshirish

```powershell
npm.cmd run build
npm.cmd --prefix backend run test:billing
node scripts/test-listening-parts-ui.mjs scripts/tests/billing-access-ui.tsx
```

Avtomatik testlar haqiqiy kartadan pul olmaydi va production bazaga yozmaydi. Ular tarif summalari, hamyon cheklovlari, takroriy callbacklar, AI xatosida qaytarish va class ruxsatini tekshiradi. Haqiqiy merchant sandbox, database migration va jonli checkout tekshiruvi kalitlar ochilgandan keyin alohida bajariladi.
