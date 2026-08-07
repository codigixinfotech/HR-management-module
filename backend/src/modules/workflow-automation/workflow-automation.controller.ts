import { Controller, Get } from '@nestjs/common';
import { WorkflowAutomationService } from './workflow-automation.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('workflow-automation')
export class WorkflowAutomationController {
  constructor(
    private readonly workflowAutomationService: WorkflowAutomationService,
  ) {}

  @Get('status')
  @Permissions('workflow_automation.read')
  getStatus() {
    return this.workflowAutomationService.getStatus();
  }
}
