import { ShiftAssignmentsService } from './shift-assignments.service';
import { CreateShiftAssignmentDto, UpdateShiftAssignmentDto } from './dto/shift-assignment.dto';
export declare class ShiftAssignmentsController {
    private readonly shiftAssignmentsService;
    constructor(shiftAssignmentsService: ShiftAssignmentsService);
    list(employeeId?: string, shiftTypeId?: string): import("@prisma/client").Prisma.PrismaPromise<({
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
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        shiftTypeId: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
    })[]>;
    findOne(id: string): Promise<{
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
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        shiftTypeId: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
    }>;
    create(dto: CreateShiftAssignmentDto): import("@prisma/client").Prisma.Prisma__ShiftAssignmentClient<{
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
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        shiftTypeId: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
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
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        shiftTypeId: string;
        effectiveFrom: Date;
        effectiveTo: Date | null;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
