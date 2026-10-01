import { Module } from '@nestjs/common';
import { ShiftTypesController } from './shift-types.controller';
import { ShiftTypesService } from './shift-types.service';
import { ShiftAssignmentsController } from './shift-assignments.controller';
import { ShiftAssignmentsService } from './shift-assignments.service';
import { ShiftLifecycleController } from './shift-lifecycle.controller';
import { ShiftLifecycleService } from './shift-lifecycle.service';
import { WeeklyOffPoliciesController } from './weekly-off-policies.controller';
import { WeeklyOffPoliciesService } from './weekly-off-policies.service';

@Module({
  controllers: [
    ShiftTypesController,
    ShiftAssignmentsController,
    ShiftLifecycleController,
    WeeklyOffPoliciesController,
  ],
  providers: [
    ShiftTypesService,
    ShiftAssignmentsService,
    ShiftLifecycleService,
    WeeklyOffPoliciesService,
  ],
  exports: [
    ShiftTypesService,
    ShiftAssignmentsService,
    ShiftLifecycleService,
    WeeklyOffPoliciesService,
  ],
})
export class WorkforceModule {}

