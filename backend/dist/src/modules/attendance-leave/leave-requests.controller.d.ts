import { LeaveRequestsService } from './leave-requests.service';
import { CreateLeaveRequestDto, ListLeaveRequestsQueryDto, UpdateLeaveStatusDto } from './dto/leave-request.dto';
export declare class LeaveRequestsController {
    private readonly leaveRequestsService;
    constructor(leaveRequestsService: LeaveRequestsService);
    list(query: ListLeaveRequestsQueryDto): Promise<{
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
    findOne(id: string): Promise<{
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
