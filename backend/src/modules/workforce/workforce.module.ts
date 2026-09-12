import { Module } from '@nestjs/common';
import { ShiftTypesController } from './shift-types.controller';
import { ShiftTypesService } from './shift-types.service';
import { ShiftAssignmentsController } from './shift-assignments.controller';
import { ShiftAssignmentsService } from './shift-assignments.service';
import { ShiftLifecycleController } from './shift-lifecycle.controller';
import { ShiftLifecycleService } from './shift-lifecycle.service';

@Module({
  controllers: [
    ShiftTypesController,
    ShiftAssignmentsController,
    ShiftLifecycleController,
  ],
  providers: [
    ShiftTypesService,
    ShiftAssignmentsService,
    ShiftLifecycleService,
  ],
  exports: [
    ShiftTypesService,
    ShiftAssignmentsService,
    ShiftLifecycleService,
  ],
})
export class WorkforceModule {}
