import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../common/entities/user.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { BusinessPlan } from '../business-plan/entities/business-plan.entity';
import { LoanCalculation } from '../loan-calculator/entities/loan-calculation.entity';
import { ChatMessage } from '../chat/entities/chat-message.entity';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Transaction,
      BusinessPlan,
      LoanCalculation,
      ChatMessage,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule { }