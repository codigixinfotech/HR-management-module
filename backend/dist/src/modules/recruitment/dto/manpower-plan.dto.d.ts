export declare class CreateManpowerPlanDto {
    companyId?: string;
    branchId?: string;
    departmentId?: string;
    designationId?: string;
    departmentName: string;
    costCenter: string;
    role: string;
    budgeted: number;
    quarter: string;
    reason: string;
    code?: string;
}
declare const UpdateManpowerPlanDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateManpowerPlanDto>>;
export declare class UpdateManpowerPlanDto extends UpdateManpowerPlanDto_base {
}
export {};
