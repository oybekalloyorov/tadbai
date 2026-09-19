import { Module } from '@nestjs/common';
import { MarketAnalysisService } from './market-analysis.service';
import { MarketAnalysisController } from './market-analysis.controller';
import { AiModule } from '../common/ai/ai.module';

@Module({
  imports: [AiModule],
  controllers: [MarketAnalysisController],
  providers: [MarketAnalysisService],
  exports: [MarketAnalysisService],
})
export class MarketAnalysisModule {}
