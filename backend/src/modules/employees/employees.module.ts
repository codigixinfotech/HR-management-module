import { Module } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { OnboardingService } from './onboarding.service';
import { TransfersController } from './transfers.controller';
import { TransfersService } from './transfers.service';
import { ExitsController } from './exits.controller';
import { ExitsService } from './exits.service';
import { ExitClearanceMasterService } from './exit-clearance-master.service';

@Module({
  controllers: [ExitsController, TransfersController, EmployeesController],
  providers: [EmployeesService, OnboardingService, TransfersService, ExitsService, ExitClearanceMasterService],
  exports: [EmployeesService, TransfersService, ExitsService, ExitClearanceMasterService],
})
export class EmployeesModule {}
