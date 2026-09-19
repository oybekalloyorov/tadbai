import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import * as cheerio from 'cheerio';

export type BankOfferCategory =
  | 'biznes'
  | 'avtokredit'
  | 'ipoteka'
  | 'mikroqarz'
  | 'boshqa';

export interface BankCreditOffer {
  id: string;
  bankName: string;
  productName: string;
  imageUrl: string | null;
  interestRate: string;
  term: string;
  downPayment: string;
  amount: string;
  badges: string[];
  detailUrl: string | null;
  // Filtrlash uchun matndan ajratib olingan raqamli/qisqacha qiymatlar
  // (asl matn maydonlari yuqorida saqlanib qoladi — ular hech qachon
  // o'chirilmaydi, faqat filtr uchun qo'shimcha maydonlar qo'shiladi).
  category: BankOfferCategory;
  amountMaxSom: number | null;
  termMaxMonths: number | null;
  interestRateValue: number | null;
}

export interface BankCreditOffersResult {
  offers: BankCreditOffer[];
  page: number;
  totalPages: number;
  fetchedAt: string;
}

const BANK_UZ_CREDITS_URL = 'https://bank.uz/uz/credits';
const BASE_URL = 'https://bank.uz';

/**
 * BankOffersService bank.uz saytining "/uz/credits" sahifasini HAR SO'ROVDA
 * jonli o'qib (keshlanmasdan), undan bank kredit takliflarini ajratib oladi.
 * Sayt server tomonida render qilingan (Bitrix CMS) oddiy HTML sahifa bo'lgani
 * uchun JSON API o'rniga HTML'ni cheerio bilan tahlil qilamiz.
 */
@Injectable()
export class BankOffersService {
  private readonly logger = new Logger(BankOffersService.name);

  async getCredits(page = 1): Promise<BankCreditOffersResult> {
    const url =
      page > 1 ? `${BANK_UZ_CREDITS_URL}?PAGEN_4=${page}` : BANK_UZ_CREDITS_URL;

    let html: string;
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
            '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'uz,ru;q=0.9,en;q=0.8',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      html = await response.text();
    } catch (error) {
      this.logger.error(
        `bank.uz sahifasini olishda xatolik: ${(error as Error).message}`,
      );
      throw new ServiceUnavailableException(
        "Bank takliflarini olishda xatolik yuz berdi. bank.uz sayti vaqtincha " +
        "ishlamayotgan bo'lishi mumkin — birozdan so'ng qaytadan urinib ko'ring.",
      );
    }

    const $ = cheerio.load(html);
    const offers: BankCreditOffer[] = [];

    $('.table-card-offers-bottom').each((index, el) => {
      const card = $(el);

      const bankName = card
        .find('.table-card-offers-block1-text > span.medium-text')
        .first()
        .text()
        .trim();

      const productLink = card.find('.table-card-offers-block1-text > a').first();
      const productName = productLink.text().trim();

      let imageUrl: string | null =
        card.find('.table-card-offers-block1-img img').first().attr('src') || null;
      if (imageUrl && imageUrl.startsWith('/')) {
        imageUrl = `${BASE_URL}${imageUrl}`;
      }

      const interestRate = card
        .find('.table-card-offers-block2 span.medium-text')
        .first()
        .text()
        .trim();

      const block3Spans = card.find('.table-card-offers-block3');
      const term = $(block3Spans.get(0))
        .find('span.medium-text')
        .first()
        .text()
        .trim();
      const downPayment = $(block3Spans.get(1))
        .find('span.medium-text')
        .first()
        .text()
        .trim();

      const amount = card
        .find('.table-card-offers-block4 span.medium-text')
        .first()
        .text()
        .trim();

      const badges: string[] = [];
      card.find('.table-card-offers-block5 .online_btn .medium-text').each((_, b) => {
        const text = $(b).text().trim();
        if (text) badges.push(text);
      });

      let detailUrl: string | null =
        card.find('.table-card-offers-block5 a').first().attr('href') || null;
      if (detailUrl && detailUrl.startsWith('/')) {
        detailUrl = `${BASE_URL}${detailUrl}`;
      }

      // Reklama joylashuvi yoki bo'sh kartalarni o'tkazib yuboramiz
      // (bank nomi yoki summasi yo'q kartalar haqiqiy taklif emas).
      if (!bankName || !amount) {
        return;
      }

      offers.push({
        id: card.attr('id') || `offer-${page}-${index}`,
        bankName,
        productName: productName || '-',
        imageUrl,
        interestRate: interestRate || '-',
        term: term || '-',
        downPayment: downPayment || '-',
        amount: amount || '-',
        badges,
        detailUrl,
        category: this.detectCategory(productName, bankName),
        amountMaxSom: this.extractMaxNumber(amount),
        termMaxMonths: this.parseTermToMonths(term),
        interestRateValue: this.extractFirstNumber(interestRate),
      });
    });

