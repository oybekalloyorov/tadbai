import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketReferenceData } from './entities/market-reference.entity';
import { MarketDataService } from './market-data.service';

@Module({
  imports: [TypeOrmModule.forFeature([MarketReferenceData])],
  providers: [MarketDataService],
  exports: [MarketDataService],
})
export class MarketDataModule { }