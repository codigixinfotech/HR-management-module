import { EmployeeExperienceService } from './employee-experience.service';
export declare class EmployeeExperienceController {
    private readonly employeeExperienceService;
    constructor(employeeExperienceService: EmployeeExperienceService);
    getStatus(): {
        module: string;
        status: string;
        message: string;
    };
}
