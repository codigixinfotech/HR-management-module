export declare class CreateShiftTypeDto {
    companyId: string;
    code: string;
    name: string;
    startTime: string;
    endTime: string;
    breakMinutes?: number;
    isNightShift?: boolean;
    isActive?: boolean;
}
declare const UpdateShiftTypeDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateShiftTypeDto>>;
export declare class UpdateShiftTypeDto extends UpdateShiftTypeDto_base {
}
export {};
