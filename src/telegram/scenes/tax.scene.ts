import { Markup, Scenes } from 'telegraf';
import { BotContext } from '../telegram.types';
import { TAX_WIZARD_ID } from '../telegram.constants';
import { TaxCalculatorService } from '../../tax-calculator/tax-calculator.service';
import { TaxpayerType } from '../../tax-calculator/dto/calculate-tax.dto';
import {
  formatSom,
  getMessageText,
  isCancelCommand,
  removeKeyboard,
  replyLong,
} from '../utils/message.util';

interface TaxWizardState {
  taxpayerType?: TaxpayerType;
  annualRevenue?: number;
}

function parseNumber(text: string | undefined): number | null {
  if (!text) return null;
  const normalized = text.replace(/\s/g, '').replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

const TYPE_LABELS: Record<string, TaxpayerType> = {
  "1️⃣ yagona soliq": TaxpayerType.YAGONA_SOLIQ,
  "2️⃣ umumbelgilangan (qqs)": TaxpayerType.QQS_TOLOVCHI,
  "3️⃣ yatt qat'iy soliq": TaxpayerType.YATT_QATIY,
};

const REGION_LABELS: Record<string, string> = {
  'toshkent shahri': 'toshkent_shahar',
  'toshkent viloyati': 'toshkent_viloyat',
  'boshqa viloyat': 'boshqa_viloyatlar',
};

export function createTaxWizard(
  taxCalculatorService: TaxCalculatorService,
): Scenes.WizardScene<BotContext> {
  const askType = async (ctx: BotContext) => {
    await ctx.reply(
      "🧾 *Soliq kalkulyatori*\n\nSoliq toʻlovchi turingizni tanlang:",
      {
        parse_mode: 'Markdown',
        ...Markup.keyboard([
          ["1️⃣ Yagona soliq"],
          ["2️⃣ Umumbelgilangan (QQS)"],
          ["3️⃣ YATT qat'iy soliq"],
          ['/bekor'],
        ])
          .resize()
          .oneTime(),
      },
    );
    return ctx.wizard.next();
  };

  const askRevenue = async (ctx: BotContext) => {
    const text = getMessageText(ctx);

    if (isCancelCommand(text)) {
      await ctx.reply("Bekor qilindi. Bosh menyu uchun /start.", removeKeyboard());
      return ctx.scene.leave();
    }

    const type = text ? TYPE_LABELS[text.trim().toLowerCase()] : undefined;
    if (!type) {
      await ctx.reply("⚠️ Iltimos, tugmalardan birini tanlang.");
      return;
    }

    (ctx.wizard.state as TaxWizardState).taxpayerType = type;

    await ctx.reply(
      "Yillik yalpi aylanmangizni (tushum) so'mda kiriting.\nMasalan: `500000000`",
      { parse_mode: 'Markdown', ...removeKeyboard() },
    );
    return ctx.wizard.next();
  };

  const afterRevenue = async (ctx: BotContext) => {
    const text = getMessageText(ctx);

    if (isCancelCommand(text)) {
      await ctx.reply("Bekor qilindi. Bosh menyu uchun /start.", removeKeyboard());
      return ctx.scene.leave();
    }

    const revenue = parseNumber(text);
    if (revenue === null || revenue < 0) {
      await ctx.reply("⚠️ Iltimos, to'g'ri son kiriting. Masalan: 500000000");
      return;
    }

    const state = ctx.wizard.state as TaxWizardState;
    state.annualRevenue = revenue;

    if (state.taxpayerType === TaxpayerType.QQS_TOLOVCHI) {
      await ctx.reply(
        "Yillik xarajatlaringizni so'mda kiriting.\nAgar bilmasangiz, `0` deb yozing.",
        { parse_mode: 'Markdown' },
      );
      return ctx.wizard.next();
    }

    if (state.taxpayerType === TaxpayerType.YATT_QATIY) {
      await ctx.reply("Faoliyat hududingizni tanlang:", {
        ...Markup.keyboard([
          ['Toshkent shahri'],
          ['Toshkent viloyati'],
          ['Boshqa viloyat'],
          ['/bekor'],
        ])
          .resize()
          .oneTime(),
      });
      return ctx.wizard.next();
    }

    await sendResult(ctx, taxCalculatorService, state, {});
    return ctx.scene.leave();
  };

  const finishWithExtra = async (ctx: BotContext) => {
    const text = getMessageText(ctx);

    if (isCancelCommand(text)) {
      await ctx.reply("Bekor qilindi. Bosh menyu uchun /start.", removeKeyboard());
      return ctx.scene.leave();
    }

    const state = ctx.wizard.state as TaxWizardState;

    if (state.taxpayerType === TaxpayerType.QQS_TOLOVCHI) {
      const expenses = parseNumber(text);
      if (expenses === null || expenses < 0) {
        await ctx.reply("⚠️ Iltimos, to'g'ri son kiriting. Masalan: 350000000");
        return;
      }
      await sendResult(ctx, taxCalculatorService, state, {
        annualExpenses: expenses,
      });
      return ctx.scene.leave();
    }

    if (state.taxpayerType === TaxpayerType.YATT_QATIY) {
      const region = text ? REGION_LABELS[text.trim().toLowerCase()] : undefined;
      if (!region) {
        await ctx.reply("⚠️ Iltimos, tugmalardan birini tanlang.");
        return;
      }
      await sendResult(ctx, taxCalculatorService, state, { region });
      return ctx.scene.leave();
    }

    return ctx.scene.leave();
  };

  return new Scenes.WizardScene<BotContext>(
    TAX_WIZARD_ID,
    askType,
    askRevenue,
    afterRevenue,
    finishWithExtra,
  );
}

async function sendResult(
  ctx: BotContext,
  taxCalculatorService: TaxCalculatorService,
  state: TaxWizardState,
  extra: { annualExpenses?: number; region?: string },
): Promise<void> {
  try {
    const result = taxCalculatorService.calculate({
      taxpayerType: state.taxpayerType as TaxpayerType,
      annualRevenue: state.annualRevenue as number,
      ...extra,
    });

    const lines: string[] = ['✅ *Soliq hisob-kitobi natijasi*', ''];

    for (const [label, value] of Object.entries(result.breakdown)) {
      lines.push(`${label}: ${formatSom(value)}`);
    }

    lines.push('');
    lines.push(`📊 Jami yillik soliq: ${formatSom(result.totalAnnualTax)}`);
    lines.push(`📅 O'rtacha oylik soliq: ${formatSom(result.totalMonthlyTax)}`);
    lines.push(`📈 Effektiv stavka: ${result.effectiveRate}%`);

    if (result.notes.length) {
      lines.push('');
      lines.push('ℹ️ Eslatmalar:');
      result.notes.forEach((note) => lines.push(`• ${note}`));
    }

    lines.push('');
    lines.push(`⚠️ ${result.disclaimer}`);
    lines.push('');
    lines.push(
      "Yangi hisob-kitob uchun /soliq, bosh menyu uchun /start buyrug'ini yuboring.",
    );

    await replyLong(ctx, lines.join('\n'), {
      parse_mode: 'Markdown',
      ...removeKeyboard(),
    });
  } catch (error) {
    await ctx.reply(
      "❌ Hisoblashda xatolik yuz berdi. Iltimos, /soliq orqali qaytadan urinib ko'ring.",
      removeKeyboard(),
    );
  }
}