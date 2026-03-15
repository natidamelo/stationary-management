import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { SalesChartPeriod } from './dashboard.service';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('api/dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboard: DashboardService) {}

  @Get('summary')
  summary() {
    return this.dashboard.getSummary();
  }

  @Get('stock-summary')
  stockSummary() {
    return this.dashboard.getStockSummary();
  }

  @Get('sales-chart')
  salesChart(@Query('period') period: SalesChartPeriod = 'week') {
    return this.dashboard.getSalesChart(period);
  }
}
