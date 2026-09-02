import { Module } from '@nestjs/common';
import { ComplianceTypesController } from './compliance-types.controller';
import { ComplianceTypesService } from './compliance-types.service';
import { ComplianceTasksController } from './compliance-tasks.controller';
import { ComplianceTasksService } from './compliance-tasks.service';
import { PfComplianceModule } from './pf/pf-compliance.module';
import { PtComplianceModule } from './pt/pt-compliance.module';
import { EsicComplianceModule } from './esic/esic-compliance.module';
import { TdsComplianceModule } from './tds/tds-compliance.module';
import { LabourComplianceModule } from './labour/labour-compliance.module';
import { ReturnsComplianceModule } from './returns/returns-compliance.module';
import { ReportsComplianceModule } from './reports/reports-compliance.module';

import { ComplianceSetupController } from './compliance-setup.controller';
import { ComplianceSetupService } from './compliance-setup.service';

@Module({
  imports: [
    PfComplianceModule,
    PtComplianceModule,
    EsicComplianceModule,
    TdsComplianceModule,
    LabourComplianceModule,
    ReturnsComplianceModule,
    ReportsComplianceModule,
  ],
  controllers: [ComplianceTypesController, ComplianceTasksController, ComplianceSetupController],
  providers: [ComplianceTypesService, ComplianceTasksService, ComplianceSetupService],
  exports: [
    ComplianceTypesService,
    ComplianceTasksService,
    ComplianceSetupService,
    PfComplianceModule,
    PtComplianceModule,
    EsicComplianceModule,
    TdsComplianceModule,
    LabourComplianceModule,
    ReturnsComplianceModule,
    ReportsComplianceModule,
  ],
})
export class ComplianceModule {}
