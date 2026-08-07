import { Module } from '@nestjs/common';
import { SalaryComponentsController } from './salary-components.controller';
import { SalaryComponentsService } from './salary-components.service';
import { SalaryStructureController } from './salary-structure.controller';
import { SalaryStructureService } from './salary-structure.service';
import { PayrollRunsController } from './payroll-runs.controller';
import { PayrollRunsService } from './payroll-runs.service';
import { PayslipsController } from './payslips.controller';
import { PayslipsService } from './payslips.service';

@Module({
  controllers: [
    SalaryComponentsController,
    SalaryStructureController,
    PayrollRunsController,
    PayslipsController,
  ],
  providers: [
    SalaryComponentsService,
    SalaryStructureService,
    PayrollRunsService,
    PayslipsService,
  ],
  exports: [
    SalaryComponentsService,
    SalaryStructureService,
    PayrollRunsService,
    PayslipsService,
  ],
})
export class PayrollModule {}
