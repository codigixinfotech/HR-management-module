import { PrismaService } from '../../common/prisma/prisma.service';
import { AllocateLeaveBalanceDto } from './dto/leave-balance.dto';
export declare class LeaveBalancesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(employeeId?: string, year?: number): import("@prisma/client").Prisma.PrismaPromise<({
        leaveType: {
            id: string;
            name: string;
            code: string;
            isPaid: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        year: number;
        employeeId: string;
        leaveTypeId: string;
        allocated: number;
        used: number;
    })[]>;
    allocate(dto: AllocateLeaveBalanceDto): import("@prisma/client").Prisma.Prisma__LeaveBalanceClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        year: number;
        employeeId: string;
        leaveTypeId: string;
        allocated: number;
        used: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    adjustUsed(employeeId: string, leaveTypeId: string, year: number, deltaDays: number): Promise<void>;
}
