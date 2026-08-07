import { Controller, Get } from '@nestjs/common';
import { CompensationBenefitsService } from './compensation-benefits.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('compensation-benefits')
export class CompensationBenefitsController {
  constructor(
    private readonly compensationBenefitsService: CompensationBenefitsService,
  ) {}

  @Get('status')
  @Permissions('compensation_benefits.read')
  getStatus() {
    return this.compensationBenefitsService.getStatus();
  }
}
