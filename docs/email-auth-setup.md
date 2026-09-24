# Gmail tasdiqlash kodlarini yoqish

Kirish oynasidagi **Email code** orqali mavjud akkaunt ochiladi yoki yangi
akkaunt yaratiladi. **Forgot password?** orqali kod bilan yangi parol belgilanadi.
Kod 10 daqiqa amal qiladi, bir marta ishlatiladi va 5 ta xato urinishdan so'ng
bloklanadi. Qayta yuborish oralig'i kamida 60 soniya.

## Server sozlamasi

1. Resend hisobida yuboruvchi domenni DNS orqali tasdiqlang. Masalan, `profai.uz`
   faqat shu domen sizga tegishli va tasdiqlangan bo'lsa ishlatiladi.
2. Shu domendan email yuborish huquqi bor Resend API kalitini yarating.
3. Backend hostingining environment/variables bo'limida quyidagilarni o'rnating:

   ```text
   RESEND_API_KEY=<Resend maxfiy API kaliti>
   AUTH_EMAIL_FROM=ProfAI <accounts@tasdiqlangan-domeningiz.uz>
   ```

4. Backendni qayta ishga tushiring yoki redeploy qiling. Lokal ishlash uchun
   ushbu qiymatlarni faqat `backend/.env` ichiga yozing. Kalitni Git, frontend
   yoki `VITE_` o'zgaruvchilariga qo'ymang.
5. O'zingizning Gmail manzilingiz bilan kod so'rang, Inbox/Spamni tekshiring.
   Mavjud akkauntning natijalari saqlanganini, yangi akkaunt onboardingga
   o'tishini va parolni tiklagach yangi parol bilan kirishni sinang.

Kalit bo'lmasa API `503 EMAIL_NOT_CONFIGURED` qaytaradi. API javobida kod
qaytarilmaydi va maydon avtomatik to'ldirilmaydi. Provider xatosida
`503 EMAIL_DELIVERY_FAILED` qaytadi; Resend panelida yuboruvchi domen,
API kalit huquqlari va delivery loglarini tekshiring.

Email provayderi so'rovni qabul qilishi Gmailga yetib borganini kafolatlamaydi:
yakuniy tekshiruv haqiqiy pochta qutisida bajariladi.

Rasmiy yo'riqnoma: https://resend.com/docs/send-with-nodejs

## Avtomatlashtirilgan tekshiruv

```text
npm --prefix backend run build
node --test backend/scripts/auth-email.test.mjs
node scripts/test-email-auth-ui.mjs
```

Testlar email provayderi va ma'lumotlar bazasini xotiradagi test adapterlari
bilan almashtiradi; haqiqiy email yubormaydi va mavjud akkauntlarni o'zgartirmaydi.
