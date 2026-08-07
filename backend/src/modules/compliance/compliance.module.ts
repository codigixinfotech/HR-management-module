import { Module } from '@nestjs/common';
import { ComplianceTypesController } from './compliance-types.controller';
import { ComplianceTypesService } from './compliance-types.service';
import { ComplianceTasksController } from './compliance-tasks.controller';
import { ComplianceTasksService } from './compliance-tasks.service';

@Module({
  controllers: [ComplianceTypesController, ComplianceTasksController],
  providers: [ComplianceTypesService, ComplianceTasksService],
  exports: [ComplianceTypesService, ComplianceTasksService],
})
export class ComplianceModule {}
