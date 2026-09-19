import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    example:
      "Menda 100 million so'm bor, qaysi biznesga sarmoya kiritsam yaxshi bo'ladi?",
  })
  @IsString()
  @MinLength(1)
  message: string;

  @ApiProperty({
    required: false,
    description:
      "Suhbat identifikatori. Berilmasa yangi suhbat boshlanadi.",
  })
  @IsOptional()
  @IsUUID()
  conversationId?: string;
}
