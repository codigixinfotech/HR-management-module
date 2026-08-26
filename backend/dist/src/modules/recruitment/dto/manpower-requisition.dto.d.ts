export declare class CreateManpowerRequisitionDto {
    mrNumber?: string;
    companyId?: string;
    branchId?: string;
    manpowerPlanId?: string;
    departmentId?: string;
    departmentName: string;
    costCenter: string;
    designationId?: string;
    role: string;
    numOpenings: number;
    joiningDate: string;
    employmentType: string;
    priority: string;
    minSalary?: number;
    maxSalary?: number;
    qualification: string;
    experience: string;
    requiredSkills?: string;
    workLocation: string;
    reportingManagerId?: string;
    requestorName?: string;
    reason: string;
    comments?: string;
    status?: string;
}
declare const UpdateManpowerRequisitionDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateManpowerRequisitionDto>>;
export declare class UpdateManpowerRequisitionDto extends UpdateManpowerRequisitionDto_base {
}
export declare class UpdateMrStatusDto {
    status: string;
    rejectionReason?: string;
}
export {};
