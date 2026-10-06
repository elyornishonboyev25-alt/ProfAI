# Tanlangan akkauntlar: muddatsiz kirish va 14 kunlik bepul sinov

| Akkaunt | Kirish |
| --- | --- |
| aysunabbaszad0@gmail.com | Muddatsiz, tangalarsiz to‘liq kirish |
| oguzmemmedli123@gmail.com | Muddatsiz, tangalarsiz to‘liq kirish |
| wiynsara@gmail.com | Muddatsiz, tangalarsiz to‘liq kirish |
| bahadyrazat@gmail.com | Muddatsiz, tangalarsiz to‘liq kirish |
| usarovajasmin@gmail.com | 14 kunlik bepul sinov, tangalarsiz to‘liq kirish |

Bu huquqlar faqat shu beshta mavjud akkauntga tegishli. Akkaunt roli ADMIN ga o‘zgarmaydi. IELTS/SAT testlari, mock, podcast, shadowing va AI uchun tanga olinmaydi. Bu tanlangan to‘liq kirish class yaratish imkoniyatini ham beradi; class ichidagi a’zolik va o‘qituvchi huquqlari saqlanadi.

Sinov `20261006120000_selected_account_access` migration qo‘llangan vaqtdan boshlanadi va 14 × 24 soat davom etadi. Kirish, sahifani yangilash yoki deploymentni takrorlash sinovni uzaytirmaydi. Sinov tugagach oddiy tanga/tarif qoidalari qaytadi; saqlangan natijalar va bepul mashqlar qoladi. Avtomatik to‘lov bo‘lmaydi. Muddat kartada Toshkent vaqti bilan ko‘rsatiladi.

## Ishga tushirish

Production backendning server sozlamalarida ishlaydigan `DATABASE_URL` bo‘lishi kerak. Kalit va parollarni chatga yoki Gitga joylamang. Ushbu vazifada mahalliy sozlangan ulanish akkauntlarni tekshirishga imkon bermadi; jonli bazaga huquqlar yozilgan deb hisoblamang.

Backend va frontendni bir release sifatida chiqaring. Production `start` skripti `prisma migrate deploy` bajaradi. Qo‘lda migration kerak bo‘lsa, production serverning `backend` katalogida:

```powershell
npm.cmd run prisma:deploy
```

Linux serverda `npm run prisma:deploy` ishlatiladi. Migration yangi akkaunt yaratmaydi va boshqa emailga huquq bermaydi. Deploymentdan keyin owner dashboarddan aynan shu beshta emailni qidiring, to‘rtta UNLIMITED va bitta TRIAL_14 yozuvi borligini tasdiqlang. Sinovning `expiresAt - startsAt` farqi 14 kun bo‘lishi kerak. Har bir akkauntga qayta kirib, dashboard, tariflar va yuqoridagi badge holatini tekshiring.

Owner dashboarddagi “14 kunlik bepul sinov muddati” tanlovi qo‘lda yangi sinov berish uchun ishlatiladi; bu ongli administrator amali yangi 14 kunlik muddatni boshlaydi. Oddiy foydalanuvchi sinovni o‘zi uzaytira olmaydi.

## Tekshiruvlar

```powershell
npm.cmd --prefix backend run test:billing
node scripts/test-listening-parts-ui.mjs scripts/tests/billing-entitlement-ui.tsx
node scripts/test-listening-parts-ui.mjs scripts/tests/billing-access-ui.tsx
npm.cmd run build
```

Avtomatik testlar production bazaga yozmaydi. Ular nol balansda muddatsiz/sinov kirishini, sinovning aniq tugash chegarasini, tangalar saqlanishini, class huquqi tugashini, ochiq sahifada muddatni qayta tekshirishni va o‘zbekcha kartalarni tekshiradi.
