import { Scenes } from 'telegraf';
import { BotContext } from '../telegram.types';
import { MARKET_ANALYSIS_WIZARD_ID } from '../telegram.constants';
import { MarketAnalysisService } from '../../market-analysis/market-analysis.service';
import {
  getMessageText,
  isCancelCommand,
  isSkipCommand,
  removeKeyboard,
  replyLong,
} from '../utils/message.util';

interface MarketAnalysisWizardState {
  industry?: string;
  location?: string;
  productDescription?: string;
}

export function createMarketAnalysisWizard(
  marketAnalysisService: MarketAnalysisService,
): Scenes.WizardScene<BotContext> {
  const askIndustry = async (ctx: BotContext) => {
    await ctx.reply(
      "📊 *Bozor tahlili*\n\nQaysi soha boʻyicha tahlil kerak?\nMasalan: `Fitnes-klub xizmatlari`\n\nBekor qilish uchun /bekor.",
      { parse_mode: 'Markdown', ...removeKeyboard() },
    );
    return ctx.wizard.next();
  };

  const askLocation = async (ctx: BotContext) => {
    const text = getMessageText(ctx);
    if (isCancelCommand(text)) {
      await ctx.reply('Bekor qilindi. Bosh menyu uchun /start.');
      return ctx.scene.leave();
    }
    if (!text || text.length < 3) {
      await ctx.reply('⚠️ Iltimos, sohani kamida 3 ta belgida yozing.');
      return;
    }
    (ctx.wizard.state as MarketAnalysisWizardState).industry = text;
    await ctx.reply("Joylashuvni kiriting.\nMasalan: `Toshkent shahri, Yunusobod`", {
      parse_mode: 'Markdown',
    });
    return ctx.wizard.next();
  };

  const askProduct = async (ctx: BotContext) => {
    const text = getMessageText(ctx);
    if (isCancelCommand(text)) {
      await ctx.reply('Bekor qilindi. Bosh menyu uchun /start.');
      return ctx.scene.leave();
    }
    if (!text) {
      await ctx.reply('⚠️ Iltimos, joylashuvni kiriting.');
      return;
    }
    (ctx.wizard.state as MarketAnalysisWizardState).location = text;
    await ctx.reply(
      "Mahsulot/xizmat tavsifini yozing (ixtiyoriy).\nOʻtkazib yuborish uchun `-` deb yozing.",
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

    const state = ctx.wizard.state as MarketAnalysisWizardState;
    if (!isSkipCommand(text)) {
      state.productDescription = text;
    }

    await ctx.reply('⏳ Bozor tahlili tayyorlanmoqda, biroz kuting...');
    await ctx.sendChatAction('typing').catch(() => undefined);

    try {
      const result = await marketAnalysisService.analyze({
        industry: state.industry as string,
        location: state.location as string,
        productDescription: state.productDescription,
      });

      await replyLong(ctx, formatMarketAnalysis(result));
    } catch (error) {
      await ctx.reply(
        "❌ Bozor tahlilida xatolik yuz berdi. AI xizmati vaqtincha ishlamayotgan bo'lishi mumkin. Birozdan so'ng /tahlil orqali qaytadan urinib ko'ring.",
      );
    }

    return ctx.scene.leave();
  };

  return new Scenes.WizardScene<BotContext>(
    MARKET_ANALYSIS_WIZARD_ID,
    askIndustry,
    askLocation,
    askProduct,
    finish,
  );
}

function formatMarketAnalysis(result: Record<string, any>): string {
  const lines: string[] = [
    `✅ BOZOR TAHLILI: ${result.industry}`,
    `📍 ${result.location}`,
    '',
  ];

  if (result.marketOverview) {
    lines.push('🌐 BOZOR HOLATI', result.marketOverview, '');
  }
  if (result.estimatedMarketSize) {
    lines.push('📐 BOZOR HAJMI (TAXMINIY)', result.estimatedMarketSize, '');
  }
  if (Array.isArray(result.competitors) && result.competitors.length) {
    lines.push('🥊 ASOSIY RAQOBATCHI TOIFALARI');
    result.competitors.forEach((c: string) => lines.push(`• ${c}`));
    lines.push('');
  }
  if (Array.isArray(result.customerSegments) && result.customerSegments.length) {
    lines.push('👥 MIJOZLAR SEGMENTLARI');
    result.customerSegments.forEach((c: string) => lines.push(`• ${c}`));
    lines.push('');
  }
  if (result.swot) {
    lines.push('🧭 SWOT TAHLILI');
    if (result.swot.strengths?.length) {
      lines.push('💪 Kuchli tomonlar:');
      result.swot.strengths.forEach((s: string) => lines.push(`• ${s}`));
    }
    if (result.swot.weaknesses?.length) {
      lines.push('⚠️ Zaif tomonlar:');
      result.swot.weaknesses.forEach((s: string) => lines.push(`• ${s}`));
    }
    if (result.swot.opportunities?.length) {
      lines.push('🌱 Imkoniyatlar:');
      result.swot.opportunities.forEach((s: string) => lines.push(`• ${s}`));
    }
    if (result.swot.threats?.length) {
      lines.push('🚧 Tahdidlar:');
      result.swot.threats.forEach((s: string) => lines.push(`• ${s}`));
    }
    lines.push('');
  }
  if (Array.isArray(result.entryBarriers) && result.entryBarriers.length) {
    lines.push("🚪 BOZORGA KIRISH TOʻSIQLARI");
    result.entryBarriers.forEach((b: string) => lines.push(`• ${b}`));
    lines.push('');
  }
  if (Array.isArray(result.recommendations) && result.recommendations.length) {
    lines.push('💡 TAVSIYALAR');
    result.recommendations.forEach((r: string) => lines.push(`• ${r}`));
    lines.push('');
  }

  lines.push(
    "Yangi tahlil uchun /tahlil, bosh menyu uchun /start buyrug'ini yuboring.",
  );

  return lines.join('\n');
}