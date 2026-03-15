import { Controller, Get, Post, Delete, Header, Query, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { RoleEnum } from '../common/enums';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('api/reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Get('stock')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.DEALER, RoleEnum.ADMIN, RoleEnum.MANAGER)
  async stockReport() {
    return this.reports.stockReport();
  }

  @Get('stock/period')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.DEALER, RoleEnum.ADMIN, RoleEnum.MANAGER)
  stockReportByPeriod(@Query('period') period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' = 'daily') {
    return this.reports.stockReportByPeriod(period);
  }

  @Get('stock/csv')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.DEALER, RoleEnum.ADMIN, RoleEnum.MANAGER)
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename=stock-report.csv')
  async stockReportCsv() {
    const rows = await this.reports.stockReport();
    const header = 'SKU,Name,Category,Unit,Reorder Level,Current Stock,Price\n';
    const lines = rows.map(
      (r) =>
        `${r.sku},${r.name},${r.category || ''},${r.unit},${r.reorderLevel},${r.currentStock},${r.price}`,
    );
    return header + lines.join('\n');
  }

  @Get('financial')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.DEALER, RoleEnum.ADMIN, RoleEnum.MANAGER)
  financialSummary(@Query('period') period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' = 'monthly') {
    return this.reports.financialSummary(period);
  }

  @Get('sales')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.DEALER, RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.RECEPTION)
  salesReport(@Query('period') period: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' = 'daily') {
    return this.reports.salesReport(period);
  }

  @Get('business-overview')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.DEALER, RoleEnum.ADMIN, RoleEnum.MANAGER)
  businessOverview(@Query('period') period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' = 'monthly') {
    return this.reports.businessOverview(period);
  }

  @Get('cost-profit')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.DEALER, RoleEnum.ADMIN, RoleEnum.MANAGER)
  costProfitAnalysis(@Query('period') period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' = 'monthly') {
    return this.reports.costProfitAnalysis(period);
  }

  @Get('service-analytics')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.DEALER, RoleEnum.ADMIN, RoleEnum.MANAGER)
  serviceAnalytics(@Query('period') period: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' = 'monthly') {
    return this.reports.serviceAnalytics(period);
  }

  @Get('inventory')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.DEALER, RoleEnum.ADMIN, RoleEnum.MANAGER)
  inventoryReport() {
    return this.reports.inventoryReport();
  }

  @Post('operating-expenses')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.DEALER, RoleEnum.ADMIN, RoleEnum.MANAGER)
  createOperatingExpense(
    @Body() body: { date: string; description: string; amount: number; category?: string },
  ) {
    return this.reports.createOperatingExpense(body);
  }

  @Delete('operating-expenses/:id')
  @UseGuards(RolesGuard)
  @Roles(RoleEnum.DEALER, RoleEnum.ADMIN, RoleEnum.MANAGER)
  deleteOperatingExpense(@Param('id') id: string) {
    return this.reports.deleteOperatingExpense(id);
  }
}
