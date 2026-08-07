export declare class CreateLeaveTypeDto {
    companyId: string;
    code: string;
    name: string;
    isPaid?: boolean;
    annualQuota?: number;
    carryForward?: boolean;
    isActive?: boolean;
}
declare const UpdateLeaveTypeDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateLeaveTypeDto>>;
export declare class UpdateLeaveTypeDto extends UpdateLeaveTypeDto_base {
}
export {};
