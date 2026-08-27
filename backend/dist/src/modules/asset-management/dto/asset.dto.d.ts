export declare class CreateAssetDto {
    companyId: string;
    assetTag?: string;
    name: string;
    category: string;
    assetType?: string;
    branchId?: string;
    departmentId?: string;
    physicalLocation?: string;
    vendor?: string;
    invoiceNumber?: string;
    poNumber?: string;
    serialNumber?: string;
    manufacturer?: string;
    modelNumber?: string;
    value?: number;
    purchaseDate?: string;
    warrantyStart?: string;
    warrantyExpiry?: string;
    status?: string;
    condition?: string;
    usefulLife?: string;
    notes?: string;
    remarks?: string;
    photoUrl?: string;
}
declare const UpdateAssetDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateAssetDto>>;
export declare class UpdateAssetDto extends UpdateAssetDto_base {
}
export declare class AllocateAssetDto {
    employeeId: string;
    allocationDate?: string;
    allocationType?: string;
    location?: string;
    expectedReturnDate?: string;
    remarks?: string;
}
export declare class ReturnAssetDto {
    returnDate?: string;
    returnReason: string;
    otherReason?: string;
    returnedBy?: string;
    returnLocation?: string;
    condition: string;
    accessoriesReturned?: string;
    remarks?: string;
}
export {};
