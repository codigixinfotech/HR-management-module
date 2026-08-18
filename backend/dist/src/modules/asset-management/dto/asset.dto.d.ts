export declare class CreateAssetDto {
    companyId: string;
    assetTag: string;
    name: string;
    category: string;
    value?: number;
    purchaseDate?: string;
    warrantyExpiry?: string;
    notes?: string;
}
declare const UpdateAssetDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateAssetDto>>;
export declare class UpdateAssetDto extends UpdateAssetDto_base {
}
export declare class AllocateAssetDto {
    employeeId: string;
    remarks?: string;
}
export {};
