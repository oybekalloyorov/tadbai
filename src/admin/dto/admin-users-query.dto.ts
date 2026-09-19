import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { BusinessType } from '../../common/entities/user.entity';

export type PlatformFilter = 'web' | 'telegram' | 'both' | 'none';

export class AdminUsersQueryDto {
  @ApiProperty({ required: false, description: 'Ism, email, telefon yoki kompaniya bo\'yicha qidiruv' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    required: false,
    enum: ['web', 'telegram', 'both', 'none'],
    description:
      "'web' — faqat saytdan, 'telegram' — faqat botdan, 'both' — ikkalasidan ham, 'none' — hech biridan (kamdan-kam)",
  })
  @IsOptional()
  @IsIn(['web', 'telegram', 'both', 'none'])
  platform?: PlatformFilter;

  @ApiProperty({ required: false, enum: BusinessType })
  @IsOptional()
  @IsEnum(BusinessType)
  businessType?: BusinessType;

  @ApiProperty({ required: false, enum: ['active', 'blocked'] })
  @IsOptional()
  @IsIn(['active', 'blocked'])
  status?: 'active' | 'blocked';

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}