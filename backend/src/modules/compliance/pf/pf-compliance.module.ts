import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { PfCalculationEngineService } from './services/pf-calculation-engine.service';
import { EcrV2GeneratorService } from './services/ecr-v2-generator.service';
import { PfComplianceService } from './services/pf-compliance.service';
import { PfComplianceController } from './pf-compliance.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PfComplianceController],
  providers: [
    PfCalculationEngineService,
    EcrV2GeneratorService,
    PfComplianceService,
  ],
  exports: [
    PfCalculationEngineService,
    EcrV2GeneratorService,
    PfComplianceService,
  ],
})
export class PfComplianceModule {}
