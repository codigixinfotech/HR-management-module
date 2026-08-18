import { PrismaService } from '../../common/prisma/prisma.service';
import { MarkAttendanceDto, UpdateAttendanceDto } from './dto/attendance.dto';
export declare class AttendanceService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private readonly listInclude;
    list(employeeId?: string, companyId?: string, from?: string, to?: string): import(".prisma/client").Prisma.PrismaPromise<({
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
        };
        shiftType: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.AttendanceStatus;
        date: Date;
        employeeId: string;
        remarks: string | null;
        source: string;
        shiftTypeId: string | null;
        checkIn: Date | null;
        checkOut: Date | null;
        workedMinutes: number | null;
    })[]>;
    findById(id: string): Promise<{
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
        };
        shiftType: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.AttendanceStatus;
        date: Date;
        employeeId: string;
        remarks: string | null;
        source: string;
        shiftTypeId: string | null;
        checkIn: Date | null;
        checkOut: Date | null;
        workedMinutes: number | null;
    }>;
    mark(dto: MarkAttendanceDto): import(".prisma/client").Prisma.Prisma__AttendanceRecordClient<{
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
        };
        shiftType: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.AttendanceStatus;
        date: Date;
        employeeId: string;
        remarks: string | null;
        source: string;
        shiftTypeId: string | null;
        checkIn: Date | null;
        checkOut: Date | null;
        workedMinutes: number | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, dto: UpdateAttendanceDto): Promise<{
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
        };
        shiftType: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.AttendanceStatus;
        date: Date;
        employeeId: string;
        remarks: string | null;
        source: string;
        shiftTypeId: string | null;
        checkIn: Date | null;
        checkOut: Date | null;
        workedMinutes: number | null;
    }>;
}
