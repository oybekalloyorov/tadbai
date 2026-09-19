import { Injectable } from '@nestjs/common';
import { AiService } from '../common/ai/ai.service';
import { AnalyzeMarketDto } from './dto/analyze-market.dto';

const SYSTEM_PROMPT = `
Sen O'zbekiston bozori boʻyicha professional tahlilchisan. Foydalanuvchi bergan soha va
joylashuv asosida bozor tahlilini tuzasan. Xulosalaring real va amaliy boʻlishi, mumkin
boʻlgan raqobatchilar toifasi, bozor hajmi taxmini va SWOT tahlilini oʻz ichiga olishi kerak.

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
  constructor(private readonly aiService: AiService) {}

  async analyze(dto: AnalyzeMarketDto) {
    const userPrompt = `
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
    };
  }
}
