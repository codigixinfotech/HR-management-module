export declare class CreateDesignationDto {
    companyId: string;
    departmentId?: string;
    code: string;
    title: string;
    grade?: string;
    isActive?: boolean;
}
declare const UpdateDesignationDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateDesignationDto>>;
export declare class UpdateDesignationDto extends UpdateDesignationDto_base {
}
export {};
