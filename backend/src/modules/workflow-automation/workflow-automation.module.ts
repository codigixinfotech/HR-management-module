import { Module } from '@nestjs/common';
import { WorkflowAutomationController } from './workflow-automation.controller';
import { WorkflowAutomationService } from './workflow-automation.service';

@Module({
  controllers: [WorkflowAutomationController],
  providers: [WorkflowAutomationService],
})
export class WorkflowAutomationModule {}
