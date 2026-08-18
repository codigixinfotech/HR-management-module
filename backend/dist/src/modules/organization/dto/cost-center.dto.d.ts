export declare class CreateCostCenterDto {
    companyId: string;
    code: string;
    name: string;
    type?: string;
    branchId?: string;
    departmentId?: string;
    managerId?: string;
    managerName?: string;
    budget?: number;
    headcountCapacity?: number;
    effectiveFrom?: string;
    description?: string;
    isActive?: boolean;
}
export declare class UpdateCostCenterDto {
    name?: string;
    type?: string;
    branchId?: string;
    departmentId?: string;
    managerId?: string;
    managerName?: string;
    budget?: number;
    headcountCapacity?: number;
    effectiveFrom?: string;
    description?: string;
    isActive?: boolean;
}
