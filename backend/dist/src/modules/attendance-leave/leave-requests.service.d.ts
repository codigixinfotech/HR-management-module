import { ApprovalStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CreateLeaveRequestDto, UpdateLeaveStatusDto } from './dto/leave-request.dto';
import { LeaveBalancesService } from './leave-balances.service';
export declare class LeaveRequestsService {
    private readonly prisma;
    private readonly leaveBalancesService;
    constructor(prisma: PrismaService, leaveBalancesService: LeaveBalancesService);
    private readonly listInclude;
    list(query: PaginationQueryDto, employeeId?: string, status?: ApprovalStatus): Promise<{
        items: ({
            employee: {
                id: string;
                employeeCode: string;
                firstName: string;
                lastName: string;
            };
            approver: {
                id: string;
                firstName: string;
                lastName: string;
            } | null;
            leaveType: {
                id: string;
                name: string;
                code: string;
                isPaid: boolean;
            };
        } & {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            employeeId: string;
            status: import(".prisma/client").$Enums.ApprovalStatus;
            startDate: Date;
            endDate: Date;
            leaveTypeId: string;
            totalDays: number;
            reason: string | null;
            approverId: string | null;
            approverRemarks: string | null;
            decidedAt: Date | null;
        })[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findById(id: string): Promise<{
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
        };
        approver: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        leaveType: {
            id: string;
            name: string;
            code: string;
            isPaid: boolean;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        startDate: Date;
        endDate: Date;
        leaveTypeId: string;
        totalDays: number;
        reason: string | null;
        approverId: string | null;
        approverRemarks: string | null;
        decidedAt: Date | null;
    }>;
    create(dto: CreateLeaveRequestDto): import(".prisma/client").Prisma.Prisma__LeaveRequestClient<{
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
        };
        approver: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        leaveType: {
            id: string;
            name: string;
            code: string;
            isPaid: boolean;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        startDate: Date;
        endDate: Date;
        leaveTypeId: string;
        totalDays: number;
        reason: string | null;
        approverId: string | null;
        approverRemarks: string | null;
        decidedAt: Date | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    updateStatus(id: string, dto: UpdateLeaveStatusDto): Promise<{
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
        };
        approver: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
        leaveType: {
            id: string;
            name: string;
            code: string;
            isPaid: boolean;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        startDate: Date;
        endDate: Date;
        leaveTypeId: string;
        totalDays: number;
        reason: string | null;
        approverId: string | null;
        approverRemarks: string | null;
        decidedAt: Date | null;
    }>;
}
