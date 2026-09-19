import { Module } from '@nestjs/common';
import { MarketAnalysisService } from './market-analysis.service';
import { MarketAnalysisController } from './market-analysis.controller';
import { AiModule } from '../common/ai/ai.module';
import { MarketDataModule } from 'src/market-data/market-data.module';

@Module({
  imports: [AiModule, MarketDataModule],
  controllers: [MarketAnalysisController],
  providers: [MarketAnalysisService],
  exports: [MarketAnalysisService],
})
export class MarketAnalysisModule { }