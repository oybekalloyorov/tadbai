import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../common/entities/user.entity';
import { AdminService } from './admin.service';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) { }

  @Get('stats')
  @ApiOperation({ summary: "Admin panel uchun umumiy statistika (foydalanuvchilar, platformalar, faoliyat)" })
  getStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({ summary: "Foydalanuvchilar ro'yxati (qidiruv, platforma va status bo'yicha filtrlash)" })
  getUsers(@Query() query: AdminUsersQueryDto) {
    return this.adminService.getUsers(query);
  }

  @Get('users/:id')
  @ApiOperation({ summary: "Bitta foydalanuvchi haqida to'liq ma'lumot (profil + faoliyat statistikasi)" })
  getUserDetail(@Param('id') id: string) {
    return this.adminService.getUserDetail(id);
  }

  @Patch('users/:id/status')
  @ApiOperation({ summary: "Foydalanuvchini bloklash/blokdan chiqarish" })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
    @CurrentUser() admin: User,
  ) {
    return this.adminService.updateStatus(id, dto, admin.id);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: "Foydalanuvchi rolini o'zgartirish (user/admin)" })
  updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateUserRoleDto,
    @CurrentUser() admin: User,
  ) {
    return this.adminService.updateRole(id, dto, admin.id);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: "Foydalanuvchini butunlay o'chirish" })
  removeUser(@Param('id') id: string, @CurrentUser() admin: User) {
    return this.adminService.removeUser(id, admin.id);
  }
}