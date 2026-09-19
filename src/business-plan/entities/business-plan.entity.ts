import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../common/entities/user.entity';

@Entity('business_plans')
export class BusinessPlan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.businessPlans, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  title: string;

  @Column({ name: 'industry' })
  industry: string;

  @Column({ type: 'jsonb' })
  content: Record<string, any>;

  @Column({ name: 'initial_investment', type: 'decimal', precision: 18, scale: 2, nullable: true })
  initialInvestment: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
