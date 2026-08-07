import { Injectable } from '@nestjs/common';

@Injectable()
export class TravelExpenseService {
  getStatus() {
    return {
      module: 'Travel & Expense',
      status: 'scaffolded',
      message:
        'This module is scaffolded per the EHCM roadmap and is planned for a later implementation phase. Endpoints, data model and workflow are not yet implemented.',
    };
  }
}
