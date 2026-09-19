import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import configuration from './config/configuration';
import { typeOrmConfig } from './config/typeorm.config';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LoanCalculatorModule } from './loan-calculator/loan-calculator.module';
import { TaxCalculatorModule } from './tax-calculator/tax-calculator.module';
import { BusinessPlanModule } from './business-plan/business-plan.module';
import { MarketAnalysisModule } from './market-analysis/market-analysis.module';
import { ChatModule } from './chat/chat.module';
import { AiModule } from './common/ai/ai.module';
import { TelegramModule } from './telegram/telegram.module';
import { TransactionsModule } from './transactions/transactions.module';
import { AdminModule } from './admin/admin.module';
import { BankOffersModule } from './bank-offers/bank-offers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRoot(typeOrmConfig),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60', 10) * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT || '30', 10),
      },
    ]),

    AuthModule,
    UsersModule,
    LoanCalculatorModule,
    TaxCalculatorModule,
    BusinessPlanModule,
    MarketAnalysisModule,
    ChatModule,
    AiModule,
    TelegramModule,
    TransactionsModule,
    AdminModule,
    BankOffersModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }