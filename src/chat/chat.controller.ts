import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../common/entities/user.entity';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  @Throttle({ default: { limit: 15, ttl: 60 } })
  @ApiOperation({ summary: 'AI moliyaviy maslahatchiga xabar yuborish' })
  sendMessage(@CurrentUser() user: User, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(user, dto);
  }

  @Get('conversations')
  @ApiOperation({ summary: "Foydalanuvchining barcha suhbatlari roʻyxati" })
  getConversations(@CurrentUser() user: User) {
    return this.chatService.getConversations(user.id);
  }

  @Get('conversations/:conversationId')
  @ApiOperation({ summary: 'Bitta suhbat tarixini olish' })
  getConversation(
    @CurrentUser() user: User,
    @Param('conversationId') conversationId: string,
  ) {
    return this.chatService.getConversation(user.id, conversationId);
  }
}
