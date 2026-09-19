import { Logger } from '@nestjs/common';
import { Markup, Telegraf } from 'telegraf';
import { BotContext } from './telegram.types';
import {
  BUSINESS_PLAN_WIZARD_ID,
  EXPENSE_WIZARD_ID,
  INCOME_WIZARD_ID,
  LOAN_WIZARD_ID,
  MAIN_MENU_BUTTONS,
  MARKET_ANALYSIS_WIZARD_ID,
  STATS_PERIOD_BUTTONS,
  TAX_WIZARD_ID,
} from './telegram.constants';
import { ChatService } from '../chat/chat.service';
import { User } from '../common/entities/user.entity';
import { formatSom, getUserId, replyLong } from './utils/message.util';
import { StatsPeriod, TransactionsService } from 'src/transactions/transactions.service';
import { TransactionType } from 'src/transactions/entities/transaction.entity';

interface HandlerDeps {
  chatService: ChatService;
  transactionsService: TransactionsService;
  logger: Logger;
}

const WELCOME_TEXT = `
🇺🇿 *KOB Moliyaviy Yordamchi botiga xush kelibsiz!*

Men kichik va oʻrta biznes egalari uchun quyidagi xizmatlarni taqdim etaman:

💰 */kirim* — Biznesingizga kirim (daromad) qoʻshish
📉 */chiqim* — Biznesingizga chiqim (xarajat) qoʻshish
📈 */statistika* — Kirim-chiqimlaringiz boʻyicha statistika va hisobot
💳 */kredit* — Kredit toʻlovlarini hisoblash (annuitet/differensial)
🧾 */soliq* — Soliq hisob-kitobi (yagona soliq, QQS, YATT)
📋 */biznesreja* — AI yordamida toʻliq biznes-reja tuzish
📊 */tahlil* — Soha va joylashuv boʻyicha bozor tahlili
💬 Istalgan boshqa savolni shunchaki yozing — AI moliyaviy maslahatchi javob beradi

Bot shunchaki AI bilan suhbatlashish emas — u SIZNING oʻz biznesingiz
kirim-chiqimlarini kuzatib boradi va real statistikangizni koʻrsatadi!

Har qanday bosqichda /bekor buyrugʻi bilan jarayonni toʻxtatishingiz mumkin.
`.trim();

const HELP_TEXT = `
📖 *Buyruqlar roʻyxati*

/start — Botni qayta ishga tushirish va bosh menyu
/kirim — Kirim (daromad) qoʻshish
/chiqim — Chiqim (xarajat) qoʻshish
/statistika — Kirim-chiqim statistikasi
/kredit — Kredit kalkulyatori
/soliq — Soliq kalkulyatori
/biznesreja — AI biznes-reja generatori
/tahlil — AI bozor tahlili
/bekor — Joriy jarayonni bekor qilish
/help — Ushbu yordam xabari

Bulardan tashqari istalgan moliyaviy savolingizni oddiy matn sifatida yozsangiz,
AI moliyaviy maslahatchi sizga javob beradi.
`.trim();

