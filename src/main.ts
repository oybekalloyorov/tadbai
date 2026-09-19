import { NestFactory, Reflector } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import {
  ClassSerializerInterceptor,
  ValidationPipe,
} from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { existsSync } from 'fs';
import { join } from 'path';
import { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const port = process.env.PORT || 3000;
  const apiPrefix = process.env.API_PREFIX || 'api/v1';

  app.use(helmet());
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.setGlobalPrefix(apiPrefix);
  // MUHIM (bug fix): ilgari bu yerda `app.enableVersioning(...)` ham
  // chaqirilardi. Lekin `API_PREFIX` (.env orqali, standart holatda
  // 'api/v1') ALLAQACHON "v1"ni o'z ichiga oladi — shu ustiga yana
  // versiyalash yoqilsa, NestJS haqiqiy yo'lga YANA BIR "v1" segmentini
  // qo'shib, so'rovlar aslida "/api/v1/v1/auth/register" kabi manzilda
  // eshitiladi (ishga tushirish logidagi "Mapped" qatori esa buni
  // chalkash — faqat bitta "v1" bilan — ko'rsatadi). Natijada frontend
  // (yoki har qanday to'g'ri "/api/v1/..." so'rovi) doimo 404 qaytarardi.
  // Chunki prefiksning o'zi versiyani allaqachon o'z ichiga oladi,
  // qo'shimcha versiyalash keraksiz va zararli — shuning uchun olib
  // tashlandi.

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
  );

  // Ilova to'xtatilganda (SIGINT/SIGTERM) Telegram bot ham to'g'ri
  // to'xtatilishi uchun (TelegramService.onApplicationShutdown chaqiriladi).
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('KOB Moliyaviy Yordamchi API')
    .setDescription(
      "Kichik va o'rta biznes subyektlari uchun AI asosidagi moliyaviy maslahatchi platforma: " +
      'biznes-reja, kredit kalkulyatori, soliq hisob-kitobi va bozor tahlili',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autentifikatsiya va ro\'yxatdan o\'tish')
    .addTag('users', 'Foydalanuvchi profili')
    .addTag('loan-calculator', 'Kredit kalkulyatori')
    .addTag('tax-calculator', 'Soliq kalkulyatori')
    .addTag('business-plan', 'Biznes-reja generatori')
    .addTag('market-analysis', 'Bozor tahlili')
    .addTag('chat', 'AI moliyaviy maslahatchi chatbot')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  // Ixtiyoriy: agar veb-sayt (frontend/) build qilingan bo'lsa
  // (npm run build --prefix frontend), NestJS uni ham statik fayl sifatida
  // serve qiladi — shunda backend va frontend BIR XIL portda ishlaydi va
  // alohida veb-server (nginx va h.k.) shart emas. Agar frontend hali build
  // qilinmagan bo'lsa (masalan faqat backend/Telegram bot bilan ishlayotgan
  // bo'lsangiz), bu qism jim o'tkazib yuboriladi — hech qanday xatolikka
  // olib kelmaydi.
  const frontendDist = join(__dirname, '..', 'frontend', 'dist');
  if (existsSync(frontendDist)) {
    app.useStaticAssets(frontendDist);

    // React Router (client-side routing) ishlashi uchun: /api/... va
    // /docs'dan tashqari BARCHA GET so'rovlariga frontend'ning index.html
    // fayli qaytariladi — shunda foydalanuvchi to'g'ridan-to'g'ri
    // https://sayt.uz/transactions kabi manzilga kirsa ham sahifa ochiladi
    // (aks holda Express "404 Not Found" qaytargan bo'lardi, chunki bunday
    // yo'l backend'da mavjud emas — u faqat React Router'ga tanish).
    app.getHttpAdapter().get(
      '*',
      (req: Request, res: Response, next: NextFunction) => {
        if (
          req.path.startsWith(`/${apiPrefix}`) ||
          req.path.startsWith('/docs')
        ) {
          return next();
        }
        res.sendFile(join(frontendDist, 'index.html'));
      },
    );

    // eslint-disable-next-line no-console
    console.log('🌐 Frontend (veb-sayt) statik fayllardan serve qilinmoqda');
  } else {
    // eslint-disable-next-line no-console
    console.log(
      "ℹ️  Frontend build topilmadi (frontend/dist) — faqat API/bot ishlaydi. " +
      "Veb-saytni ham shu serverdan ochish uchun: cd frontend && npm install && npm run build",
    );
  }

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`🚀 Server ishga tushdi: http://localhost:${port}/${apiPrefix}`);
  // eslint-disable-next-line no-console
  console.log(`📚 Swagger hujjatlari: http://localhost:${port}/docs`);
}

bootstrap();