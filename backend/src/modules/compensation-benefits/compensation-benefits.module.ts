import { Module } from '@nestjs/common';
import { CompensationBenefitsController } from './compensation-benefits.controller';
import { CompensationBenefitsService } from './compensation-benefits.service';

@Module({
  controllers: [CompensationBenefitsController],
  providers: [CompensationBenefitsService],
})
export class CompensationBenefitsModule {}
