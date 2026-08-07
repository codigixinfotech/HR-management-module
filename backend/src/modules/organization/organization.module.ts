import { Module } from '@nestjs/common';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { BranchesController } from './branches.controller';
import { BranchesService } from './branches.service';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { DesignationsController } from './designations.controller';
import { DesignationsService } from './designations.service';

@Module({
  controllers: [
    CompaniesController,
    BranchesController,
    DepartmentsController,
    DesignationsController,
  ],
  providers: [
    CompaniesService,
    BranchesService,
    DepartmentsService,
    DesignationsService,
  ],
  exports: [
    CompaniesService,
    BranchesService,
    DepartmentsService,
    DesignationsService,
  ],
})
export class OrganizationModule {}
