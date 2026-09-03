import { Module } from '@nestjs/common';
import { EsicComplianceController } from './esic-compliance.controller';
import { EsicComplianceService } from './esic-compliance.service';
import { PrismaModule } from '../../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EsicComplianceController],
  providers: [EsicComplianceService],
  exports: [EsicComplianceService],
})
export class EsicComplianceModule {}
