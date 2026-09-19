import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { TaxCalculatorService } from './tax-calculator.service';
import { CalculateTaxDto } from './dto/calculate-tax.dto';

@ApiTags('tax-calculator')
@Controller('tax-calculator')
export class TaxCalculatorController {
  constructor(private readonly taxCalculatorService: TaxCalculatorService) {}

  @Post('calculate')
  @ApiOperation({
    summary:
      "Soliq hisob-kitobi: yagona soliq, umumbelgilangan tartib (QQS + foyda solig'i) yoki YATT qat'iy soliq",
  })
  calculate(@Body() dto: CalculateTaxDto) {
    return this.taxCalculatorService.calculate(dto);
  }
}
