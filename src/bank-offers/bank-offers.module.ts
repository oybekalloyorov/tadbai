import { Module } from '@nestjs/common';
import { BankOffersController } from './bank-offers.controller';
import { BankOffersService } from './bank-offers.service';

@Module({
  controllers: [BankOffersController],
  providers: [BankOffersService],
})
export class BankOffersModule { }