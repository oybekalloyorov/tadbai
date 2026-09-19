import { Markup, Scenes } from 'telegraf';
import { BotContext } from '../telegram.types';
import { LOAN_WIZARD_ID } from '../telegram.constants';
import { LoanCalculatorService } from '../../loan-calculator/loan-calculator.service';
import { PaymentMethod } from '../../loan-calculator/entities/loan-calculation.entity';
import {
  formatSom,
  getMessageText,
  isCancelCommand,
  removeKeyboard,
  replyLong,
} from '../utils/message.util';

interface LoanWizardState {
  loanAmount?: number;
  annualRate?: number;
  termMonths?: number;
}

function parseNumber(text: string | undefined): number | null {
  if (!text) return null;
  const normalized = text.replace(/\s/g, '').replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export function createLoanWizard(
  loanCalculatorService: LoanCalculatorService,
): Scenes.WizardScene<BotContext> {
  const askAmount = async (ctx: BotContext) => {
    await ctx.reply(
      "🏦 *Kredit kalkulyatori*\n\nKredit summasini so'mda kiriting.\nMasalan: `50000000`\n\nBekor qilish uchun /bekor buyrug'ini yuboring.",
      { parse_mode: 'Markdown', ...removeKeyboard() },
    );
    return ctx.wizard.next();
  };

  const askRate = async (ctx: BotContext) => {
    const text = getMessageText(ctx);

    if (isCancelCommand(text)) {
      await ctx.reply("Bekor qilindi. Bosh menyu uchun /start.", removeKeyboard());
      return ctx.scene.leave();
    }

    const amount = parseNumber(text);
    if (amount === null || amount <= 0) {
      await ctx.reply(
        "⚠️ Iltimos, to'g'ri son kiriting (faqat raqamlar). Masalan: 50000000",
      );
      return;
    }

    (ctx.wizard.state as LoanWizardState).loanAmount = amount;
    await ctx.reply("Yillik foiz stavkasini kiriting (%).\nMasalan: `24`", {
      parse_mode: 'Markdown',
    });
    return ctx.wizard.next();
  };

  const askTerm = async (ctx: BotContext) => {
    const text = getMessageText(ctx);

    if (isCancelCommand(text)) {
      await ctx.reply("Bekor qilindi. Bosh menyu uchun /start.", removeKeyboard());
      return ctx.scene.leave();
    }

    const rate = parseNumber(text);
    if (rate === null || rate < 0 || rate > 100) {
      await ctx.reply(
        "⚠️ Iltimos, 0 dan 100 gacha bo'lgan son kiriting. Masalan: 24",
      );
      return;
    }

    (ctx.wizard.state as LoanWizardState).annualRate = rate;
    await ctx.reply("Kredit muddatini oy hisobida kiriting.\nMasalan: `12`", {
      parse_mode: 'Markdown',
    });
    return ctx.wizard.next();
  };

  const askMethod = async (ctx: BotContext) => {
    const text = getMessageText(ctx);

    if (isCancelCommand(text)) {
      await ctx.reply("Bekor qilindi. Bosh menyu uchun /start.", removeKeyboard());
      return ctx.scene.leave();
    }

    const term = text ? parseInt(text, 10) : NaN;
    if (!Number.isInteger(term) || term <= 0 || term > 360) {
      await ctx.reply(
        "⚠️ Iltimos, 1 dan 360 gacha bo'lgan butun son kiriting. Masalan: 12",
      );
      return;
    }

    (ctx.wizard.state as LoanWizardState).termMonths = term;

    await ctx.reply("To'lov usulini tanlang:", {
      ...Markup.keyboard([['📊 Annuitet', '📉 Differensial'], ['/bekor']])
        .resize()
        .oneTime(),
    });
    return ctx.wizard.next();
  };

  const finish = async (ctx: BotContext) => {
    const text = getMessageText(ctx) || '';

    if (isCancelCommand(text)) {
      await ctx.reply("Bekor qilindi. Bosh menyu uchun /start.", removeKeyboard());
      return ctx.scene.leave();
    }

    let method: PaymentMethod;
    if (text.includes('Annuitet')) {
      method = PaymentMethod.ANNUITET;
    } else if (text.includes('Differensial')) {
      method = PaymentMethod.DIFFERENSIAL;
    } else {
      await ctx.reply(
        "⚠️ Iltimos, tugmalardan birini tanlang: 📊 Annuitet yoki 📉 Differensial",
      );
      return;
    }

    const state = ctx.wizard.state as LoanWizardState;

    try {
      const result = loanCalculatorService.calculate({
        loanAmount: state.loanAmount as number,
        annualRate: state.annualRate as number,
        termMonths: state.termMonths as number,
        paymentMethod: method,
      });

      const lines: string[] = [
        '✅ *Hisob-kitob natijasi*',
        '',
        `💰 Kredit summasi: ${formatSom(result.loanAmount)}`,
        `📈 Yillik stavka: ${state.annualRate}%`,
        `📅 Muddat: ${state.termMonths} oy`,
        `🧮 To'lov usuli: ${method === PaymentMethod.ANNUITET ? 'Annuitet (teng to\'lovlar)' : 'Differensial (kamayib boruvchi)'}`,
        '',
      ];

      if (result.monthlyPayment) {
        lines.push(`💳 Oylik to'lov: ${formatSom(result.monthlyPayment)}`);
      } else {
        lines.push(`💳 Birinchi oylik to'lov: ${formatSom(result.firstPayment)}`);
        lines.push(`💳 Oxirgi oylik to'lov: ${formatSom(result.lastPayment)}`);
      }

      lines.push(`📊 Umumiy to'lov: ${formatSom(result.totalPayment)}`);
      lines.push(`💸 Umumiy foiz to'lovi: ${formatSom(result.totalInterest)}`);
      lines.push('');
      lines.push(
        "Yangi hisob-kitob uchun /kredit, bosh menyu uchun /start buyrug'ini yuboring.",
      );

      await replyLong(ctx, lines.join('\n'), {
        parse_mode: 'Markdown',
        ...removeKeyboard(),
      });
    } catch (error) {
      await ctx.reply(
        "❌ Hisoblashda xatolik yuz berdi. Iltimos, /kredit orqali qaytadan urinib ko'ring.",
        removeKeyboard(),
      );
    }

    return ctx.scene.leave();
  };

  return new Scenes.WizardScene<BotContext>(
    LOAN_WIZARD_ID,
    askAmount,
    askRate,
    askTerm,
    askMethod,
    finish,
  );
}