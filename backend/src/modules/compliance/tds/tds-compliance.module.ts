import { Module } from '@nestjs/common';
import { TdsComplianceController } from './tds-compliance.controller';
import { TdsComplianceService } from './tds-compliance.service';
import { PrismaModule } from '../../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TdsComplianceController],
  providers: [TdsComplianceService],
  exports: [TdsComplianceService],
})
export class TdsComplianceModule {}
