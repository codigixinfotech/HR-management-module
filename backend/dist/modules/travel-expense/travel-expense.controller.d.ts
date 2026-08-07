import { TravelExpenseService } from './travel-expense.service';
export declare class TravelExpenseController {
    private readonly travelExpenseService;
    constructor(travelExpenseService: TravelExpenseService);
    getStatus(): {
        module: string;
        status: string;
        message: string;
    };
}
