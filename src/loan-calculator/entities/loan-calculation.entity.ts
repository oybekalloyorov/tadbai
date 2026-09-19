import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../common/entities/user.entity';

export enum PaymentMethod {
  ANNUITET = 'annuitet',
  DIFFERENSIAL = 'differensial',
}

@Entity('loan_calculations')
export class LoanCalculation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.loanCalculations, {
    onDelete: 'CASCADE',
  })
  user: User;

  @Column({ name: 'loan_amount', type: 'decimal', precision: 18, scale: 2 })
  loanAmount: number;

  @Column({ name: 'annual_rate', type: 'decimal', precision: 5, scale: 2 })
  annualRate: number;

  @Column({ name: 'term_months' })
  termMonths: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.ANNUITET,
    name: 'payment_method',
  })
  paymentMethod: PaymentMethod;

  @Column({ name: 'monthly_payment', type: 'decimal', precision: 18, scale: 2, nullable: true })
  monthlyPayment: number;

  @Column({ name: 'total_payment', type: 'decimal', precision: 18, scale: 2 })
  totalPayment: number;

  @Column({ name: 'total_interest', type: 'decimal', precision: 18, scale: 2 })
  totalInterest: number;

  @Column({ type: 'jsonb', nullable: true })
  schedule: Record<string, any>[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
