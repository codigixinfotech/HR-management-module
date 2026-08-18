export declare class CreateDesignationDto {
    companyId: string;
    departmentId?: string;
    code: string;
    title: string;
    grade?: string;
    jobFamily?: string;
    reportingDesignationId?: string;
    employmentType?: string;
    minSalary?: number;
    maxSalary?: number;
    effectiveFrom?: string;
    description?: string;
    isActive?: boolean;
}
declare const UpdateDesignationDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateDesignationDto>>;
export declare class UpdateDesignationDto extends UpdateDesignationDto_base {
}
export {};
