import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { BusinessPlan } from '../../business-plan/entities/business-plan.entity';
import { ChatMessage } from '../../chat/entities/chat-message.entity';
import { LoanCalculation } from '../../loan-calculator/entities/loan-calculation.entity';

export enum BusinessType {
  YATT = 'yakka_tartibdagi_tadbirkor',
  MCHJ = 'mchj',
  FERMER = 'fermer_xojaligi',
  BOSHQA = 'boshqa',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'company_name', nullable: true })
  companyName: string;

  @Column({
    type: 'enum',
    enum: BusinessType,
    default: BusinessType.YATT,
    name: 'business_type',
  })
  businessType: BusinessType;

  @Column({ default: 'user' })
  role: 'user' | 'admin';

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({
    type: 'varchar',
    name: 'telegram_chat_id',
    unique: true,
    nullable: true,
  })
  telegramChatId: string | null;

  @Column({ type: 'varchar', name: 'telegram_username', nullable: true })
  telegramUsername: string | null;

  @OneToMany(() => BusinessPlan, (plan) => plan.user)
  businessPlans: BusinessPlan[];

  @OneToMany(() => ChatMessage, (message) => message.user)
  chatMessages: ChatMessage[];

  @OneToMany(() => LoanCalculation, (loan) => loan.user)
  loanCalculations: LoanCalculation[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
