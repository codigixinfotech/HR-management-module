import { Module } from '@nestjs/common';
import { LabourComplianceController } from './labour-compliance.controller';
import { LabourComplianceService } from './labour-compliance.service';
import { PrismaModule } from '../../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LabourComplianceController],
  providers: [LabourComplianceService],
  exports: [LabourComplianceService],
})
export class LabourComplianceModule {}
