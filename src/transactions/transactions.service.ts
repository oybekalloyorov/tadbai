import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import {
  Transaction,
  TransactionType,
} from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { User } from '../common/entities/user.entity';

export type StatsPeriod = 'today' | 'week' | 'month' | 'all';

export interface CategoryBreakdown {
  category: string;
  amount: number;
  count: number;
}

export interface PeriodSummary {
  period: StatsPeriod;
  periodLabel: string;
  from: Date;
  to: Date;
  totalIncome: number;
  totalExpense: number;
  net: number;
  transactionCount: number;
  incomeByCategory: CategoryBreakdown[];
  expenseByCategory: CategoryBreakdown[];
}

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepository: Repository<Transaction>,
  ) { }

  async create(user: User, dto: CreateTransactionDto): Promise<Transaction> {
    const transaction = this.transactionRepository.create({
      user,
      type: dto.type,
      amount: dto.amount,
      category: dto.category,
      note: dto.note || null,
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
    });

    return this.transactionRepository.save(transaction);
  }

  async getRecent(userId: string, limit = 5): Promise<Transaction[]> {
    return this.transactionRepository.find({
      where: { user: { id: userId } },
      order: { occurredAt: 'DESC' },
      take: limit,
    });
  }

  async getSummary(
    userId: string,
    period: StatsPeriod = 'month',
  ): Promise<PeriodSummary> {
    const { from, to, label } = this.resolvePeriod(period);

    const where: any = { user: { id: userId } };
    if (period !== 'all') {
      where.occurredAt = Between(from, to);
    }

    const transactions = await this.transactionRepository.find({ where });

    let totalIncome = 0;
    let totalExpense = 0;
    const incomeMap = new Map<string, CategoryBreakdown>();
    const expenseMap = new Map<string, CategoryBreakdown>();

    for (const tx of transactions) {
      const amount = Number(tx.amount);
      const map = tx.type === TransactionType.INCOME ? incomeMap : expenseMap;

      if (tx.type === TransactionType.INCOME) {
        totalIncome += amount;
      } else {
        totalExpense += amount;
      }

      const existing = map.get(tx.category);
      if (existing) {
        existing.amount += amount;
        existing.count += 1;
      } else {
        map.set(tx.category, { category: tx.category, amount, count: 1 });
      }
    }

    const sortByAmountDesc = (a: CategoryBreakdown, b: CategoryBreakdown) =>
      b.amount - a.amount;

    return {
      period,
      periodLabel: label,
      from,
      to,
      totalIncome: this.round(totalIncome),
      totalExpense: this.round(totalExpense),
      net: this.round(totalIncome - totalExpense),
      transactionCount: transactions.length,
      incomeByCategory: [...incomeMap.values()].sort(sortByAmountDesc),
      expenseByCategory: [...expenseMap.values()].sort(sortByAmountDesc),
    };
  }

  private resolvePeriod(period: StatsPeriod): {
    from: Date;
    to: Date;
    label: string;
  } {
    const now = new Date();
    const to = now;

    if (period === 'today') {
      const from = new Date(now);
      from.setHours(0, 0, 0, 0);
      return { from, to, label: 'Bugun' };
    }

    if (period === 'week') {
      const from = new Date(now);
      // Dushanbani hafta boshi deb olamiz
      const day = from.getDay(); // 0=Yakshanba, 1=Dushanba, ...
      const diffToMonday = day === 0 ? 6 : day - 1;
      from.setDate(from.getDate() - diffToMonday);
      from.setHours(0, 0, 0, 0);
      return { from, to, label: 'Bu hafta' };
    }

    if (period === 'month') {
      const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      return { from, to, label: 'Bu oy' };
    }

    // 'all'
    const from = new Date(0);
    return { from, to, label: 'Barcha vaqt' };
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}