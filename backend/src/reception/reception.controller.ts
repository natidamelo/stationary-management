import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReceptionService } from './reception.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserPayload } from '../common/user.types';
import { RoleEnum } from '../common/enums';

@ApiTags('reception')
@ApiBearerAuth()
@Controller('api/reception')
@UseGuards(JwtAuthGuard)
export class ReceptionController {
  constructor(private reception: ReceptionService) {}

  @Get('dashboard')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.RECEPTION, RoleEnum.ADMIN, RoleEnum.MANAGER)
  dashboard() {
    return this.reception.getDashboard();
  }

  @Get('sales/unpaid')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.RECEPTION, RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DEALER)
  unpaidSales() {
    return this.reception.getUnpaidSales();
  }

  @Get('sales/today')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.RECEPTION, RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DEALER)
  todaysSales() {
    return this.reception.getTodaysSales();
  }

  @Post('sell')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.RECEPTION, RoleEnum.ADMIN)
  sell(
    @Body()
    body: {
      lines: { itemId?: string; serviceId?: string; quantity: number; unitPrice: number }[];
      amountPaid?: number;
      customerName?: string;
      notes?: string;
      paymentMethod?: string;
    },
    @CurrentUser() user: UserPayload,
  ) {
    return this.reception.sell(body, user);
  }

  @Post('sales/:id/pay')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.RECEPTION, RoleEnum.ADMIN)
  recordPayment(
    @Param('id') saleId: string,
    @Body() body: { amount: number; paymentMethod?: string },
    @CurrentUser() user: UserPayload,
  ) {
    return this.reception.recordPayment(saleId, body, user);
  }
}
