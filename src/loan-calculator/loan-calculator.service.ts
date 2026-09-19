import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  LoanCalculation,
  PaymentMethod,
} from './entities/loan-calculation.entity';
import { CalculateLoanDto } from './dto/calculate-loan.dto';
import { User } from '../common/entities/user.entity';

export interface ScheduleRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remainingBalance: number;
}

export interface LoanResult {
  loanAmount: number;
  annualRate: number;
  termMonths: number;
  paymentMethod: PaymentMethod;
  monthlyPayment: number | null;
  firstPayment?: number;
  lastPayment?: number;
  totalPayment: number;
  totalInterest: number;
  schedule: ScheduleRow[];
}

@Injectable()
export class LoanCalculatorService {
  constructor(
    @InjectRepository(LoanCalculation)
    private readonly loanRepository: Repository<LoanCalculation>,
  ) {}

  calculate(dto: CalculateLoanDto): LoanResult {
    const principal = dto.loanAmount - (dto.downPayment || 0);
    const monthlyRate = dto.annualRate / 100 / 12;
    const method = dto.paymentMethod || PaymentMethod.ANNUITET;

    if (method === PaymentMethod.DIFFERENSIAL) {
      return this.calculateDifferential(principal, monthlyRate, dto);
    }

    return this.calculateAnnuitet(principal, monthlyRate, dto);
  }

  /**
   * Annuitet usuli: har oy bir xil summa toʻlanadi.
   * Formula: A = P * (r * (1+r)^n) / ((1+r)^n - 1)
   */
  private calculateAnnuitet(
    principal: number,
    monthlyRate: number,
    dto: CalculateLoanDto,
  ): LoanResult {
    const n = dto.termMonths;
    let monthlyPayment: number;

    if (monthlyRate === 0) {
      monthlyPayment = principal / n;
    } else {
      const factor = Math.pow(1 + monthlyRate, n);
      monthlyPayment = (principal * monthlyRate * factor) / (factor - 1);
    }

    const schedule: ScheduleRow[] = [];
    let remainingBalance = principal;
    let totalPayment = 0;

    for (let month = 1; month <= n; month++) {
      const interest = remainingBalance * monthlyRate;
      let principalPart = monthlyPayment - interest;

      // Oxirgi oyda yaxlitlash xatosini toʻgʻrilash
      if (month === n) {
        principalPart = remainingBalance;
        monthlyPayment = principalPart + interest;
      }

      remainingBalance -= principalPart;
      totalPayment += principalPart + interest;

      schedule.push({
        month,
        payment: this.round(principalPart + interest),
        principal: this.round(principalPart),
        interest: this.round(interest),
        remainingBalance: this.round(Math.max(remainingBalance, 0)),
      });
    }

    const totalInterest = totalPayment - principal;

    return {
      loanAmount: principal,
      annualRate: dto.annualRate,
      termMonths: n,
      paymentMethod: PaymentMethod.ANNUITET,
      monthlyPayment: this.round(schedule[0]?.payment ?? 0),
      totalPayment: this.round(totalPayment),
      totalInterest: this.round(totalInterest),
      schedule,
    };
  }

  /**
   * Differensial usul: asosiy qarz har oyda teng qismlarga boʻlinadi,
   * foiz esa qolgan qarz asosida hisoblanadi — toʻlovlar vaqt oʻtishi bilan kamayadi.
   */
  private calculateDifferential(
    principal: number,
    monthlyRate: number,
    dto: CalculateLoanDto,
  ): LoanResult {
    const n = dto.termMonths;
    const principalPart = principal / n;

    const schedule: ScheduleRow[] = [];
    let remainingBalance = principal;
    let totalPayment = 0;

    for (let month = 1; month <= n; month++) {
      const interest = remainingBalance * monthlyRate;
      const payment = principalPart + interest;

      remainingBalance -= principalPart;
      totalPayment += payment;

      schedule.push({
        month,
        payment: this.round(payment),
        principal: this.round(principalPart),
        interest: this.round(interest),
        remainingBalance: this.round(Math.max(remainingBalance, 0)),
      });
    }

    const totalInterest = totalPayment - principal;

    return {
      loanAmount: principal,
      annualRate: dto.annualRate,
      termMonths: n,
      paymentMethod: PaymentMethod.DIFFERENSIAL,
      monthlyPayment: null,
      firstPayment: schedule[0]?.payment,
      lastPayment: schedule[schedule.length - 1]?.payment,
      totalPayment: this.round(totalPayment),
      totalInterest: this.round(totalInterest),
      schedule,
    };
  }

  async saveCalculation(
    user: User,
    dto: CalculateLoanDto,
    result: LoanResult,
  ): Promise<LoanCalculation> {
    const entity = this.loanRepository.create({
      user,
      loanAmount: dto.loanAmount,
      annualRate: dto.annualRate,
      termMonths: dto.termMonths,
      paymentMethod: result.paymentMethod,
      monthlyPayment: result.monthlyPayment ?? undefined,
      totalPayment: result.totalPayment,
      totalInterest: result.totalInterest,
      schedule: result.schedule,
    });

    return this.loanRepository.save(entity);
  }

  async getHistory(userId: string): Promise<LoanCalculation[]> {
    return this.loanRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
