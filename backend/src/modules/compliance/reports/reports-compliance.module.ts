import { Module } from '@nestjs/common';
import { ReportsComplianceController } from './reports-compliance.controller';
import { ReportsComplianceService } from './reports-compliance.service';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { PfComplianceModule } from '../pf/pf-compliance.module';
import { EsicComplianceModule } from '../esic/esic-compliance.module';
import { PtComplianceModule } from '../pt/pt-compliance.module';
import { TdsComplianceModule } from '../tds/tds-compliance.module';
import { LabourComplianceModule } from '../labour/labour-compliance.module';
import { ReturnsComplianceModule } from '../returns/returns-compliance.module';

@Module({
  imports: [
    PrismaModule,
    PfComplianceModule,
    EsicComplianceModule,
    PtComplianceModule,
    TdsComplianceModule,
    LabourComplianceModule,
    ReturnsComplianceModule,
  ],
  controllers: [ReportsComplianceController],
  providers: [ReportsComplianceService],
  exports: [ReportsComplianceService],
})
export class ReportsComplianceModule {}
