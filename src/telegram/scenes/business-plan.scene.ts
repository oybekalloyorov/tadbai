import { Scenes } from 'telegraf';
import { BotContext } from '../telegram.types';
import { BUSINESS_PLAN_WIZARD_ID } from '../telegram.constants';
import { BusinessPlanService } from '../../business-plan/business-plan.service';
import { User } from '../../common/entities/user.entity';
import {
  formatSom,
  getMessageText,
  getUserId,
  isCancelCommand,
  isSkipCommand,
  removeKeyboard,
  replyLong,
} from '../utils/message.util';

interface BusinessPlanWizardState {
  businessIdea?: string;
  industry?: string;
  location?: string;
  initialInvestment?: number;
  targetAudience?: string;
  competitiveAdvantage?: string;
}

function parseNumber(text: string | undefined): number | null {
  if (!text) return null;
  const normalized = text.replace(/\s/g, '').replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/**
 * AI biznes-reja generatori uchun bosqichma-bosqich soʻrovnoma:
 * gʻoya -> soha -> joylashuv -> investitsiya -> auditoriya (ixtiyoriy) ->
 * ustunlik (ixtiyoriy) -> AI orqali generatsiya.
 */
export function createBusinessPlanWizard(
  businessPlanService: BusinessPlanService,
): Scenes.WizardScene<BotContext> {
  const askIdea = async (ctx: BotContext) => {
    await ctx.reply(
      "📋 *Biznes-reja generatori*\n\nBiznes gʻoyangizni qisqacha yozing.\nMasalan: `Fast-food restorani`\n\nBekor qilish uchun /bekor.",
      { parse_mode: 'Markdown', ...removeKeyboard() },
    );
    return ctx.wizard.next();
  };

  const askIndustry = async (ctx: BotContext) => {
    const text = getMessageText(ctx);
    if (isCancelCommand(text)) {
      await ctx.reply('Bekor qilindi. Bosh menyu uchun /start.');
      return ctx.scene.leave();
    }
    if (!text || text.length < 3) {
      await ctx.reply('⚠️ Iltimos, biznes gʻoyangizni kamida 3 ta belgida yozing.');
      return;
    }
    (ctx.wizard.state as BusinessPlanWizardState).businessIdea = text;
    await ctx.reply("Faoliyat sohasini kiriting.\nMasalan: `Oziq-ovqat va restoran xizmatlari`", {
      parse_mode: 'Markdown',
    });
    return ctx.wizard.next();
  };

  const askLocation = async (ctx: BotContext) => {
    const text = getMessageText(ctx);
    if (isCancelCommand(text)) {
      await ctx.reply('Bekor qilindi. Bosh menyu uchun /start.');
      return ctx.scene.leave();
    }
    if (!text) {
      await ctx.reply('⚠️ Iltimos, faoliyat sohasini kiriting.');
      return;
    }
    (ctx.wizard.state as BusinessPlanWizardState).industry = text;
    await ctx.reply("Joylashuvni kiriting.\nMasalan: `Toshkent shahri, Chilonzor tumani`", {
      parse_mode: 'Markdown',
    });
    return ctx.wizard.next();
  };

  const askInvestment = async (ctx: BotContext) => {
    const text = getMessageText(ctx);
    if (isCancelCommand(text)) {
      await ctx.reply('Bekor qilindi. Bosh menyu uchun /start.');
      return ctx.scene.leave();
    }
    if (!text) {
      await ctx.reply('⚠️ Iltimos, joylashuvni kiriting.');
      return;
    }
    (ctx.wizard.state as BusinessPlanWizardState).location = text;
    await ctx.reply(
      "Boshlangʻich investitsiya miqdorini soʻmda kiriting.\nMasalan: `150000000`",
      { parse_mode: 'Markdown' },
    );
    return ctx.wizard.next();
  };

  const askAudience = async (ctx: BotContext) => {
    const text = getMessageText(ctx);
    if (isCancelCommand(text)) {
      await ctx.reply('Bekor qilindi. Bosh menyu uchun /start.');
      return ctx.scene.leave();
    }
    const amount = parseNumber(text);
    if (amount === null || amount < 0) {
      await ctx.reply('⚠️ Iltimos, toʻgʻri son kiriting. Masalan: 150000000');
      return;
    }
    (ctx.wizard.state as BusinessPlanWizardState).initialInvestment = amount;
    await ctx.reply(
      "Maqsadli auditoriyangizni yozing (ixtiyoriy).\nOʻtkazib yuborish uchun `-` deb yozing.",
      { parse_mode: 'Markdown' },
    );
    return ctx.wizard.next();
  };

  const askAdvantage = async (ctx: BotContext) => {
    const text = getMessageText(ctx);
    if (isCancelCommand(text)) {
      await ctx.reply('Bekor qilindi. Bosh menyu uchun /start.');
      return ctx.scene.leave();
    }
    if (!isSkipCommand(text)) {
      (ctx.wizard.state as BusinessPlanWizardState).targetAudience = text;
    }
    await ctx.reply(
      "Raqobatdagi ustunligingizni yozing (ixtiyoriy).\nOʻtkazib yuborish uchun `-` deb yozing.",
      { parse_mode: 'Markdown' },
    );
    return ctx.wizard.next();
  };

  const finish = async (ctx: BotContext) => {
    const text = getMessageText(ctx);
    if (isCancelCommand(text)) {
      await ctx.reply('Bekor qilindi. Bosh menyu uchun /start.');
      return ctx.scene.leave();
    }
    if (!isSkipCommand(text)) {
      (ctx.wizard.state as BusinessPlanWizardState).competitiveAdvantage = text;
    }

    const state = ctx.wizard.state as BusinessPlanWizardState;
    const userId = getUserId(ctx);

    if (!userId) {
      await ctx.reply(
        "❌ Foydalanuvchi aniqlanmadi. Iltimos, /start buyrug'i orqali qaytadan boshlang.",
      );
      return ctx.scene.leave();
    }

    await ctx.reply(
      "⏳ AI biznes-rejangizni tayyorlamoqda, biroz kuting (10-30 soniya)...",
    );
    await ctx.sendChatAction('typing').catch(() => undefined);

    try {
      const userRef = { id: userId } as User;
      const plan = await businessPlanService.generate(userRef, {
        businessIdea: state.businessIdea as string,
        industry: state.industry as string,
        location: state.location as string,
        initialInvestment: state.initialInvestment as number,
        targetAudience: state.targetAudience,
        competitiveAdvantage: state.competitiveAdvantage,
      });

      // DIQQAT: AI (LLM) qaytargan matnda Markdown uchun maxsus belgilar
      // (*, _, ` va h.k.) bo'lishi mumkin va bu Telegramning "can't parse
      // entities" xatoligiga olib kelishi mumkin. Shu sababli bu yerda
      // parse_mode ishlatilmaydi — oddiy matn sifatida yuboriladi.
      await replyLong(ctx, formatBusinessPlan(plan.content, plan.title));
    } catch (error) {
      await ctx.reply(
        "❌ Biznes-reja generatsiyasida xatolik yuz berdi. AI xizmati vaqtincha ishlamayotgan bo'lishi mumkin. Birozdan so'ng /biznesreja orqali qaytadan urinib ko'ring.",
      );
    }

    return ctx.scene.leave();
  };

  return new Scenes.WizardScene<BotContext>(
    BUSINESS_PLAN_WIZARD_ID,
    askIdea,
    askIndustry,
    askLocation,
    askInvestment,
    askAudience,
    askAdvantage,
    finish,
  );
}

function formatBusinessPlan(content: Record<string, any>, title: string): string {
  const lines: string[] = [`✅ BIZNES-REJA: ${title}`, ''];

  if (content.executiveSummary) {
    lines.push('📝 QISQA MAZMUN', content.executiveSummary, '');
  }
  if (content.businessDescription) {
    lines.push('🏢 BIZNES TAVSIFI', content.businessDescription, '');
  }
  if (content.marketAnalysis) {
    lines.push('📊 BOZOR TAHLILI', content.marketAnalysis, '');
  }
  if (content.targetAudience) {
    lines.push('🎯 MAQSADLI AUDITORIYA', content.targetAudience, '');
  }
  if (content.marketingStrategy) {
    lines.push('📣 MARKETING STRATEGIYASI', content.marketingStrategy, '');
  }
  if (content.operationalPlan) {
    lines.push('⚙️ OPERATSION REJA', content.operationalPlan, '');
  }

  if (content.financialPlan) {
    const fp = content.financialPlan;
    lines.push("💰 MOLIYAVIY REJA (🟡 AI tomonidan hisoblangan taxminiy raqamlar)");
    if (fp.initialInvestment != null) {
      lines.push(`• Boshlangʻich investitsiya: ${formatSom(fp.initialInvestment)}`);
    }
    if (fp.monthlyExpenses != null) {
      lines.push(`• Oylik xarajatlar: ${formatSom(fp.monthlyExpenses)}`);
    }
    if (fp.expectedMonthlyRevenue != null) {
      lines.push(`• Kutilayotgan oylik tushum: ${formatSom(fp.expectedMonthlyRevenue)}`);
    }
    if (fp.breakEvenMonths != null) {
      lines.push(`• O'zini oqlash muddati: ${fp.breakEvenMonths} oy`);
    }
    if (fp.notes) {
      lines.push(`• Izoh: ${fp.notes}`);
    }
    lines.push('');
  }

  if (Array.isArray(content.risks) && content.risks.length) {
    lines.push('⚠️ RISKLAR');
    content.risks.forEach((risk: string) => lines.push(`• ${risk}`));
    lines.push('');
  }

  if (Array.isArray(content.recommendations) && content.recommendations.length) {
    lines.push('💡 TAVSIYALAR');
    content.recommendations.forEach((rec: string) => lines.push(`• ${rec}`));
    lines.push('');
  }

  if (content.disclaimer) {
    lines.push(content.disclaimer, '');
  }

  lines.push(
    "Yangi biznes-reja uchun /biznesreja, bosh menyu uchun /start buyrug'ini yuboring.",
  );

  return lines.join('\n');
}