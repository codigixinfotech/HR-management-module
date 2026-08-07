import { Module } from '@nestjs/common';
import { TravelExpenseController } from './travel-expense.controller';
import { TravelExpenseService } from './travel-expense.service';

@Module({
  controllers: [TravelExpenseController],
  providers: [TravelExpenseService],
})
export class TravelExpenseModule {}
