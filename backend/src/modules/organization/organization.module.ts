import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { DesignationsController } from './designations.controller';
import { DesignationsService } from './designations.service';
import { CostCentersController } from './cost-centers.controller';
import { CostCentersService } from './cost-centers.service';
import { PayGradesController } from './pay-grades.controller';
import { PayGradesService } from './pay-grades.service';

@Module({
  controllers: [
    CompaniesController,
    BranchesController,
    DepartmentsController,
    DesignationsController,
    CostCentersController,
    PayGradesController,
  ],
  providers: [
    CompaniesService,
    BranchesService,
    DepartmentsService,
    DesignationsService,
    CostCentersService,
    PayGradesService,
  ],
  exports: [
    CompaniesService,
    BranchesService,
    DepartmentsService,
    DesignationsService,
    CostCentersService,
    PayGradesService,
  ],
})
export class OrganizationModule {}
