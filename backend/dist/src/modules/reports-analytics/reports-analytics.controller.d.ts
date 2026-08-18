import { ReportsAnalyticsService } from './reports-analytics.service';
export declare class ReportsAnalyticsController {
    private readonly reportsAnalyticsService;
    constructor(reportsAnalyticsService: ReportsAnalyticsService);
    getStatus(): {
        module: string;
        status: string;
        message: string;
    };
}
