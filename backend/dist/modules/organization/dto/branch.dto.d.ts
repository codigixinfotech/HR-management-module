export declare class CreateBranchDto {
    companyId: string;
    code: string;
    name: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    isActive?: boolean;
}
declare const UpdateBranchDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateBranchDto>>;
export declare class UpdateBranchDto extends UpdateBranchDto_base {
}
export {};
