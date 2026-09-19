import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * MarketReferenceData — rasmiy manbalardan (Davlat statistika qo'mitasi,
 * Jahon banki va h.k.) qo'lda tasdiqlangan bozor ko'rsatkichlari.
 * Bozor tahlili endi FAQAT AI taxminiga emas, shu jadvaldagi tekshirilgan
 * raqamlarga ham tayanadi — AI mos keladigan yozuv topilsa, aynan shu
 * raqamlardan foydalanishi va manbasini ko'rsatishi shart.
 */
@Entity('market_reference_data')
export class MarketReferenceData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'industry_label' })
  industryLabel: string;

  // Foydalanuvchi kiritgan soha/joylashuv matni bilan mosligini tekshirish
  // uchun kalit so'zlar (kichik harflarda saqlanadi).
  @Column({ type: 'text', array: true })
  keywords: string[];

  // Erkin tuzilishdagi ko'rsatkichlar to'plami, masalan:
  // { "MSME ulushi YAIMda": "55%" }
  @Column({ type: 'jsonb' })
  stats: Record<string, string>;

  @Column()
  source: string;

  @Column({ name: 'source_url', nullable: true, type: 'varchar' })
  sourceUrl: string | null;

  // Ma'lumot qaysi sanaga/davrga tegishli ekanini bildiradi (masalan "2025"
  // yoki "2026-04-01") — AI va foydalanuvchi bu raqamning eskirgan
  // bo'lishi mumkinligini bilishi uchun.
  @Column({ name: 'data_as_of' })
  dataAsOf: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}