export declare class CreateBranchDto {
    companyId: string;
    code: string;
    name: string;
    businessUnit?: string;
    branchType?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    manager?: string;
    phone?: string;
    email?: string;
    timezone?: string;
    workingCalendar?: string;
    shiftGroup?: string;
    maxCapacity?: number;
    isActive?: boolean;
}
declare const UpdateBranchDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateBranchDto>>;
export declare class UpdateBranchDto extends UpdateBranchDto_base {
}
export {};
