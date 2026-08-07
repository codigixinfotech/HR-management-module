export declare class CreatePpeItemDto {
    companyId: string;
    name: string;
    category: string;
    stockQuantity?: number;
}
declare const UpdatePpeItemDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreatePpeItemDto>>;
export declare class UpdatePpeItemDto extends UpdatePpeItemDto_base {
}
export declare class IssuePpeDto {
    employeeId: string;
    quantity: number;
}
export {};
