import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { PaymentMethod } from '../entities/loan-calculation.entity';

export class CalculateLoanDto {
  @ApiProperty({ example: 50000000, description: 'Kredit summasi (soʻmda)' })
  @IsNumber()
  @Min(100000, { message: 'Kredit summasi kamida 100 000 soʻm boʻlishi kerak' })
  loanAmount: number;

  @ApiProperty({ example: 24, description: 'Yillik foiz stavkasi (%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  annualRate: number;

  @ApiProperty({ example: 12, description: 'Kredit muddati (oy)' })
  @IsInt()
  @Min(1)
  @Max(360)
  termMonths: number;

  @ApiProperty({
    enum: PaymentMethod,
    default: PaymentMethod.ANNUITET,
    required: false,
    description:
      'Toʻlov usuli: annuitet (teng toʻlovlar) yoki differensial (kamayib boruvchi toʻlovlar)',
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod = PaymentMethod.ANNUITET;

  @ApiProperty({
    example: 0,
    required: false,
    description: 'Boshlangʻich toʻlov (agar mavjud boʻlsa)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  downPayment?: number = 0;
}
