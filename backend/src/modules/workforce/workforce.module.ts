import { Module } from '@nestjs/common';
import { ShiftTypesController } from './shift-types.controller';
import { ShiftTypesService } from './shift-types.service';
import { ShiftAssignmentsController } from './shift-assignments.controller';
import { ShiftAssignmentsService } from './shift-assignments.service';

@Module({
  controllers: [ShiftTypesController, ShiftAssignmentsController],
  providers: [ShiftTypesService, ShiftAssignmentsService],
  exports: [ShiftTypesService, ShiftAssignmentsService],
})
export class WorkforceModule {}
