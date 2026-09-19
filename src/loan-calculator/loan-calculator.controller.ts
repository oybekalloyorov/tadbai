import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../common/entities/user.entity';
import { LoanCalculatorService } from './loan-calculator.service';
import { CalculateLoanDto } from './dto/calculate-loan.dto';

@ApiTags('loan-calculator')
@Controller('loan-calculator')
export class LoanCalculatorController {
  constructor(private readonly loanCalculatorService: LoanCalculatorService) {}

  @Post('calculate')
  @ApiOperation({
    summary:
      'Kredit toʻlovlarini hisoblash (annuitet yoki differensial usulda)',
  })
  calculate(@Body() dto: CalculateLoanDto) {
    return this.loanCalculatorService.calculate(dto);
  }

  @Post('calculate-and-save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hisoblash va profilga saqlash' })
  async calculateAndSave(
    @CurrentUser() user: User,
    @Body() dto: CalculateLoanDto,
  ) {
    const result = this.loanCalculatorService.calculate(dto);
    const saved = await this.loanCalculatorService.saveCalculation(
      user,
      dto,
      result,
    );
    return { ...result, id: saved.id, savedAt: saved.createdAt };
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Foydalanuvchining kredit hisob-kitoblari tarixi' })
  getHistory(@CurrentUser() user: User) {
    return this.loanCalculatorService.getHistory(user.id);
  }
}
