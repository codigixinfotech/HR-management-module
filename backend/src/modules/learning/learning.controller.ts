import { Controller, Get } from '@nestjs/common';
import { LearningService } from './learning.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('learning')
export class LearningController {
  constructor(private readonly learningService: LearningService) {}

  @Get('status')
  @Permissions('learning.read')
  getStatus() {
    return this.learningService.getStatus();
  }
}
