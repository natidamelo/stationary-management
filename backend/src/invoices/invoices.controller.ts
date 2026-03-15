import { Controller, Get, Param, Post, Put, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { RoleEnum } from '../common/enums';

@ApiTags('invoices')
@ApiBearerAuth()
@Controller('api/invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private invoices: InvoicesService) { }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.RECEPTION, RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DEALER)
  list() {
    return this.invoices.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.RECEPTION, RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DEALER)
  getOne(@Param('id') id: string) {
    return this.invoices.findOne(id);
  }

  @Post('from-sale')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.RECEPTION, RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DEALER)
  createFromSale(
    @Body() body: { saleId: string; customerEmail?: string; customerAddress?: string },
  ) {
    return this.invoices.createFromSale(body.saleId, {
      customerEmail: body.customerEmail,
      customerAddress: body.customerAddress,
    });
  }

  @Put(':id/pay')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.RECEPTION, RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.DEALER)
  markPaid(@Param('id') id: string, @Body() body: { amountPaid?: number }) {
    return this.invoices.markPaid(id, body.amountPaid);
  }
}
