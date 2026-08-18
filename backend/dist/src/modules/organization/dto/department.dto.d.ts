export declare class CreateDepartmentDto {
    companyId: string;
    branchId?: string;
    code: string;
    name: string;
    type?: string;
    parentDepartmentId?: string;
    manager?: string;
    costCenter?: string;
    headcountCapacity?: number;
    annualBudget?: number;
    effectiveFrom?: string;
    description?: string;
    isActive?: boolean;
}
declare const UpdateDepartmentDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateDepartmentDto>>;
export declare class UpdateDepartmentDto extends UpdateDepartmentDto_base {
}
export {};
