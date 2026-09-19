import {
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Scenes, Telegraf, session } from 'telegraf';
import { BotContext } from './telegram.types';
import { UsersService } from '../users/users.service';
import { LoanCalculatorService } from '../loan-calculator/loan-calculator.service';
import { TaxCalculatorService } from '../tax-calculator/tax-calculator.service';
import { BusinessPlanService } from '../business-plan/business-plan.service';
import { MarketAnalysisService } from '../market-analysis/market-analysis.service';
import { ChatService } from '../chat/chat.service';
import { TransactionsService } from '../transactions/transactions.service';
import { TransactionType } from '../transactions/entities/transaction.entity';
import { createLoanWizard } from './scenes/loan.scene';
import { createTaxWizard } from './scenes/tax.scene';
import { createBusinessPlanWizard } from './scenes/business-plan.scene';
import { createMarketAnalysisWizard } from './scenes/market-analysis.scene';
import { createTransactionWizard } from './scenes/transaction.scene';
import { registerMainHandlers } from './telegram.update';
import { EXPENSE_WIZARD_ID, INCOME_WIZARD_ID } from './telegram.constants';
import { getCachedUserId, setCachedUserId } from './utils/message.util';

@Injectable()
export class TelegramService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf<BotContext> | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly loanCalculatorService: LoanCalculatorService,
    private readonly taxCalculatorService: TaxCalculatorService,
    private readonly businessPlanService: BusinessPlanService,
    private readonly marketAnalysisService: MarketAnalysisService,
    private readonly chatService: ChatService,
    private readonly transactionsService: TransactionsService,
  ) { }

  async onModuleInit(): Promise<void> {
    const token = this.configService.get<string>('telegram.botToken');

    if (!token) {
      this.logger.warn(
        "TELEGRAM_BOT_TOKEN topilmadi — Telegram bot ishga tushirilmadi. " +
        ".env fayliga tokenni qo'shing va serverni qayta ishga tushiring.",
      );
      return;
    }

    this.bot = new Telegraf<BotContext>(token);

    const loanWizard = createLoanWizard(this.loanCalculatorService);
    const taxWizard = createTaxWizard(this.taxCalculatorService);
    const businessPlanWizard = createBusinessPlanWizard(
      this.businessPlanService,
    );
    const marketAnalysisWizard = createMarketAnalysisWizard(
      this.marketAnalysisService,
    );
    const incomeWizard = createTransactionWizard(
      this.transactionsService,
      TransactionType.INCOME,
      INCOME_WIZARD_ID,
    );
    const expenseWizard = createTransactionWizard(
      this.transactionsService,
      TransactionType.EXPENSE,
      EXPENSE_WIZARD_ID,
    );

    const stage = new Scenes.Stage<BotContext>([
      loanWizard,
      taxWizard,
      businessPlanWizard,
      marketAnalysisWizard,
      incomeWizard,
      expenseWizard,
    ]);

    this.bot.use(session());

    // Har bir yangilanishda Telegram foydalanuvchisini platforma
    // foydalanuvchisiga (shadow account) bog'laymiz.
    //
    // MUHIM (bug fix): ilgari userId FAQAT `ctx.session.userId` ichida
    // saqlanardi. Amalda ba'zi muhitlarda `ctx.session` kutilmaganda
    // `undefined` bo'lib qolib, "Cannot read properties of undefined
    // (reading 'userId')" xatoligiga olib kelgan (bu xatolik yuzaga kelganda
    // foydalanuvchi hech qachon aniqlanmagan va /kirim, /statistika kabi
    // funksiyalar "Foydalanuvchi aniqlanmadi" deb doimiy xato qaytargan).
    // Shu sababli endi userId asosiy manba sifatida `setCachedUserId` orqali
    // Telegraf'ning session mexanizmiga umuman bog'liq bo'lmagan oddiy
    // Map'da saqlanadi (`message.util.ts`dagi `getUserId` shu keshni o'qiydi).
    // ctx.session'ga yozish ham davom etadi (moslik uchun), lekin bu endi
    // faqat "best effort" — muvaffaqiyatsiz bo'lsa ham butun so'rovni
    // qulatmaydi.
    this.bot.use(async (ctx, next) => {
      const chatId = ctx.chat?.id;
      const cachedUserId = chatId ? getCachedUserId(chatId) : undefined;

      // DIQQAT: keshda allaqachon mavjud bo'lsa, har bir yangilanishda
      // bazaga ortiqcha (keraksiz) so'rov yubormaslik uchun qayta lookup
      // qilmaymiz.
      if (chatId && !cachedUserId) {
        try {
          const fullName =
            [ctx.from?.first_name, ctx.from?.last_name]
              .filter(Boolean)
              .join(' ')
              .trim() ||
            ctx.from?.username ||
            `Telegram-${chatId}`;

          const user = await this.usersService.findOrCreateByTelegramChatId(
            String(chatId),
            fullName,
            ctx.from?.username,
          );

          setCachedUserId(chatId, user.id);

          try {
            if (!ctx.session) {
              (ctx as { session?: Record<string, any> }).session = {};
            }
            (ctx.session as Record<string, any>).userId = user.id;
          } catch (sessionError) {
            // ctx.session bilan bog'liq muammo bo'lsa ham, userId yuqoridagi
            // doimiy keshda saqlangani uchun bot ishlashda davom etadi.
            this.logger.warn(
              `ctx.session'ga yozib bo'lmadi (kesh orqali davom etilmoqda): ${(sessionError as Error)?.message
              }`,
            );
          }
        } catch (error) {
          this.logger.error(
            'Foydalanuvchini aniqlashda xatolik',
            error as Error,
          );
        }
      }

      // Admin panelda "kim qaysi platformadan foydalanmoqda" statistikasi
      // uchun. `markPlatformActivity` ichida allaqachon 5 daqiqalik
      // "throttle" bor, shuning uchun bu yerda har bir xabarda chaqirilsa
      // ham bazaga ortiqcha yuklama tushmaydi. Botning javob berish
      // tezligiga ta'sir qilmasligi uchun kutilmaydi (fire-and-forget).
      const finalUserId = cachedUserId || (chatId ? getCachedUserId(chatId) : undefined);
      if (finalUserId) {
        this.usersService
          .markPlatformActivity(finalUserId, 'telegram')
          .catch((error) =>
            this.logger.warn(
              `Platforma faolligini belgilashda xatolik: ${(error as Error)?.message}`,
            ),
          );
      }

      return next();
    });

    this.bot.use(stage.middleware());

    registerMainHandlers(this.bot, {
      chatService: this.chatService,
      transactionsService: this.transactionsService,
      logger: this.logger,
    });

    this.bot.catch((error, ctx) => {
      this.logger.error(
        `Botda kutilmagan xatolik (chat: ${ctx.chat?.id})`,
        error as Error,
      );
      ctx
        .reply(
          "❌ Kutilmagan xatolik yuz berdi. Iltimos, /start buyrug'i orqali qaytadan urinib ko'ring.",
        )
        .catch(() => undefined);
    });

    // MUHIM: bot.launch() polling rejimida bot toʻxtatilmaguncha
    // (bot.stop() chaqirilmaguncha) hech qachon "resolve" boʻlmaydigan Promise
    // qaytaradi. Shuning uchun uni ASLO await qilib boʻlmaydi — aks holda
    // butun NestJS ilovasi (shu jumladan HTTP server) abadiy "ishga tushmoqda"
    // holatida qotib qoladi. Shuning uchun "fire-and-forget" tarzida chaqiramiz.
    this.launchWithRetry();
  }

  private launchWithRetry(attempt = 1): void {
    if (!this.bot) {
      return;
    }

    this.bot
      .launch()
      .then(() => {
        this.logger.log('🤖 Telegram bot muvaffaqiyatli ishga tushdi (polling)');
      })
      .catch((error) => {
        const delayMs = Math.min(5000 * attempt, 60000);
        this.logger.error(
          `Telegram botni ishga tushirishda xatolik yuz berdi (urinish ${attempt}). ` +
          `${delayMs / 1000} soniyadan so'ng qayta urinib ko'riladi. ` +
          "Bu odatda api.telegram.org'ga tarmoq ulanishi bilan bog'liq " +
          "(internet, VPN yoki provayder cheklovi) — kod xatosi emas.",
          error as Error,
        );
        setTimeout(() => this.launchWithRetry(attempt + 1), delayMs);
      });
  }

  onApplicationShutdown(signal?: string): void {
    if (this.bot) {
      try {
        this.bot.stop(signal);
        this.logger.log("Telegram bot to'xtatildi");
      } catch (error) {
        this.logger.warn(
          `Telegram botni to'xtatishda kichik muammo (e'tiborsiz qoldirildi): ${(error as Error)?.message
          }`,
        );
      }
    }
  }
}