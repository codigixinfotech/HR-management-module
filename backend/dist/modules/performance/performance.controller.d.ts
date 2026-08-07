import { PerformanceService } from './performance.service';
export declare class PerformanceController {
    private readonly performanceService;
    constructor(performanceService: PerformanceService);
    getStatus(): {
        module: string;
        status: string;
        message: string;
    };
}
