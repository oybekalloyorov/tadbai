# Tadbai — Veb-sayt (frontend)

Bu papka `kob-fin-platform` backend (NestJS) uchun React + Vite + TypeScript
frontend'ni o'z ichiga oladi. Telegram botdagi barcha asosiy funksiyalar shu
yerda veb-sayt ko'rinishida ham mavjud:

- Ro'yxatdan o'tish / kirish (JWT autentifikatsiya)
- Kirim-chiqim (statistika, kategoriya bo'yicha grafik)
- Kredit kalkulyatori (annuitet/differensial, to'lovlar jadvali)
- Soliq kalkulyatori (yagona soliq, QQS, YATT qat'iy)
- Biznes-reja generatori (AI)
- Bozor tahlili (AI, SWOT)
- AI moliyaviy maslahatchi (chat)
- Profil

## O'rnatish va ishga tushirish (dasturchi rejimi)

```bash
cd frontend
npm install
npm run dev
```

Sayt `http://localhost:5173` da ochiladi. `/api/...` so'rovlar avtomatik
ravishda `http://localhost:7000` (backend) ga yo'naltiriladi (`vite.config.ts`
ichidagi `proxy` sozlamasi orqali). Agar backend boshqa portda ishlasa,
`vite.config.ts`dagi `target` qiymatini yoki `VITE_API_PROXY_TARGET`
muhit o'zgaruvchisini o'zgartiring.

**MUHIM:** backend'ning `.env` faylida `PORT` qiymati nechchi bo'lsa
(masalan sizda `7000`), `vite.config.ts`dagi proxy shu portga mos kelishi
kerak.

## Production uchun build qilish (backend bilan bitta serverda)

```bash
cd frontend
npm install
npm run build
```

Bu `frontend/dist/` papkasini yaratadi. Backend (`src/main.ts`) endi shu
papkani avtomatik aniqlab, statik fayl sifatida serve qiladi — ya'ni
backend serverini oddiy tartibda ishga tushirsangiz bo'ldi:

```bash
cd ..            # kob-fin-platform papkasiga qaytish
npm run build     # yoki npm run start:dev / start:prod
```

Endi `http://localhost:7000` manzilining o'zi veb-saytni ko'rsatadi (API esa
`http://localhost:7000/api/v1/...` da ishlashda davom etadi).

## Muhit o'zgaruvchilari

`.env.example` faylidan nusxa oling:

```bash
cp .env.example .env
```

- `VITE_API_BASE_URL` — production build uchun backend API manzili
  (masalan `https://api.tadbai.uz/api/v1`). Dasturchi rejimida bo'sh
  qoldirilsa, `vite.config.ts`dagi proxy orqali ishlaydi.

## Loyiha tuzilishi

```
frontend/
  src/
    api/          — axios client, endpoint funksiyalari, TypeScript turlari
    context/       — AuthContext (login/register/logout, JWT saqlash)
    components/    — Layout (sidebar), ProtectedRoute
    pages/         — har bir sahifa (Login, Dashboard, Transactions, ...)
    utils/         — formatSum, formatDate kabi yordamchi funksiyalar
```
