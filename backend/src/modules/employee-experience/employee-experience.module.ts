import { Module } from '@nestjs/common';
import { EmployeeExperienceController } from './employee-experience.controller';
import { EmployeeExperienceService } from './employee-experience.service';

@Module({
  controllers: [EmployeeExperienceController],
  providers: [EmployeeExperienceService],
})
export class EmployeeExperienceModule {}
