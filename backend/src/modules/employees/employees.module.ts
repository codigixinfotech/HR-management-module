import { Module } from '@nestjs/common';
import { EmployeesController } from './employees.controller';
import { EmployeesService } from './employees.service';
import { OnboardingService } from './onboarding.service';

@Module({
  controllers: [EmployeesController],
  providers: [EmployeesService, OnboardingService],
  exports: [EmployeesService],
})
export class EmployeesModule {}
