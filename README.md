# KOB Moliyaviy Yordamchi Platformasi

Kichik va oʻrta biznes (KOB) subʼektlarining **moliyaviy savodxonligi past boʻlishi**,
**biznes-reja tuzish** va **kredit olish jarayonlarida qiyinchiliklar** muammosini hal
qilish uchun yaratilgan, sunʼiy intellektga asoslangan moliyaviy maslahatchi platformasi.

Backend **NestJS** (TypeScript) frameworkida, PostgreSQL maʼlumotlar bazasi va OpenAI
(yoki mos LLM) integratsiyasi bilan qurilgan.

## 🎯 Platforma imkoniyatlari

| Modul | Tavsif |
|---|---|
| **Auth / Users** | JWT asosidagi roʻyxatdan oʻtish, kirish, profil boshqaruvi |
| **Kredit kalkulyatori** | Annuitet va differensial usulda toʻlov jadvali, umumiy foiz hisob-kitobi |
| **Soliq kalkulyatori** | Yagona soliq, umumbelgilangan tartib (QQS + foyda solig'i), YATT qat'iy soliq |
| **Biznes-reja generatori** | AI yordamida toʻliq strukturaviy biznes-reja (SWOT, moliyaviy reja, risklar) |
| **Bozor tahlili** | Soha va joylashuv boʻyicha AI orqali bozor hajmi, raqobat va SWOT tahlili |
| **AI Chatbot** | Moliyaviy savollarga suhbat tarixini saqlagan holda javob beruvchi yordamchi |
| **Telegram bot** | Barcha yuqoridagi funksiyalarga Telegram orqali, bosqichma-bosqich suhbat shaklida kirish |

## 🏗️ Texnologiyalar

- **NestJS 10** + TypeScript
- **PostgreSQL** + TypeORM
- **JWT** (access + refresh token) autentifikatsiya
- **OpenAI SDK** (istalgan OpenAI-mos LLM provayder bilan ishlaydi)
- **Swagger** (OpenAPI) hujjatlashtirish
- **class-validator / class-transformer** — inputlarni tekshirish
- **Throttler** — soʻrovlar sonini cheklash (rate limiting)
- **Telegraf** — Telegram bot (wizard/scene asosida bosqichma-bosqich suhbat)
- **Docker / docker-compose** — konteynerlashtirish

## 📁 Loyiha strukturasi

```
src/
├── auth/                  # Autentifikatsiya (JWT, register, login, refresh)
├── users/                 # Foydalanuvchi profili
├── loan-calculator/       # Kredit kalkulyatori (annuitet/differensial)
├── tax-calculator/        # Soliq kalkulyatori
├── business-plan/         # AI biznes-reja generatori
├── market-analysis/       # AI bozor tahlili
├── chat/                  # AI moliyaviy chatbot
├── telegram/              # Telegram bot (scene'lar, buyruqlar, formatlash)
│   ├── scenes/            # Kredit/soliq/biznes-reja/tahlil wizard'lari
│   └── utils/             # Xabar bo'lish, pul formatlash va h.k.
├── common/
│   ├── ai/                # OpenAI bilan ishlaydigan umumiy AiService
│   ├── entities/          # User entity
│   ├── filters/           # Global xatoliklar filtri
│   ├── strategies/        # JWT Passport strategiyasi
│   └── decorators/         # @CurrentUser va h.k.
├── config/                # Konfiguratsiya va TypeORM sozlamalari
├── app.module.ts
└── main.ts
```

## 🚀 Ishga tushirish

### 1. Talablar
- Node.js 20+
- PostgreSQL 14+ (yoki Docker)

### 2. Sozlash

```bash
cp .env.example .env
# .env faylida DB va OPENAI_API_KEY qiymatlarini toʻldiring
npm install
```

### 3. Maʼlumotlar bazasini ishga tushirish (Docker orqali, ixtiyoriy)

```bash
docker compose up -d postgres
```

### 4. Ilovani ishga tushirish

```bash
npm run start:dev
```

Ilova manzili: `http://localhost:3000/api/v1`
Swagger hujjatlari: `http://localhost:3000/docs`

### 5. Docker orqali toʻliq ishga tushirish

```bash
docker compose up --build
```

## 🔐 Autentifikatsiya oqimi

1. `POST /api/v1/auth/register` — roʻyxatdan oʻtish
2. `POST /api/v1/auth/login` — kirish, `accessToken` va `refreshToken` olish
3. Himoyalangan endpointlarga `Authorization: Bearer <accessToken>` header bilan murojaat qilish
4. Token muddati tugasa: `POST /api/v1/auth/refresh`

## 📊 Asosiy API endpointlar

### Kredit kalkulyatori
```
POST /api/v1/loan-calculator/calculate
{
  "loanAmount": 50000000,
  "annualRate": 24,
  "termMonths": 12,
  "paymentMethod": "annuitet"
}
```

### Soliq kalkulyatori
```
POST /api/v1/tax-calculator/calculate
{
  "taxpayerType": "yagona_soliq",
  "annualRevenue": 500000000
}
```

### Biznes-reja generatori (autentifikatsiya talab qilinadi)
```
POST /api/v1/business-plan/generate
{
  "businessIdea": "Fast-food restorani",
  "industry": "Oziq-ovqat",
  "location": "Toshkent",
  "initialInvestment": 150000000
}
```

### Bozor tahlili (autentifikatsiya talab qilinadi)
```
POST /api/v1/market-analysis/analyze
{
  "industry": "Fitnes-klub xizmatlari",
  "location": "Toshkent, Yunusobod"
}
```

### AI Chatbot (autentifikatsiya talab qilinadi)
```
POST /api/v1/chat/message
{
  "message": "Kichik doʻkon ochish uchun qancha pul kerak boʻladi?"
}
```

To'liq soʻrov/javob namunalari va barcha maydonlar Swagger (`/docs`) sahifasida
koʻrsatilgan.

## 🤖 Telegram bot orqali ishlatish

Platformaning barcha asosiy funksiyalari (kredit kalkulyatori, soliq kalkulyatori,
biznes-reja, bozor tahlili, AI chat) Telegram bot orqali ham ishlaydi. Bot xuddi
shu NestJS ilovasi ichida ishga tushadi — alohida server yoki process kerak emas.

### 1. Bot yaratish va token olish

1. Telegramda [@BotFather](https://t.me/BotFather) bilan suhbatni boshlang
2. `/newbot` buyrug'ini yuboring va ko'rsatmalarga amal qiling (bot nomi va username so'raladi)
3. BotFather sizga token beradi, masalan: `123456789:AAExampleTokenXXXXXXXXXXXXXXXXXXXXX`

### 2. Tokenni sozlash

`.env` fayliga tokenni qo'shing:

```bash
TELEGRAM_BOT_TOKEN=123456789:AAExampleTokenXXXXXXXXXXXXXXXXXXXXX
```

### 3. Ma'lumotlar bazasini yangilash

Telegram foydalanuvchilari uchun `users` jadvaliga yangi ustunlar (`telegram_chat_id`,
`telegram_username`) qo'shildi. Agar `DB_SYNCHRONIZE=true` bo'lsa (dasturlash muhitida
tavsiya etiladi), TypeORM buni avtomatik yaratadi. Productionda migratsiya orqali
qo'shing:

```bash
npm run migration:generate -- src/database/migrations/AddTelegramFields
npm run migration:run
```

### 4. Ishga tushirish

```bash
npm run start:dev
```

Konsolda quyidagi xabarni ko'rasiz:

```
🤖 Telegram bot muvaffaqiyatli ishga tushdi (polling)
```

Agar `TELEGRAM_BOT_TOKEN` bo'sh bo'lsa, ilova xato bermaydi — shunchaki botni ishga
tushirmay, faqat HTTP API'ni ishga tushiradi va ogohlantirish (`warn`) yozadi.

### 5. Botdan foydalanish

Telegramda botingizni oching va `/start` buyrug'ini yuboring. Bot quyidagi
buyruqlar/tugmalar orqali ishlaydi:

| Buyruq | Vazifasi |
|---|---|
| `/start` | Botni ishga tushirish, bosh menyu |
| `/kredit` | Kredit kalkulyatori (bosqichma-bosqich savol-javob) |
| `/soliq` | Soliq kalkulyatori |
| `/biznesreja` | AI yordamida biznes-reja generatsiyasi |
| `/tahlil` | AI bozor tahlili |
| `/bekor` | Joriy jarayonni bekor qilish |
| `/help` | Yordam xabari |
| *(erkin matn)* | AI moliyaviy maslahatchiga savol sifatida yuboriladi |

**Ishlash tamoyili:** har bir Telegram foydalanuvchisi uchun tizim avtomatik ravishda
"soya" (shadow) akkaunt yaratadi (parol va email avtomatik generatsiya qilinadi), shu
sababli foydalanuvchi saytda alohida ro'yxatdan o'tishi shart emas — bot ichida barcha
funksiyalar darhol ishlaydi.

**Eslatma (production uchun):** hozirgi sessiya (suhbat holati) xotirada (in-memory)
saqlanadi — server qayta ishga tushsa, foydalanuvchi joriy bosqichini yo'qotadi (shunchaki
qaytadan `/kredit` va h.k. bosishi kifoya). Ko'p nusxali (replica) muhitda ishlatish uchun
`telegraf-session-redis` yoki shunga o'xshash Redis-based session storage qo'shish tavsiya
etiladi.

## ⚠️ Muhim eslatmalar

- **Soliq stavkalari** (`src/tax-calculator/tax-rates.constants.ts`) taxminiy boʻlib,
  har yili oʻzgarishi mumkin. Ishlab chiqarishdan oldin `soliq.uz` maʼlumotlari bilan
  tekshiring.
- AI moduli ishlashi uchun `.env` faylida haqiqiy `OPENAI_API_KEY` kerak. Kalit
  boʻlmasa AI endpointlari (biznes-reja, bozor tahlili, chatbot) xato qaytaradi.
- Ushbu platforma moliyaviy/soliq maslahatlarini **taxminiy va oʻquv maqsadida**
  taqdim etadi — rasmiy hujjat yoki litsenziyalangan mutaxassis xulosasi oʻrnini
  bosmaydi.

## 🗺️ Keyingi qadamlar (roadmap gʻoyalari)

- Bank/mikromoliya tashkilotlari bilan real kredit takliflarini solishtirish integratsiyasi
- Telegram bot uchun Redis-based session (ko'p nusxali deploy uchun)
- Ko'p tilli qo'llab-quvvatlash (rus, ingliz)
- PDF holida biznes-reja va soliq hisobotini eksport qilish (shu jumladan Telegramda fayl sifatida yuborish)
