export declare class CreateHolidayDto {
    companyId: string;
    name: string;
    date: string;
    type?: string;
    isActive?: boolean;
}
declare const UpdateHolidayDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateHolidayDto>>;
export declare class UpdateHolidayDto extends UpdateHolidayDto_base {
}
export {};
