import { AiIntelligenceService } from './ai-intelligence.service';
export declare class AiIntelligenceController {
    private readonly aiIntelligenceService;
    constructor(aiIntelligenceService: AiIntelligenceService);
    getStatus(): {
        module: string;
        status: string;
        message: string;
    };
}
