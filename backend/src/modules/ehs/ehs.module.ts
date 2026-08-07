import { Module } from '@nestjs/common';
import { IncidentsController } from './incidents.controller';
import { IncidentsService } from './incidents.service';
import { PpeController } from './ppe.controller';
import { PpeService } from './ppe.service';
import { SafetyAuditsController } from './safety-audits.controller';
import { SafetyAuditsService } from './safety-audits.service';

@Module({
  controllers: [IncidentsController, PpeController, SafetyAuditsController],
  providers: [IncidentsService, PpeService, SafetyAuditsService],
  exports: [IncidentsService, PpeService, SafetyAuditsService],
})
export class EhsModule {}
