import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class GenerateBusinessPlanDto {
  @ApiProperty({ example: 'Fast-food restorani' })
  @IsString()
  @MinLength(3)
  businessIdea: string;

  @ApiProperty({ example: 'Oziq-ovqat va restoran xizmatlari' })
  @IsString()
  industry: string;

  @ApiProperty({ example: 'Toshkent shahri, Chilonzor tumani' })
  @IsString()
  location: string;

  @ApiProperty({ example: 150000000, description: "Boshlang'ich investitsiya (so'mda)" })
  @IsNumber()
  @Min(0)
  initialInvestment: number;

  @ApiProperty({
    example: 'Yosh oilalar va ofis xodimlari',
    required: false,
  })
  @IsOptional()
  @IsString()
  targetAudience?: string;

  @ApiProperty({ example: 'Sifatli va tez xizmat, qulay narx', required: false })
  @IsOptional()
  @IsString()
  competitiveAdvantage?: string;
}
