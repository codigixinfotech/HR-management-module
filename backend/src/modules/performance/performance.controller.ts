import { Controller, Get } from '@nestjs/common';
import { PerformanceService } from './performance.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get('status')
  @Permissions('performance.read')
  getStatus() {
    return this.performanceService.getStatus();
  }
}
