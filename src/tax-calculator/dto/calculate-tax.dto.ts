import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';

export enum TaxpayerType {
  YAGONA_SOLIQ = 'yagona_soliq', // Aylanmadan yagona soliq toʻlovchi (kichik biznes)
  QQS_TOLOVCHI = 'qqs_tolovchi', // Umumbelgilangan tartibda QQS + foyda solig'i toʻlovchi
  YATT_QATIY = 'yatt_qatiy_belgilangan', // Yakka tartibdagi tadbirkor - qat'iy belgilangan soliq
}

export class CalculateTaxDto {
  @ApiProperty({ enum: TaxpayerType, example: TaxpayerType.YAGONA_SOLIQ })
  @IsEnum(TaxpayerType)
  taxpayerType: TaxpayerType;

  @ApiProperty({
    example: 500000000,
    description: 'Yillik yalpi aylanma (tushum), soʻmda',
  })
  @IsNumber()
  @Min(0)
  annualRevenue: number;

  @ApiProperty({
    example: 350000000,
    required: false,
    description: 'Yillik xarajatlar (faqat QQS/foyda solig\'i toʻlovchilar uchun)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  annualExpenses?: number;

  @ApiProperty({
    example: 'toshkent_shahar',
    required: false,
    description: "YATT uchun hudud kodi (qat'iy belgilangan stavkaga ta'sir qiladi)",
  })
  @IsOptional()
  region?: string;
}