    let totalPages = 1;
    $('.pagination a').each((_, el) => {
      const text = $(el).text().trim();
      const num = parseInt(text, 10);
      if (!isNaN(num) && num > totalPages) {
        totalPages = num;
      }
    });

    return {
      offers,
      page,
      totalPages,
      fetchedAt: new Date().toISOString(),
    };
  }

  /**
   * Mahsulot/bank nomidagi kalit so'zlar asosida taklifni tadbirkorga
   * mos kategoriyalarga ajratadi. bank.uz kartalarida alohida "biznes"
   * bayrog'i bo'lmagani uchun bu taxminiy (heuristik) ajratish — asl
   * matnlar (productName, bankName) har doim saqlanib qoladi.
   */
  private detectCategory(productName: string, bankName: string): BankOfferCategory {
    const text = `${productName} ${bankName}`.toLowerCase();

    if (
      text.includes('biznes') ||
      text.includes('tadbirkor') ||
      text.includes('korxona') ||
      text.includes('yuridik') ||
      text.includes('mchj') ||
      text.includes('startup')
    ) {
      return 'biznes';
    }
    if (text.includes('avtokredit') || text.includes('avto')) {
      return 'avtokredit';
    }
    if (text.includes('ipoteka') || text.includes('uy-joy') || text.includes('uyjoy')) {
      return 'ipoteka';
    }
    if (text.includes('mikroqarz') || text.includes('nasiya') || text.includes('kredit kartasi')) {
      return 'mikroqarz';
    }
    return 'boshqa';
  }

  /**
   * "25 000 000 so'mgacha" -> 25000000
   * "1 000 000dan - 100 000 000 so'mgacha" -> 100000000 (eng katta qiymat)
   * Raqam topilmasa null qaytaradi.
   */
  private extractMaxNumber(text: string): number | null {
    const matches = text.match(/[\d]{1,3}(?:[\s.,]\d{3})*/g);
    if (!matches) return null;

    const numbers = matches
      .map((m) => parseInt(m.replace(/[\s.,]/g, ''), 10))
      .filter((n) => !isNaN(n) && n > 0);

    if (numbers.length === 0) return null;
    return Math.max(...numbers);
  }

  /**
   * Matndagi birinchi (butun yoki kasr) raqamni qaytaradi.
   * "28 % dan" -> 28, "0.15 в день %" -> 0.15
   */
  private extractFirstNumber(text: string): number | null {
    const match = text.match(/\d+(?:[.,]\d+)?/);
    if (!match) return null;
    const value = parseFloat(match[0].replace(',', '.'));
    return isNaN(value) ? null : value;
  }

  /**
   * "1 yil", "1 yil - 3 yil", "3 oy - 5 yil" kabi matnlardan eng katta
   * muddatni oylarda hisoblab qaytaradi ("yil" -> *12, "oy" -> *1).
   */
  private parseTermToMonths(text: string): number | null {
    const regex = /(\d+(?:[.,]\d+)?)\s*(yil|oy)/gi;
    let match: RegExpExecArray | null;
    let maxMonths: number | null = null;

    while ((match = regex.exec(text)) !== null) {
      const value = parseFloat(match[1].replace(',', '.'));
      if (isNaN(value)) continue;
      const unit = match[2].toLowerCase();
      const months = unit === 'yil' ? value * 12 : value;
      if (maxMonths === null || months > maxMonths) {
        maxMonths = months;
      }
    }

    return maxMonths;
  }
}