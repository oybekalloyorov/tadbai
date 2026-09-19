import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../common/entities/user.entity';

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

// Standart turkumlar — Telegram bot va frontendda tanlov tugmalari sifatida
// ishlatiladi, lekin ustun oddiy varchar boʻlgani uchun erkin matn ham
// saqlanishi mumkin (kelajakda foydalanuvchi oʻz turkumini kiritishi uchun).
export const INCOME_CATEGORIES = [
  'Savdo daromadi',
  "Xizmat koʻrsatish",
  'Ijara daromadi',
  'Boshqa daromad',
];

export const EXPENSE_CATEGORIES = [
  "Ijara toʻlovi",
  'Xodimlar maoshi',
  'Tovar-xomashyo',
  'Kommunal xizmatlar',
  'Transport',
  'Reklama',
  "Soliq toʻlovi",
  'Boshqa xarajat',
];

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amount: number;

  @Column({ type: 'varchar' })
  category: string;

  @Column({ type: 'varchar', nullable: true })
  note: string | null;

  @Index()
  @Column({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}