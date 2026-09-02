import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { PtComplianceService } from './pt-compliance.service';
import { PtComplianceController } from './pt-compliance.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PtComplianceController],
  providers: [PtComplianceService],
  exports: [PtComplianceService],
})
export class PtComplianceModule {}
