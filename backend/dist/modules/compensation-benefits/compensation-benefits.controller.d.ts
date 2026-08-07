import { CompensationBenefitsService } from './compensation-benefits.service';
export declare class CompensationBenefitsController {
    private readonly compensationBenefitsService;
    constructor(compensationBenefitsService: CompensationBenefitsService);
    getStatus(): {
        module: string;
        status: string;
        message: string;
    };
}
