import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketReferenceData } from './entities/market-reference.entity';

interface SeedRow {
  industryLabel: string;
  keywords: string[];
  stats: Record<string, string>;
  source: string;
  sourceUrl: string | null;
  dataAsOf: string;
}

// DIQQAT: bu yerdagi barcha raqamlar HAQIQIY, rasmiy manbalardan olingan
// (fantastika/AI taxmini EMAS). Hozircha faqat O'zbekiston MSME sektori
// bo'yicha umumiy, tasdiqlangan ko'rsatkichlar kiritilgan — chunki har bir
// tor soha (masalan "fitnes-klub xizmatlari") bo'yicha rasmiy, ishonchli
// va doimiy yangilanadigan statistika hozircha oson topilmaydi/scraping
// qilib bo'lmaydi (stat.uz hisobotlari asosan PDF va tuzilishi doimiy
// o'zgarib turadi — bank.uz'dagi kabi barqaror HTML emas). Yangi, real
// manbali yozuvlar paydo bo'lganda shu massivga qo'shib borish kerak.
const SEED_DATA: SeedRow[] = [
  {
    industryLabel: "O'zbekiston MSME (kichik va o'rta biznes) — umumiy holat",
    keywords: [
      'umumiy',
      'barchasi',
      'tadbirkorlik',
      'biznes',
      'msme',
      'kob',
      'kichik',
      "o'rta",
    ],
    stats: {
      "MSME ulushi (bizneslar soni bo'yicha)": '90%+',
      'MSME ulushi bandlikda': '75%',
      'MSME ulushi YAIMda (YIM)': '55%',
      'Yillik kredit talabi (taxminan)': '$13 mlrd',
      "Moliyalashtirish taqchilligi (bo'shliq)": '$6 mlrd',
      'Kreditga ega kichik korxonalar ulushi': "Faqat ~10% ta'kidlagan",
    },
    source: 'Jahon banki, FINGROW hisoboti',
    sourceUrl: null,
    dataAsOf: '2025',
  },
  {
    industryLabel: "O'zbekistondagi kichik biznes subyektlari soni",
    keywords: [
      'kichik biznes',
      'korxona',
      'mikrofirma',
      'statistika',
      "ro'yxat",
      'subyekt',
    ],
    stats: {
      'Kichik biznes subyektlari (jami)': '1,208,000',
      'Kichik korxona va mikrofirmalar': "403,800 (tadbirkorlikning ~85%)",
    },
    source: "O'zbekiston Respublikasi Davlat statistika qo'mitasi",
    sourceUrl: 'https://stat.uz',
    dataAsOf: '2026-04-01',
  },
];

@Injectable()
export class MarketDataService implements OnModuleInit {
  private readonly logger = new Logger(MarketDataService.name);

  constructor(
    @InjectRepository(MarketReferenceData)
    private readonly repository: Repository<MarketReferenceData>,
  ) { }

  async onModuleInit(): Promise<void> {
    const count = await this.repository.count();
    if (count === 0) {
      await this.repository.save(this.repository.create(SEED_DATA));
      this.logger.log(
        `Bozor ma'lumotlari bazasi ${SEED_DATA.length} ta tasdiqlangan yozuv bilan to'ldirildi.`,
      );
    }
  }

  /**
   * Foydalanuvchi kiritgan soha/joylashuv matniga mos keladigan
   * tasdiqlangan (rasmiy manbali) yozuvlarni qaytaradi. Aniq mos kelish
   * topilmasa ham, "umumiy" MSME ma'lumotlari doim qo'shiladi — shunda AI
   * hech bo'lmaganda umumiy iqtisodiy kontekstga ega bo'ladi va butunlay
   * o'zining taxminiga tayanib qolmaydi.
   */
  async findRelevant(
    industry: string,
    location?: string,
  ): Promise<MarketReferenceData[]> {
    const all = await this.repository.find();
    const text = `${industry} ${location || ''}`.toLowerCase();

    const matched = all.filter((row) =>
      row.keywords.some((kw) => text.includes(kw.toLowerCase())),
    );

    const general = all.filter((row) => row.keywords.includes('umumiy'));

    const combined = [...matched, ...general].filter(
      (row, index, arr) => arr.findIndex((r) => r.id === row.id) === index,
    );

    return combined;
  }
}