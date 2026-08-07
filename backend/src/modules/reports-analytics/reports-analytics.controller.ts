import { Controller, Get } from '@nestjs/common';
import { ReportsAnalyticsService } from './reports-analytics.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('reports-analytics')
export class ReportsAnalyticsController {
  constructor(
    private readonly reportsAnalyticsService: ReportsAnalyticsService,
  ) {}

  @Get('status')
  @Permissions('reports_analytics.read')
  getStatus() {
    return this.reportsAnalyticsService.getStatus();
  }
}
