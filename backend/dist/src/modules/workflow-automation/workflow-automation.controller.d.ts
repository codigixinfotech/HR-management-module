import { WorkflowAutomationService } from './workflow-automation.service';
export declare class WorkflowAutomationController {
    private readonly workflowAutomationService;
    constructor(workflowAutomationService: WorkflowAutomationService);
    getStatus(): {
        module: string;
        status: string;
        message: string;
    };
}
