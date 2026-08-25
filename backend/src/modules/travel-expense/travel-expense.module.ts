import { Module } from '@nestjs/common';
import { TravelExpenseController } from './travel-expense.controller';
import { TravelExpenseService } from './travel-expense.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TravelExpenseController],
  providers: [TravelExpenseService],
  exports: [TravelExpenseService],
})
export class TravelExpenseModule {}
