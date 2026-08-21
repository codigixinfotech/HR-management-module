import { AttendanceService } from './attendance.service';
import { MarkAttendanceDto, UpdateAttendanceDto } from './dto/attendance.dto';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    list(employeeId?: string, companyId?: string, from?: string, to?: string, user?: CurrentUserPayload): Promise<never[]> | import(".prisma/client").Prisma.PrismaPromise<({
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
            faceTemplate: string | null;
            facePhoto: string | null;
            department: {
                id: string;
                name: string;
            } | null;
        };
        shiftType: {
            id: string;
            name: string;
        } | null;
    } & {
        companyId: string;
        id: string;
        employeeId: string;
        date: Date;
        shiftTypeId: string | null;
        checkIn: Date | null;
        checkOut: Date | null;
        workedMinutes: number | null;
        status: import(".prisma/client").$Enums.AttendanceStatus;
        source: string;
        remarks: string | null;
        faceVerificationStatus: string | null;
        faceMatchScore: number | null;
        ipAddress: string | null;
        ipVerificationStatus: string | null;
        latitude: number | null;
        longitude: number | null;
        locationVerificationStatus: string | null;
        deviceType: string | null;
        capturedFacePhoto: string | null;
        officeLocation: string | null;
        distanceMeters: number | null;
        allowedRadiusMeters: number | null;
        verificationMethod: string | null;
        failureReason: string | null;
        punchType: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findOne(id: string, user?: CurrentUserPayload): Promise<{
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
            faceTemplate: string | null;
            facePhoto: string | null;
            department: {
                id: string;
                name: string;
            } | null;
        };
        shiftType: {
            id: string;
            name: string;
        } | null;
    } & {
        companyId: string;
        id: string;
        employeeId: string;
        date: Date;
        shiftTypeId: string | null;
        checkIn: Date | null;
        checkOut: Date | null;
        workedMinutes: number | null;
        status: import(".prisma/client").$Enums.AttendanceStatus;
        source: string;
        remarks: string | null;
        faceVerificationStatus: string | null;
        faceMatchScore: number | null;
        ipAddress: string | null;
        ipVerificationStatus: string | null;
        latitude: number | null;
        longitude: number | null;
        locationVerificationStatus: string | null;
        deviceType: string | null;
        capturedFacePhoto: string | null;
        officeLocation: string | null;
        distanceMeters: number | null;
        allowedRadiusMeters: number | null;
        verificationMethod: string | null;
        failureReason: string | null;
        punchType: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    mark(dto: MarkAttendanceDto): import(".prisma/client").Prisma.Prisma__AttendanceRecordClient<{
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
            faceTemplate: string | null;
            facePhoto: string | null;
            department: {
                id: string;
                name: string;
            } | null;
        };
        shiftType: {
            id: string;
            name: string;
        } | null;
    } & {
        companyId: string;
        id: string;
        employeeId: string;
        date: Date;
        shiftTypeId: string | null;
        checkIn: Date | null;
        checkOut: Date | null;
        workedMinutes: number | null;
        status: import(".prisma/client").$Enums.AttendanceStatus;
        source: string;
        remarks: string | null;
        faceVerificationStatus: string | null;
        faceMatchScore: number | null;
        ipAddress: string | null;
        ipVerificationStatus: string | null;
        latitude: number | null;
        longitude: number | null;
        locationVerificationStatus: string | null;
        deviceType: string | null;
        capturedFacePhoto: string | null;
        officeLocation: string | null;
        distanceMeters: number | null;
        allowedRadiusMeters: number | null;
        verificationMethod: string | null;
        failureReason: string | null;
        punchType: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, dto: UpdateAttendanceDto): Promise<{
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
            faceTemplate: string | null;
            facePhoto: string | null;
            department: {
                id: string;
                name: string;
            } | null;
        };
        shiftType: {
            id: string;
            name: string;
        } | null;
    } & {
        companyId: string;
        id: string;
        employeeId: string;
        date: Date;
        shiftTypeId: string | null;
        checkIn: Date | null;
        checkOut: Date | null;
        workedMinutes: number | null;
        status: import(".prisma/client").$Enums.AttendanceStatus;
        source: string;
        remarks: string | null;
        faceVerificationStatus: string | null;
        faceMatchScore: number | null;
        ipAddress: string | null;
        ipVerificationStatus: string | null;
        latitude: number | null;
        longitude: number | null;
        locationVerificationStatus: string | null;
        deviceType: string | null;
        capturedFacePhoto: string | null;
        officeLocation: string | null;
        distanceMeters: number | null;
        allowedRadiusMeters: number | null;
        verificationMethod: string | null;
        failureReason: string | null;
        punchType: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
