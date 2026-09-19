import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';
import { BusinessType } from '../../common/entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'tadbirkor@mail.uz' })
  @IsEmail({}, { message: 'Yaroqli elektron pochta manzilini kiriting' })
  email: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @MinLength(6, { message: 'Parol kamida 6 ta belgidan iborat boʻlishi kerak' })
  password: string;

  @ApiProperty({ example: 'Aliyev Vali' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: '+998901234567', required: false })
  @IsOptional()
  @IsPhoneNumber('UZ', { message: 'Yaroqli telefon raqamini kiriting' })
  phone?: string;

  @ApiProperty({ example: 'Tezkor Savdo MCHJ', required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ enum: BusinessType, required: false })
  @IsOptional()
  @IsEnum(BusinessType)
  businessType?: BusinessType;
}
