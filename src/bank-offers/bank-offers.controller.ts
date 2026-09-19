import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BankOffersService, BankCreditOffersResult } from './bank-offers.service';

@Controller('bank-offers')
@UseGuards(JwtAuthGuard)
export class BankOffersController {
  constructor(private readonly bankOffersService: BankOffersService) { }

  @Get('credits')
  async credits(@Query('page') page?: string): Promise<BankCreditOffersResult> {
    const parsedPage = parseInt(page || '1', 10);
    const safePage = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
    return this.bankOffersService.getCredits(safePage);
  }
}