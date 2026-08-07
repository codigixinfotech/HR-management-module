import { Controller, Get } from '@nestjs/common';
import { TravelExpenseService } from './travel-expense.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('travel-expense')
export class TravelExpenseController {
  constructor(private readonly travelExpenseService: TravelExpenseService) {}

  @Get('status')
  @Permissions('travel_expense.read')
  getStatus() {
    return this.travelExpenseService.getStatus();
  }
}
