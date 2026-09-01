import { Module } from '@nestjs/common';
import { SalaryComponentsController } from './salary-components.controller';
import { SalaryComponentsService } from './salary-components.service';
import { SalaryStructureController } from './salary-structure.controller';
import { SalaryStructureService } from './salary-structure.service';
import { SalaryTemplatesController } from './salary-templates.controller';
import { SalaryTemplatesService } from './salary-templates.service';
import { SalaryAssignmentsController } from './salary-assignments.controller';
import { SalaryAssignmentsService } from './salary-assignments.service';
import { PayrollRunsController } from './payroll-runs.controller';
import { PayrollRunsService } from './payroll-runs.service';
import { PayslipsController } from './payslips.controller';
import { PayslipsService } from './payslips.service';

@Module({
  controllers: [
    SalaryComponentsController,
    SalaryStructureController,
    SalaryTemplatesController,
    SalaryAssignmentsController,
    PayrollRunsController,
    PayslipsController,
  ],
  providers: [
    SalaryComponentsService,
    SalaryStructureService,
    SalaryTemplatesService,
    SalaryAssignmentsService,
    PayrollRunsService,
    PayslipsService,
  ],
  exports: [
    SalaryComponentsService,
    SalaryStructureService,
    SalaryTemplatesService,
    SalaryAssignmentsService,
    PayrollRunsService,
    PayslipsService,
  ],
})
export class PayrollModule {}
