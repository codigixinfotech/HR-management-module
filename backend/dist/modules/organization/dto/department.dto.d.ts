export declare class CreateDepartmentDto {
    companyId: string;
    branchId?: string;
    code: string;
    name: string;
    parentDepartmentId?: string;
    isActive?: boolean;
}
declare const UpdateDepartmentDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateDepartmentDto>>;
export declare class UpdateDepartmentDto extends UpdateDepartmentDto_base {
}
export {};
