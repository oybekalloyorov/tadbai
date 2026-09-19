import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { TransactionType } from '../entities/transaction.entity';

export class CreateTransactionDto {
  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ example: 500000, description: "Summasi (so'mda)" })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ example: 'Savdo daromadi' })
  @IsString()
  @MinLength(2)
  category: string;

  @ApiProperty({ example: 'Noutbuk sotildi', required: false })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({
    required: false,
    description: "Amalga oshirilgan sana (ISO). Berilmasa hozirgi vaqt olinadi.",
  })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;
}