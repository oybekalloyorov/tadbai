import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoanCalculation } from './entities/loan-calculation.entity';
import { LoanCalculatorService } from './loan-calculator.service';
import { LoanCalculatorController } from './loan-calculator.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LoanCalculation])],
  controllers: [LoanCalculatorController],
  providers: [LoanCalculatorService],
  exports: [LoanCalculatorService],
})
export class LoanCalculatorModule {}
