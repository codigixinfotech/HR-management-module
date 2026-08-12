import { Module } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { OnboardingService } from './onboarding.service';
import { TransfersController } from './transfers.controller';
import { TransfersService } from './transfers.service';

@Module({
  controllers: [EmployeesController, TransfersController],
  providers: [EmployeesService, OnboardingService, TransfersService],
  exports: [EmployeesService, TransfersService],
})
export class EmployeesModule {}
