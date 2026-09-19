import { Markup } from 'telegraf';
import { BotContext } from '../telegram.types';
import { CANCEL_WORDS } from '../telegram.constants';

// Telegram bitta xabar uchun 4096 belgigacha ruxsat beradi.
// Xavfsizlik uchun biroz pastroq chegara olamiz.
const TELEGRAM_MESSAGE_LIMIT = 3800;

/**
 * Uzun matnni Telegram limitidan oshmaydigan qismlarga bo'ladi,
 * imkon qadar qatorlar (\n\n yoki \n) chegarasida bo'lib beradi.
 */
export function splitMessage(
  text: string,
  limit: number = TELEGRAM_MESSAGE_LIMIT,
): string[] {
  if (!text) {
    return [''];
  }

  if (text.length <= limit) {
    return [text];
  }

  const chunks: string[] = [];
  let remaining = text;

  while (remaining.length > limit) {
    let sliceEnd = remaining.lastIndexOf('\n\n', limit);
    if (sliceEnd <= 0) {
      sliceEnd = remaining.lastIndexOf('\n', limit);
    }
    if (sliceEnd <= 0) {
      sliceEnd = limit;
    }

    chunks.push(remaining.slice(0, sliceEnd).trim());
    remaining = remaining.slice(sliceEnd).trim();
  }

  if (remaining.length > 0) {
    chunks.push(remaining);
  }

  return chunks;
}

/**
 * Uzun xabarni bir nechta Telegram xabari sifatida ketma-ket yuboradi.
 * Qo'shimcha (masalan, klaviaturani olib tashlash) faqat oxirgi qismga qo'llanadi.
 */
export async function replyLong(
  ctx: BotContext,
  text: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  extra?: any,
): Promise<void> {
  const parts = splitMessage(text);
  for (let i = 0; i < parts.length; i++) {
    const isLast = i === parts.length - 1;
    await ctx.reply(parts[i], isLast ? extra : undefined);
  }
}

export function formatSom(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "0 so'm";
  }
  return `${Math.round(value).toLocaleString('ru-RU').replace(/,/g, ' ')} so'm`;
}

export function isCancelCommand(text?: string | null): boolean {
  if (!text) {
    return false;
  }
  return CANCEL_WORDS.includes(text.trim().toLowerCase());
}

export function isSkipCommand(text?: string | null): boolean {
  if (!text) {
    return false;
  }
  const normalized = text.trim().toLowerCase();
  return ['-', "o'tkazib yuborish", 'otkazib yuborish', 'skip'].includes(
    normalized,
  );
}

export function getMessageText(ctx: BotContext): string | undefined {
  const message = ctx.message as { text?: string } | undefined;
  return message?.text?.trim();
}

export const removeKeyboard = () => Markup.removeKeyboard();

// ---------------------------------------------------------------------------
// Foydalanuvchi ID keshi (Telegram chatId -> platforma userId)
// ---------------------------------------------------------------------------
// MUHIM: Ilgari userId faqat `ctx.session.userId` ichida saqlanardi. Amalda
// ba'zi muhitlarda (Telegraf'ning session() middleware'i ishga tushirilgan
// tartibi, versiyasi yoki bir nechta yangilanish juda tez ketma-ket kelishi
// kabi holatlarda) `ctx.session` kutilmaganda `undefined` bo'lib qolishi va
// "Cannot read properties of undefined (reading 'userId')" xatoligiga olib
// kelishi mumkin edi. Shu sababli endi userId TelegramService tomonidan bu
// yerdagi oddiy, doimiy Map orqali ham saqlanadi — bu Telegraf'ning session
// mexanizmiga umuman bog'liq emas va shuning uchun hech qachon shu turdagi
// xatolik bilan qulamaydi.
const chatUserIdCache = new Map<number, string>();

export function setCachedUserId(chatId: number, userId: string): void {
  chatUserIdCache.set(chatId, userId);
}

export function getCachedUserId(chatId: number): string | undefined {
  return chatUserIdCache.get(chatId);
}

export function getUserId(ctx: BotContext): string | undefined {
  // 1) Avval (mavjud bo'lsa) ctx.session'dan o'qishga urinamiz — lekin bu
  //    o'qish HECH QACHON butun so'rovni qulatmasligi kerak.
  try {
    const sessionUserId = (ctx.session as Record<string, any> | undefined)
      ?.userId;
    if (sessionUserId) {
      return sessionUserId;
    }
  } catch {
    // ctx.session bilan bog'liq har qanday kutilmagan xatolik e'tiborsiz
    // qoldiriladi — pastdagi kesh orqali davom etamiz.
  }

  // 2) Zaxira: chatId asosida doimiy keshdan o'qiymiz.
  const chatId = ctx.chat?.id;
  if (chatId !== undefined) {
    return chatUserIdCache.get(chatId);
  }

  return undefined;
}