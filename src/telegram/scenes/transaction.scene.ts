import { Markup, Scenes } from 'telegraf';
import { BotContext } from '../telegram.types';
import { User } from '../../common/entities/user.entity';
import {
  formatSom,
  getMessageText,
  getUserId,
  isCancelCommand,
  isSkipCommand,
  removeKeyboard,
} from '../utils/message.util';
import { TransactionsService } from 'src/transactions/transactions.service';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, TransactionType } from 'src/transactions/entities/transaction.entity';

interface TransactionWizardState {
  amount?: number;
  category?: string;
}

function parseNumber(text: string | undefined): number | null {
  if (!text) return null;
  const normalized = text.replace(/\s/g, '').replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function categoryKeyboard(categories: string[]) {
  const rows: string[][] = [];
  for (let i = 0; i < categories.length; i += 2) {
    rows.push(categories.slice(i, i + 2));
  }
  rows.push(['/bekor']);
  return Markup.keyboard(rows).resize().oneTime();
}

/**
 * Kirim yoki chiqim qo'shish uchun 3 bosqichli suhbat:
 * 1) Summa -> 2) Kategoriya -> 3) Izoh (ixtiyoriy) -> saqlash
 *
 * Bitta factory funksiya orqali ikkala (kirim/chiqim) wizard ham yasaladi —
 * faqat `type` va `wizardId` farq qiladi, boshqa hamma narsa bir xil.
 */
export function createTransactionWizard(
  transactionsService: TransactionsService,
  type: TransactionType,
  wizardId: string,
): Scenes.WizardScene<BotContext> {
  const isIncome = type === TransactionType.INCOME;
  const categories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const title = isIncome ? '💰 Kirim qoʻshish' : '📉 Chiqim qoʻshish';
  const noun = isIncome ? 'kirim' : 'chiqim';

  const askAmount = async (ctx: BotContext) => {
    await ctx.reply(
      `${title}\n\nSumma (so'mda) kiriting.\nMasalan: 500000\n\nBekor qilish uchun /bekor buyrug'ini yuboring.`,
      removeKeyboard(),
    );
    return ctx.wizard.next();
  };

  const askCategory = async (ctx: BotContext) => {
    const text = getMessageText(ctx);

    if (isCancelCommand(text)) {
      await ctx.reply("Bekor qilindi. Bosh menyu uchun /start.", removeKeyboard());
      return ctx.scene.leave();
    }

    const amount = parseNumber(text);
    if (amount === null || amount <= 0) {
      await ctx.reply(
        "⚠️ Iltimos, to'g'ri son kiriting (faqat raqamlar). Masalan: 500000",
      );
      return;
    }

    (ctx.wizard.state as TransactionWizardState).amount = amount;

    await ctx.reply('Kategoriyani tanlang:', categoryKeyboard(categories));
    return ctx.wizard.next();
  };

  const askNote = async (ctx: BotContext) => {
    const text = getMessageText(ctx);

    if (isCancelCommand(text)) {
      await ctx.reply("Bekor qilindi. Bosh menyu uchun /start.", removeKeyboard());
      return ctx.scene.leave();
    }

    if (!text || !categories.includes(text)) {
      await ctx.reply(
        '⚠️ Iltimos, taklif qilingan kategoriyalardan birini tugma orqali tanlang.',
        categoryKeyboard(categories),
      );
      return;
    }

    (ctx.wizard.state as TransactionWizardState).category = text;

    await ctx.reply(
      "Izoh qoldirmoqchimisiz? Yozing yoki o'tkazib yuborish uchun \"-\" belgisini yuboring.",
      removeKeyboard(),
    );
    return ctx.wizard.next();
  };

  const finish = async (ctx: BotContext) => {
    const text = getMessageText(ctx) || '';

    if (isCancelCommand(text)) {
      await ctx.reply("Bekor qilindi. Bosh menyu uchun /start.", removeKeyboard());
      return ctx.scene.leave();
    }

    const state = ctx.wizard.state as TransactionWizardState;
    const note = isSkipCommand(text) ? null : text;

    const userId = getUserId(ctx);
    if (!userId) {
      await ctx.reply(
        "❌ Foydalanuvchi aniqlanmadi. Iltimos, /start buyrugʻi orqali qaytadan boshlang.",
      );
      return ctx.scene.leave();
    }

    try {
      const userRef = { id: userId } as User;
      const saved = await transactionsService.create(userRef, {
        type,
        amount: state.amount as number,
        category: state.category as string,
        note: note || undefined,
      });

      const lines = [
        `✅ ${isIncome ? 'Kirim' : 'Chiqim'} saqlandi!`,
        '',
        `💵 Summa: ${formatSom(Number(saved.amount))}`,
        `🏷 Kategoriya: ${saved.category}`,
      ];
      if (saved.note) {
        lines.push(`📝 Izoh: ${saved.note}`);
      }
      lines.push('');
      lines.push(
        `Yana ${noun} qo'shish uchun ${isIncome ? "💰 Kirim qoʻshish" : "📉 Chiqim qoʻshish"
        } tugmasini bosing yoki statistikani koʻrish uchun 📈 Statistika tugmasini bosing.`,
      );

      await ctx.reply(lines.join('\n'));
    } catch (error) {
      await ctx.reply(
        `❌ ${isIncome ? 'Kirimni' : "Chiqimni"} saqlashda xatolik yuz berdi. Qaytadan urinib ko'ring.`,
      );
    }

    return ctx.scene.leave();
  };

  return new Scenes.WizardScene<BotContext>(
    wizardId,
    askAmount,
    askCategory,
    askNote,
    finish,
  );
}