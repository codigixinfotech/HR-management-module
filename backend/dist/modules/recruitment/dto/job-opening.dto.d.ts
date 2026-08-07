export declare class CreateJobOpeningDto {
    companyId: string;
    departmentId?: string;
    designationId?: string;
    title: string;
    description?: string;
    numPositions?: number;
    isActive?: boolean;
}
declare const UpdateJobOpeningDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateJobOpeningDto>>;
export declare class UpdateJobOpeningDto extends UpdateJobOpeningDto_base {
}
export {};