function barChart(part: number, total: number, width = 12): string {
  if (total <= 0) return '░'.repeat(width);
  const filled = Math.max(0, Math.min(width, Math.round((part / total) * width)));
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function periodFromLabel(text: string): StatsPeriod | null {
  if (text.includes('Bugun')) return 'today';
  if (text.includes('hafta')) return 'week';
  if (text.includes('oy')) return 'month';
  if (text.includes('Barchasi')) return 'all';
  return null;
}

async function sendStatsReport(
  ctx: BotContext,
  transactionsService: TransactionsService,
  userId: string,
  period: StatsPeriod,
): Promise<void> {
  const summary = await transactionsService.getSummary(userId, period);
  const recent = await transactionsService.getRecent(userId, 5);

  const lines: string[] = [
    `📈 STATISTIKA — ${summary.periodLabel}`,
    '',
    `💰 Umumiy kirim: ${formatSom(summary.totalIncome)}`,
    `📉 Umumiy chiqim: ${formatSom(summary.totalExpense)}`,
    `${summary.net >= 0 ? '✅' : '⚠️'} Sof foyda/zarar: ${formatSom(summary.net)}`,
    `🧾 Jami yozuvlar: ${summary.transactionCount}`,
    '',
  ];

  if (summary.incomeByCategory.length > 0) {
    lines.push('💰 KIRIMLAR (kategoriya boʻyicha):');
    for (const item of summary.incomeByCategory) {
      lines.push(
        `${barChart(item.amount, summary.totalIncome)} ${item.category}: ${formatSom(item.amount)}`,
      );
    }
    lines.push('');
  }

  if (summary.expenseByCategory.length > 0) {
    lines.push('📉 CHIQIMLAR (kategoriya boʻyicha):');
    for (const item of summary.expenseByCategory) {
      lines.push(
        `${barChart(item.amount, summary.totalExpense)} ${item.category}: ${formatSom(item.amount)}`,
      );
    }
    lines.push('');
  }

  if (recent.length > 0) {
    lines.push("🕒 Soʻnggi yozuvlar:");
    for (const tx of recent) {
      const sign = tx.type === TransactionType.INCOME ? '💰+' : '📉-';
      lines.push(
        `${sign} ${formatSom(Number(tx.amount))} — ${tx.category} (${new Date(
          tx.occurredAt,
        ).toLocaleDateString('ru-RU')})`,
      );
    }
    lines.push('');
  }

  if (summary.transactionCount === 0) {
    lines.push(
      "Hali hech qanday yozuv yoʻq. 💰 Kirim qoʻshish yoki 📉 Chiqim qoʻshish tugmalari orqali boshlang!",
    );
  }

  await replyLong(ctx, lines.join('\n'));
}

function mainMenuKeyboard() {
  return Markup.keyboard(MAIN_MENU_BUTTONS).resize();
}

export function registerMainHandlers(
  bot: Telegraf<BotContext>,
  deps: HandlerDeps,
): void {
  const { chatService, transactionsService, logger } = deps;

  bot.start(async (ctx) => {
    await ctx.reply(WELCOME_TEXT, {
      parse_mode: 'Markdown',
      ...mainMenuKeyboard(),
    });
  });

  bot.help(async (ctx) => {
    await ctx.reply(HELP_TEXT, { parse_mode: 'Markdown' });
  });

  bot.command('bekor', async (ctx) => {
    await ctx.reply(
      "Hozircha faol jarayon yoʻq. Bosh menyu uchun /start buyrugʻini yuboring.",
      mainMenuKeyboard(),
    );
  });

  // --- Scene'larga kirish (buyruq va menyu tugmasi orqali) ---
  bot.command('kirim', (ctx) => ctx.scene.enter(INCOME_WIZARD_ID));
  bot.hears('💰 Kirim qoʻshish', (ctx) => ctx.scene.enter(INCOME_WIZARD_ID));

  bot.command('chiqim', (ctx) => ctx.scene.enter(EXPENSE_WIZARD_ID));
  bot.hears('📉 Chiqim qoʻshish', (ctx) => ctx.scene.enter(EXPENSE_WIZARD_ID));

  bot.command('statistika', async (ctx) => {
    await ctx.reply(
      "Qaysi davr boʻyicha statistikani koʻrmoqchisiz?",
      Markup.keyboard(STATS_PERIOD_BUTTONS).resize(),
    );
  });
  bot.hears('📈 Statistika', async (ctx) => {
    await ctx.reply(
      "Qaysi davr boʻyicha statistikani koʻrmoqchisiz?",
      Markup.keyboard(STATS_PERIOD_BUTTONS).resize(),
    );
  });

  bot.hears(['📅 Bugun', '📆 Bu hafta', '🗓 Bu oy', '📊 Barchasi'], async (ctx) => {
    const userId = getUserId(ctx);
    if (!userId) {
      await ctx.reply(
        "❌ Foydalanuvchi aniqlanmadi. Iltimos, /start buyrugʻi orqali qaytadan boshlang.",
      );
      return;
    }

    const text = ctx.message && 'text' in ctx.message ? ctx.message.text : '';
    const period = periodFromLabel(text || '') || 'month';

    try {
      await ctx.sendChatAction('typing').catch(() => undefined);
      await sendStatsReport(ctx, transactionsService, userId, period);
    } catch (error) {
      logger.error('Statistikani olishda xatolik', error as Error);
      await ctx.reply(
        "❌ Statistikani olishda xatolik yuz berdi. Birozdan so'ng qaytadan urinib ko'ring.",
      );
    }
  });

  bot.command('kredit', (ctx) => ctx.scene.enter(LOAN_WIZARD_ID));
  bot.hears('💳 Kredit kalkulyatori', (ctx) => ctx.scene.enter(LOAN_WIZARD_ID));

  bot.command('soliq', (ctx) => ctx.scene.enter(TAX_WIZARD_ID));
  bot.hears('🧾 Soliq kalkulyatori', (ctx) => ctx.scene.enter(TAX_WIZARD_ID));

  bot.command('biznesreja', (ctx) => ctx.scene.enter(BUSINESS_PLAN_WIZARD_ID));
  bot.hears('📋 Biznes-reja tuzish', (ctx) =>
    ctx.scene.enter(BUSINESS_PLAN_WIZARD_ID),
  );

  bot.command('tahlil', (ctx) => ctx.scene.enter(MARKET_ANALYSIS_WIZARD_ID));
  bot.hears('📊 Bozor tahlili', (ctx) =>
    ctx.scene.enter(MARKET_ANALYSIS_WIZARD_ID),
  );

  bot.hears('❓ Yordam', async (ctx) => {
    await ctx.reply(HELP_TEXT, { parse_mode: 'Markdown' });
  });

  bot.hears('💬 AI bilan suhbat', async (ctx) => {
    await ctx.reply(
      "Savolingizni shunchaki yozing — men moliyaviy maslahatchi sifatida javob beraman. 🙂",
    );
  });

  // --- Erkin matn: hech qanday scene ichida bo'lmasa, AI chatga yuboriladi ---
  bot.on('text', async (ctx) => {
    const text = ctx.message?.text?.trim();
    if (!text || text.startsWith('/')) {
      return;
    }

    const userId = getUserId(ctx);
    if (!userId) {
      await ctx.reply(
        "❌ Foydalanuvchi aniqlanmadi. Iltimos, /start buyrugʻi orqali qaytadan boshlang.",
      );
      return;
    }

    try {
      await ctx.sendChatAction('typing').catch(() => undefined);

      // BUG FIX: ilgari `ctx.session` to'g'ridan-to'g'ri cast qilinib
      // ishlatilardi — agar ctx.session biror sababga ko'ra undefined
      // bo'lib qolsa (masalan Telegraf session middleware'ining ba'zi
      // holatlarda), "Cannot read/set properties of undefined" xatoligi
      // yuzaga kelardi. Endi bu yerda ham himoyalangan holda ishlatiladi —
      // eng yomon holatda suhbat tarixi saqlanmaydi, lekin bot qulamaydi.
      let session: Record<string, any>;
      try {
        if (!ctx.session) {
          (ctx as { session?: Record<string, any> }).session = {};
        }
        session = ctx.session as Record<string, any>;
      } catch {
        session = {};
      }

      const userRef = { id: userId } as User;

      const response = await chatService.sendMessage(userRef, {
        message: text,
        conversationId: session.conversationId,
      });

      try {
        session.conversationId = response.conversationId;
      } catch {
        // Suhbat ID'sini saqlab bo'lmasa ham, javobni yuborishda davom etamiz.
      }

      await replyLong(ctx, response.reply);
    } catch (error) {
      logger.error('AI chat xabarini yuborishda xatolik', error as Error);
      await ctx.reply(
        "❌ AI xizmati vaqtincha ishlamayapti. Iltimos, birozdan so'ng qaytadan urinib ko'ring.",
      );
    }
  });
}