import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../common/entities/user.entity';
import { BusinessPlanService } from './business-plan.service';
import { GenerateBusinessPlanDto } from './dto/generate-business-plan.dto';

@ApiTags('business-plan')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('business-plan')
export class BusinessPlanController {
  constructor(private readonly businessPlanService: BusinessPlanService) {}

  @Post('generate')
  @ApiOperation({ summary: 'AI yordamida yangi biznes-reja generatsiya qilish' })
  generate(
    @CurrentUser() user: User,
    @Body() dto: GenerateBusinessPlanDto,
  ) {
    return this.businessPlanService.generate(user, dto);
  }

  @Get()
  @ApiOperation({ summary: "Foydalanuvchining barcha biznes-rejalari" })
  findAll(@CurrentUser() user: User) {
    return this.businessPlanService.findAllByUser(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta biznes-rejani olish' })
  findOne(@CurrentUser() user: User, @Param('id') id: string) {
    return this.businessPlanService.findOne(id, user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: "Biznes-rejani o'chirish" })
  remove(@CurrentUser() user: User, @Param('id') id: string) {
    return this.businessPlanService.remove(id, user.id);
  }
}
