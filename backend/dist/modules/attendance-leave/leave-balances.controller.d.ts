import { LeaveBalancesService } from './leave-balances.service';
import { AllocateLeaveBalanceDto } from './dto/leave-balance.dto';
export declare class LeaveBalancesController {
    private readonly leaveBalancesService;
    constructor(leaveBalancesService: LeaveBalancesService);
    list(employeeId?: string, year?: string): import(".prisma/client").Prisma.PrismaPromise<({
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
    allocate(dto: AllocateLeaveBalanceDto): import(".prisma/client").Prisma.Prisma__LeaveBalanceClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        year: number;
        employeeId: string;
        leaveTypeId: string;
        allocated: number;
        used: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
}
