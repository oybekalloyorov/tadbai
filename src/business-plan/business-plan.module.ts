import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BusinessPlan } from './entities/business-plan.entity';
import { BusinessPlanService } from './business-plan.service';
import { BusinessPlanController } from './business-plan.controller';
import { AiModule } from '../common/ai/ai.module';

@Module({
  imports: [TypeOrmModule.forFeature([BusinessPlan]), AiModule],
  controllers: [BusinessPlanController],
  providers: [BusinessPlanService],
  exports: [BusinessPlanService],
})
export class BusinessPlanModule {}
