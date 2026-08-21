import { AttendanceStatus } from '@prisma/client';
export declare class MarkAttendanceDto {
    companyId: string;
    employeeId: string;
    date: string;
    status?: AttendanceStatus;
    checkIn?: string;
    checkOut?: string;
    remarks?: string;
    faceVerificationStatus?: string;
    faceMatchScore?: number;
    ipAddress?: string;
    ipVerificationStatus?: string;
    latitude?: number;
    longitude?: number;
    locationVerificationStatus?: string;
    deviceType?: string;
    capturedFacePhoto?: string;
    officeLocation?: string;
    distanceMeters?: number;
    allowedRadiusMeters?: number;
    verificationMethod?: string;
    failureReason?: string;
    punchType?: string;
}
declare const UpdateAttendanceDto_base: import("@nestjs/mapped-types").MappedType<Partial<MarkAttendanceDto>>;
export declare class UpdateAttendanceDto extends UpdateAttendanceDto_base {
}
export {};
