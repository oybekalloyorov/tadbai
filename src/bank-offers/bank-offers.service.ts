import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import * as cheerio from 'cheerio';

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
}