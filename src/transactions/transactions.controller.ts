import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../common/entities/user.entity';
import { TransactionsService, StatsPeriod } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) { }

  @Post()
  @ApiOperation({ summary: "Yangi kirim yoki chiqim yozuvini qo'shish" })
  create(@CurrentUser() user: User, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(user, dto);
  }

  @Get('summary')
  @ApiQuery({ name: 'period', enum: ['today', 'week', 'month', 'all'], required: false })
  @ApiOperation({ summary: "Davr bo'yicha kirim-chiqim statistikasi" })
  getSummary(
    @CurrentUser() user: User,
    @Query('period') period?: StatsPeriod,
  ) {
    return this.transactionsService.getSummary(user.id, period || 'month');
  }

  @Get('recent')
  @ApiOperation({ summary: "So'nggi yozuvlar ro'yxati" })
  getRecent(@CurrentUser() user: User, @Query('limit') limit?: string) {
    const parsedLimit = limit ? parseInt(limit, 10) : 5;
    return this.transactionsService.getRecent(user.id, parsedLimit);
  }
}