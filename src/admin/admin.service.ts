import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessType, User } from '../common/entities/user.entity';
import { Transaction, TransactionType } from '../transactions/entities/transaction.entity';
import { BusinessPlan } from '../business-plan/entities/business-plan.entity';
import { LoanCalculation } from '../loan-calculator/entities/loan-calculation.entity';
import { ChatMessage } from '../chat/entities/chat-message.entity';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

export interface PaginatedUsers {
  items: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Transaction)
    private readonly transactionsRepository: Repository<Transaction>,
    @InjectRepository(BusinessPlan)
    private readonly businessPlanRepository: Repository<BusinessPlan>,
    @InjectRepository(LoanCalculation)
    private readonly loanCalculationRepository: Repository<LoanCalculation>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
  ) { }

  /**
   * Admin panel bosh sahifasi uchun umumiy statistika: nechta foydalanuvchi
   * bor, ular qaysi platformadan foydalanmoqda, so'nggi faollik va
   * platformadagi umumiy moliyaviy/AI faoliyat hajmi.
   */
  async getDashboardStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 7);

    const [
      totalUsers,
      usersWeb,
      usersTelegram,
      usersBoth,
      blockedUsers,
      adminsCount,
      newUsersToday,
      newUsersThisWeek,
      activeToday,
      activeThisWeek,
      businessTypeBreakdownRaw,
      transactionTotalsRaw,
      totalBusinessPlans,
      totalLoanCalculations,
      totalChatConversationsRaw,
    ] = await Promise.all([
      this.usersRepository.count(),
      this.usersRepository.count({ where: { hasWebLogin: true } }),
      this.usersRepository
        .createQueryBuilder('u')
        .where('u.telegramChatId IS NOT NULL')
        .getCount(),
      this.usersRepository
        .createQueryBuilder('u')
        .where('u.telegramChatId IS NOT NULL')
        .andWhere('u.hasWebLogin = true')
        .getCount(),
      this.usersRepository.count({ where: { isActive: false } }),
      this.usersRepository.count({ where: { role: 'admin' } }),
      this.usersRepository
        .createQueryBuilder('u')
        .where('u.createdAt >= :todayStart', { todayStart })
        .getCount(),
      this.usersRepository
        .createQueryBuilder('u')
        .where('u.createdAt >= :weekStart', { weekStart })
        .getCount(),
      this.usersRepository
        .createQueryBuilder('u')
        .where('u.lastSeenAt >= :todayStart', { todayStart })
        .getCount(),
      this.usersRepository
        .createQueryBuilder('u')
        .where('u.lastSeenAt >= :weekStart', { weekStart })
        .getCount(),
      this.usersRepository
        .createQueryBuilder('u')
        .select('u.businessType', 'businessType')
        .addSelect('COUNT(*)', 'count')
        .groupBy('u.businessType')
        .getRawMany(),
      this.transactionsRepository
        .createQueryBuilder('t')
        .select('t.type', 'type')
        .addSelect('SUM(t.amount)', 'total')
        .addSelect('COUNT(*)', 'count')
        .groupBy('t.type')
        .getRawMany(),
      this.businessPlanRepository.count(),
      this.loanCalculationRepository.count(),
      this.chatMessageRepository
        .createQueryBuilder('m')
        .select('COUNT(DISTINCT m.conversationId)', 'count')
        .getRawOne(),
    ]);

    const businessTypeBreakdown = Object.values(BusinessType).map((type) => {
      const found = businessTypeBreakdownRaw.find((r) => r.businessType === type);
      return { businessType: type, count: found ? Number(found.count) : 0 };
    });

    const income = transactionTotalsRaw.find((r) => r.type === TransactionType.INCOME);
    const expense = transactionTotalsRaw.find((r) => r.type === TransactionType.EXPENSE);

    return {
      users: {
        total: totalUsers,
        web: usersWeb,
        telegram: usersTelegram,
        both: usersBoth,
        webOnly: usersWeb - usersBoth,
        telegramOnly: usersTelegram - usersBoth,
        blocked: blockedUsers,
        admins: adminsCount,
        newToday: newUsersToday,
        newThisWeek: newUsersThisWeek,
        activeToday,
        activeThisWeek,
      },
      businessTypeBreakdown,
      activity: {
        totalTransactions: (income ? Number(income.count) : 0) + (expense ? Number(expense.count) : 0),
        totalIncome: income ? Number(income.total) : 0,
        totalExpense: expense ? Number(expense.total) : 0,
        totalBusinessPlans,
        totalLoanCalculations,
        totalChatConversations: totalChatConversationsRaw ? Number(totalChatConversationsRaw.count) : 0,
      },
      generatedAt: now.toISOString(),
    };
  }

  async getUsers(query: AdminUsersQueryDto): Promise<PaginatedUsers> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const qb = this.usersRepository.createQueryBuilder('u');

    if (query.search) {
      qb.andWhere(
        '(u.fullName ILIKE :search OR u.email ILIKE :search OR u.phone ILIKE :search OR u.companyName ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.platform === 'web') {
      qb.andWhere('u.hasWebLogin = true');
    } else if (query.platform === 'telegram') {
      qb.andWhere('u.telegramChatId IS NOT NULL');
    } else if (query.platform === 'both') {
      qb.andWhere('u.hasWebLogin = true').andWhere('u.telegramChatId IS NOT NULL');
    } else if (query.platform === 'none') {
      qb.andWhere('u.hasWebLogin = false').andWhere('u.telegramChatId IS NULL');
    }

    if (query.businessType) {
      qb.andWhere('u.businessType = :businessType', { businessType: query.businessType });
    }

    if (query.status === 'active') {
      qb.andWhere('u.isActive = true');
    } else if (query.status === 'blocked') {
      qb.andWhere('u.isActive = false');
    }

    qb.orderBy('u.createdAt', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async getUserDetail(id: string) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    const [transactionTotalsRaw, businessPlansCount, loanCalculationsCount, chatStatsRaw, recentTransactions] =
      await Promise.all([
        this.transactionsRepository
          .createQueryBuilder('t')
          .leftJoin('t.user', 'u')
          .select('t.type', 'type')
          .addSelect('SUM(t.amount)', 'total')
          .addSelect('COUNT(*)', 'count')
          .where('u.id = :id', { id })
          .groupBy('t.type')
          .getRawMany(),
        this.businessPlanRepository
          .createQueryBuilder('bp')
          .leftJoin('bp.user', 'u')
          .where('u.id = :id', { id })
          .getCount(),
        this.loanCalculationRepository
          .createQueryBuilder('lc')
          .leftJoin('lc.user', 'u')
          .where('u.id = :id', { id })
          .getCount(),
        this.chatMessageRepository
          .createQueryBuilder('m')
          .leftJoin('m.user', 'u')
          .select('COUNT(DISTINCT m.conversationId)', 'conversations')
          .addSelect('COUNT(*)', 'messages')
          .where('u.id = :id', { id })
          .getRawOne(),
        this.transactionsRepository
          .createQueryBuilder('t')
          .leftJoin('t.user', 'u')
          .where('u.id = :id', { id })
          .orderBy('t.occurredAt', 'DESC')
          .take(10)
          .getMany(),
      ]);

    const income = transactionTotalsRaw.find((r) => r.type === TransactionType.INCOME);
    const expense = transactionTotalsRaw.find((r) => r.type === TransactionType.EXPENSE);

    return {
      user,
      stats: {
        totalIncome: income ? Number(income.total) : 0,
        totalExpense: expense ? Number(expense.total) : 0,
        transactionCount:
          (income ? Number(income.count) : 0) + (expense ? Number(expense.count) : 0),
        businessPlansCount,
        loanCalculationsCount,
        chatConversations: chatStatsRaw ? Number(chatStatsRaw.conversations) : 0,
        chatMessages: chatStatsRaw ? Number(chatStatsRaw.messages) : 0,
      },
      recentTransactions,
    };
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto, currentAdminId: string): Promise<User> {
    if (id === currentAdminId && !dto.isActive) {
      throw new BadRequestException("O'zingizni bloklay olmaysiz");
    }

    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    user.isActive = dto.isActive;
    return this.usersRepository.save(user);
  }

  async updateRole(id: string, dto: UpdateUserRoleDto, currentAdminId: string): Promise<User> {
    if (id === currentAdminId && dto.role !== 'admin') {
      throw new BadRequestException("O'zingizni admin rolidan chiqara olmaysiz");
    }

    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    user.role = dto.role;
    return this.usersRepository.save(user);
  }

  async removeUser(id: string, currentAdminId: string): Promise<void> {
    if (id === currentAdminId) {
      throw new ForbiddenException("O'zingizni o'chira olmaysiz");
    }

    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Foydalanuvchi topilmadi');
    }

    await this.usersRepository.remove(user);
  }
}