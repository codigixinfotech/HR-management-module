import { AttendanceStatus } from '@prisma/client';
export declare class MarkAttendanceDto {
    companyId: string;
    employeeId: string;
    date: string;
    status?: AttendanceStatus;
    checkIn?: string;
    checkOut?: string;
    remarks?: string;
}
declare const UpdateAttendanceDto_base: import("@nestjs/mapped-types").MappedType<Partial<MarkAttendanceDto>>;
export declare class UpdateAttendanceDto extends UpdateAttendanceDto_base {
}
export {};
