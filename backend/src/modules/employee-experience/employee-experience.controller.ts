import { Controller, Get } from '@nestjs/common';
import { EmployeeExperienceService } from './employee-experience.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('employee-experience')
export class EmployeeExperienceController {
  constructor(
    private readonly employeeExperienceService: EmployeeExperienceService,
  ) {}

  @Get('status')
  @Permissions('employee_experience.read')
  getStatus() {
    return this.employeeExperienceService.getStatus();
  }
}
