import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateShiftAssignmentDto, UpdateShiftAssignmentDto } from './dto/shift-assignment.dto';
export declare class ShiftAssignmentsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private readonly listInclude;
    list(employeeId?: string, shiftTypeId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
        };
        shiftType: {
            id: string;
            name: string;
            startTime: string;
            endTime: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        effectiveFrom: Date;
        employeeId: string;
        shiftTypeId: string;
        effectiveTo: Date | null;
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
            startTime: string;
            endTime: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        effectiveFrom: Date;
        employeeId: string;
        shiftTypeId: string;
        effectiveTo: Date | null;
    }>;
    create(dto: CreateShiftAssignmentDto): import(".prisma/client").Prisma.Prisma__ShiftAssignmentClient<{
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
        };
        shiftType: {
            id: string;
            name: string;
            startTime: string;
            endTime: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        effectiveFrom: Date;
        employeeId: string;
        shiftTypeId: string;
        effectiveTo: Date | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, dto: UpdateShiftAssignmentDto): Promise<{
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
        };
        shiftType: {
            id: string;
            name: string;
            startTime: string;
            endTime: string;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        effectiveFrom: Date;
        employeeId: string;
        shiftTypeId: string;
        effectiveTo: Date | null;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
