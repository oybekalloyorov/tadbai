import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'tadbirkor@mail.uz' })
  @IsEmail({}, { message: 'Yaroqli elektron pochta manzilini kiriting' })
  email: string;

  @ApiProperty({ example: 'StrongPass123!' })
  @IsString()
  password: string;
}
