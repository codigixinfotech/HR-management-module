import { ShiftAssignmentsService } from './shift-assignments.service';
import { CreateShiftAssignmentDto, UpdateShiftAssignmentDto } from './dto/shift-assignment.dto';
export declare class ShiftAssignmentsController {
    private readonly shiftAssignmentsService;
    constructor(shiftAssignmentsService: ShiftAssignmentsService);
    list(employeeId?: string, shiftTypeId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        employee: {
            id: string;
            firstName: string;
            lastName: string;
            employeeCode: string;
        };
        shiftType: {
            id: string;
            name: string;
            startTime: string;
            endTime: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        effectiveFrom: Date;
        isActive: boolean;
        employeeId: string;
        shiftTypeId: string;
        effectiveTo: Date | null;
    })[]>;
    findOne(id: string): Promise<{
        employee: {
            id: string;
            firstName: string;
            lastName: string;
            employeeCode: string;
        };
        shiftType: {
            id: string;
            name: string;
            startTime: string;
            endTime: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        effectiveFrom: Date;
        isActive: boolean;
        employeeId: string;
        shiftTypeId: string;
        effectiveTo: Date | null;
    }>;
    create(dto: CreateShiftAssignmentDto): import(".prisma/client").Prisma.Prisma__ShiftAssignmentClient<{
        employee: {
            id: string;
            firstName: string;
            lastName: string;
            employeeCode: string;
        };
        shiftType: {
            id: string;
            name: string;
            startTime: string;
            endTime: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        effectiveFrom: Date;
        isActive: boolean;
        employeeId: string;
        shiftTypeId: string;
        effectiveTo: Date | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, dto: UpdateShiftAssignmentDto): Promise<{
        employee: {
            id: string;
            firstName: string;
            lastName: string;
            employeeCode: string;
        };
        shiftType: {
            id: string;
            name: string;
            startTime: string;
            endTime: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        effectiveFrom: Date;
        isActive: boolean;
        employeeId: string;
        shiftTypeId: string;
        effectiveTo: Date | null;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
