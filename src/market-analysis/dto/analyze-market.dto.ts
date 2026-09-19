import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class AnalyzeMarketDto {
  @ApiProperty({ example: 'Fitnes-klub xizmatlari' })
  @IsString()
  @MinLength(3)
  industry: string;

  @ApiProperty({ example: 'Toshkent shahri, Yunusobod tumani' })
  @IsString()
  location: string;

  @ApiProperty({
    example: 'Premium fitnes-klub, shaxsiy murabbiylar bilan',
    required: false,
  })
  @IsOptional()
  @IsString()
  productDescription?: string;
}
