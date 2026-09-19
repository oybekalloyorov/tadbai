import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MarketAnalysisService } from './market-analysis.service';
import { AnalyzeMarketDto } from './dto/analyze-market.dto';

@ApiTags('market-analysis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('market-analysis')
export class MarketAnalysisController {
  constructor(
    private readonly marketAnalysisService: MarketAnalysisService,
  ) {}

  @Post('analyze')
  @ApiOperation({
    summary: "AI yordamida soha va joylashuv bo'yicha bozor tahlilini olish",
  })
  analyze(@Body() dto: AnalyzeMarketDto) {
    return this.marketAnalysisService.analyze(dto);
  }
}
