import { LearningService } from './learning.service';
export declare class LearningController {
    private readonly learningService;
    constructor(learningService: LearningService);
    getStatus(): {
        module: string;
        status: string;
        message: string;
    };
}
