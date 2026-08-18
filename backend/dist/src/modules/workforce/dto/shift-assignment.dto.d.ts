export declare class CreateShiftAssignmentDto {
    companyId: string;
    employeeId: string;
    shiftTypeId: string;
    effectiveFrom: string;
    effectiveTo?: string;
    isActive?: boolean;
}
declare const UpdateShiftAssignmentDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateShiftAssignmentDto>>;
export declare class UpdateShiftAssignmentDto extends UpdateShiftAssignmentDto_base {
}
export {};
