import { Module } from '@nestjs/common';
import { ReturnsComplianceController } from './returns-compliance.controller';
import { ReturnsComplianceService } from './returns-compliance.service';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { PfComplianceModule } from '../pf/pf-compliance.module';
import { EsicComplianceModule } from '../esic/esic-compliance.module';
import { PtComplianceModule } from '../pt/pt-compliance.module';
import { TdsComplianceModule } from '../tds/tds-compliance.module';

@Module({
  imports: [
    PrismaModule,
    PfComplianceModule,
    EsicComplianceModule,
    PtComplianceModule,
    TdsComplianceModule,
  ],
  controllers: [ReturnsComplianceController],
  providers: [ReturnsComplianceService],
  exports: [ReturnsComplianceService],
})
export class ReturnsComplianceModule {}
