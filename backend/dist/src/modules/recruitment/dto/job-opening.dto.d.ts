export declare class CreateJobOpeningDto {
    companyId: string;
    departmentId?: string;
    designationId?: string;
    manpowerRequisitionId?: string;
    requisitionCode?: string;
    manpowerPlanCode?: string;
    mrNumber?: string;
    title: string;
    description?: string;
    responsibilities?: string;
    numPositions?: number;
    costCenter?: string;
    employmentType?: string;
    priority?: string;
    candidateType?: string;
    minExperience?: number;
    maxExperience?: number;
    graduationYear?: string;
    minSalary?: number;
    maxSalary?: number;
    qualification?: string;
    experience?: string;
    requiredSkills?: string;
    workLocation?: string;
    reportingManagerId?: string;
    applicationDeadline?: string;
    status?: string;
    isActive?: boolean;
}
declare const UpdateJobOpeningDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateJobOpeningDto>>;
export declare class UpdateJobOpeningDto extends UpdateJobOpeningDto_base {
}
export {};
