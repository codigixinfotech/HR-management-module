import { Module } from '@nestjs/common';
import { ReportsAnalyticsController } from './reports-analytics.controller';
import { ReportsAnalyticsService } from './reports-analytics.service';

@Module({
  controllers: [ReportsAnalyticsController],
  providers: [ReportsAnalyticsService],
})
export class ReportsAnalyticsModule {}
