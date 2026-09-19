import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessPlan } from './entities/business-plan.entity';
import { GenerateBusinessPlanDto } from './dto/generate-business-plan.dto';
import { AiService } from '../common/ai/ai.service';
import { User } from '../common/entities/user.entity';

const SYSTEM_PROMPT = `
Sen O'zbekistondagi kichik va o'rta biznes (KOB) subyektlari uchun professional
moliyaviy maslahatchi va biznes-reja mutaxassisisan. Foydalanuvchi bergan maʼlumotlar
asosida toʻliq, amaliy va real bozor sharoitlariga mos biznes-reja tuzasan.

Javobni FAQAT quyidagi JSON formatida qaytar (oʻzbek tilida, aniq va tushunarli):
{
  "executiveSummary": "qisqa mazmun",
  "businessDescription": "biznes tavsifi",
  "marketAnalysis": "bozor tahlili",
  "targetAudience": "maqsadli auditoriya tavsifi",
  "marketingStrategy": "marketing strategiyasi",
  "operationalPlan": "operatsion reja (jarayonlar, xodimlar, joylashuv)",
  "financialPlan": {
    "initialInvestment": son,
    "monthlyExpenses": son,
    "expectedMonthlyRevenue": son,
    "breakEvenMonths": son,
    "notes": "moliyaviy izohlar"
  },
  "risks": ["risk1", "risk2", "risk3"],
  "recommendations": ["tavsiya1", "tavsiya2", "tavsiya3"]
}
`;

@Injectable()
export class BusinessPlanService {
  constructor(
    @InjectRepository(BusinessPlan)
    private readonly businessPlanRepository: Repository<BusinessPlan>,
    private readonly aiService: AiService,
  ) {}

  async generate(
    user: User,
    dto: GenerateBusinessPlanDto,
  ): Promise<BusinessPlan> {
    const userPrompt = `
Biznes gʻoyasi: ${dto.businessIdea}
Soha: ${dto.industry}
Joylashuv: ${dto.location}
Boshlangʻich investitsiya: ${dto.initialInvestment} soʻm
Maqsadli auditoriya: ${dto.targetAudience || 'Belgilanmagan'}
Raqobatdagi ustunlik: ${dto.competitiveAdvantage || 'Belgilanmagan'}
    `.trim();

    const content = await this.aiService.generateJson(
      SYSTEM_PROMPT,
      userPrompt,
    );

    const plan = this.businessPlanRepository.create({
      user,
      title: dto.businessIdea,
      industry: dto.industry,
      initialInvestment: dto.initialInvestment,
      content,
    });

    return this.businessPlanRepository.save(plan);
  }

  async findAllByUser(userId: string): Promise<BusinessPlan[]> {
    return this.businessPlanRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<BusinessPlan> {
    const plan = await this.businessPlanRepository.findOne({
      where: { id, user: { id: userId } },
    });

    if (!plan) {
      throw new NotFoundException('Biznes-reja topilmadi');
    }

    return plan;
  }

  async remove(id: string, userId: string): Promise<void> {
    const plan = await this.findOne(id, userId);
    await this.businessPlanRepository.remove(plan);
  }
}
