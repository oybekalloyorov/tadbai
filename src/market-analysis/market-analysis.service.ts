import { Injectable } from '@nestjs/common';
import { AiService } from '../common/ai/ai.service';
import { AnalyzeMarketDto } from './dto/analyze-market.dto';
import { MarketDataService } from 'src/market-data/market-data.service';

const SYSTEM_PROMPT = `
Sen O'zbekiston bozori boʻyicha professional tahlilchisan. Foydalanuvchi bergan soha va
joylashuv asosida bozor tahlilini tuzasan. Xulosalaring real va amaliy boʻlishi, mumkin
boʻlgan raqobatchilar toifasi, bozor hajmi taxmini va SWOT tahlilini oʻz ichiga olishi kerak.

MUHIM QOIDALAR:
- Senga "TASDIQLANGAN MA'LUMOTLAR BAZASI" nomli bo'lim beriladi — bu rasmiy
  manbalardan (Davlat statistika qo'mitasi, Jahon banki va h.k.) olingan,
  qo'lda tekshirilgan haqiqiy raqamlar. Agar u yerda sohaga yoki umumiy
  iqtisodiyotga tegishli mos keladigan ko'rsatkich bo'lsa, albatta AYNAN shu
  raqamdan foydalan (o'zgartirmasdan, to'qimasdan) va tahlilingda uni aniq
  keltir. Bu raqamlarni o'zingning taxminlaring bilan aralashtirma — ular
  tasdiqlangan fakt, sen esa faqat ularni qanday izohlashni tanlaysan.
- Senda O'zbekiston Markaziy banki, Statistika agentligi yoki boshqa rasmiy
  manbalarga jonli (real-time) kirish YO'Q. "TASDIQLANGAN MA'LUMOTLAR
  BAZASI"da YO'Q har qanday raqam (masalan, tor sohaning aniq bozor hajmi)
  SENING umumiy bilim va mantiqiy xulosalaring asosidagi TAXMIN, rasmiy
  statistika EMAS — buni hech qachon aniq/tekshirilgan raqam sifatida
  taqdim etma, doim "taxminan" kabi soʻzlar bilan bir qatorda yoz.
- Agar biror aniq raqamni ishonchli tarzda baholay olmasang, oʻylab
  chiqarmasdan buni ochiq ayt (masalan: "Bu hudud/soha uchun aniq bozor hajmi
  maʼlumotlari yetarli emas").
- Bank nomlari, foiz stavkalari, kredit shartlari kabi moliyaviy maʼlumotlarni
  HECH QACHON oʻylab topma — bunday savollarga "aniq bank shartlarini bank
  bilan bevosita tekshiring" deb javob ber.

Javobni FAQAT quyidagi JSON formatida qaytar (oʻzbek tilida):
{
  "marketOverview": "bozor umumiy holati tavsifi",
  "estimatedMarketSize": "bozor hajmi haqida taxminiy baho (matn holida, masalan '2024-yilda taxminan X mlrd so'm')",
  "competitors": ["asosiy raqobatchi toifalari"],
  "customerSegments": ["asosiy mijozlar segmentlari"],
  "swot": {
    "strengths": ["kuchli tomonlar"],
    "weaknesses": ["zaif tomonlar"],
    "opportunities": ["imkoniyatlar"],
    "threats": ["tahdidlar"]
  },
  "entryBarriers": ["bozorga kirish toʻsiqlari"],
  "recommendations": ["amaliy tavsiyalar"]
}
`;

@Injectable()
export class MarketAnalysisService {
  constructor(
    private readonly aiService: AiService,
    private readonly marketDataService: MarketDataService,
  ) { }

  async analyze(dto: AnalyzeMarketDto) {
    // 1) Avval AI'ga emas, o'zimizning tasdiqlangan ma'lumotlar bazamizga
    // murojaat qilamiz — shu bilan tahlil FAQAT Geminining "xotirasiga"
    // tayanib qolmaydi.
    const references = await this.marketDataService.findRelevant(
      dto.industry,
      dto.location,
    );

    const referenceBlock = references.length
      ? references
        .map((r) => {
          const statLines = Object.entries(r.stats)
            .map(([key, value]) => `  • ${key}: ${value}`)
            .join('\n');
          return `- ${r.industryLabel} (manba: ${r.source}, ${r.dataAsOf} holatiga):\n${statLines}`;
        })
        .join('\n')
      : "Mos keladigan tasdiqlangan yozuv topilmadi — bu sohaga xos aniq statistika hozircha bazada yo'q.";

    const userPrompt = `
TASDIQLANGAN MA'LUMOTLAR BAZASI:
${referenceBlock}

Soha: ${dto.industry}
Joylashuv: ${dto.location}
Mahsulot/xizmat tavsifi: ${dto.productDescription || 'Belgilanmagan'}
    `.trim();

    const result = await this.aiService.generateJson(SYSTEM_PROMPT, userPrompt);

    return {
      industry: dto.industry,
      location: dto.location,
      generatedAt: new Date().toISOString(),
      ...result,
      // 2) Qaysi tasdiqlangan manbalar ishlatilgani (yoki ishlatilishi
      // mumkin bo'lgani) foydalanuvchiga shaffof ko'rsatiladi — bu AI
      // o'zi "manba" deb to'qib yozadigan xatardan farqli, chunki bu
      // ro'yxat to'g'ridan-to'g'ri bazadan, kod orqali shakllantiriladi.
      dataSources: references.map((r) => ({
        label: r.industryLabel,
        source: r.source,
        sourceUrl: r.sourceUrl,
        dataAsOf: r.dataAsOf,
      })),
      // AI promptiga qat'iy ishonib qolmaslik uchun statik ogohlantirishni
      // har doim qo'shamiz — bozor hajmi va boshqa raqamlar (dataSources'da
      // ko'rsatilganlaridan tashqari) rasmiy statistika emas, sun'iy
      // intellektning taxminidir.
      disclaimer:
        "⚠️ \"Manbalar\" bo'limida ko'rsatilgan raqamlardan tashqari, ushbu " +
        "tahlildagi bozor hajmi va boshqa sonli koʻrsatkichlar sunʼiy " +
        "intellekt tomonidan berilgan TAXMINIY bahodir — Markaziy bank, " +
        "Statistika agentligi yoki boshqa rasmiy manbadan olingan " +
        "tasdiqlangan statistika emas. Muhim qarorlar uchun rasmiy " +
        "manbalarni tekshiring.",
    };
  }
}