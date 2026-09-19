import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { UsersModule } from '../users/users.module';
import { LoanCalculatorModule } from '../loan-calculator/loan-calculator.module';
import { TaxCalculatorModule } from '../tax-calculator/tax-calculator.module';
import { BusinessPlanModule } from '../business-plan/business-plan.module';
import { MarketAnalysisModule } from '../market-analysis/market-analysis.module';
import { ChatModule } from '../chat/chat.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [
    UsersModule,
    LoanCalculatorModule,
    TaxCalculatorModule,
    BusinessPlanModule,
    MarketAnalysisModule,
    ChatModule,
    TransactionsModule,
  ],
  providers: [TelegramService],
})
export class TelegramModule { }