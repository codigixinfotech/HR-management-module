import { LeaveRequestsService } from './leave-requests.service';
import { CreateLeaveRequestDto, ListLeaveRequestsQueryDto, UpdateLeaveStatusDto } from './dto/leave-request.dto';
export declare class LeaveRequestsController {
    private readonly leaveRequestsService;
    constructor(leaveRequestsService: LeaveRequestsService);
    list(query: ListLeaveRequestsQueryDto): Promise<{
        items: ({
            employee: {
                id: string;
                firstName: string;
                lastName: string;
                employeeCode: string;
            };
            leaveType: {
                id: string;
                code: string;
                name: string;
                isPaid: boolean;
            };
            approver: {
                id: string;
                firstName: string;
                lastName: string;
            } | null;
        } & {
            companyId: string;
            status: import(".prisma/client").$Enums.ApprovalStatus;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            startDate: Date;
            employeeId: string;
            reason: string | null;
            leaveTypeId: string;
            endDate: Date;
            totalDays: number;
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
            firstName: string;
            lastName: string;
            employeeCode: string;
        };
        leaveType: {
            id: string;
            code: string;
            name: string;
            isPaid: boolean;
        };
        approver: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        companyId: string;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        startDate: Date;
        employeeId: string;
        reason: string | null;
        leaveTypeId: string;
        endDate: Date;
        totalDays: number;
        approverId: string | null;
        approverRemarks: string | null;
        decidedAt: Date | null;
    }>;
    create(dto: CreateLeaveRequestDto): import(".prisma/client").Prisma.Prisma__LeaveRequestClient<{
        employee: {
            id: string;
            firstName: string;
            lastName: string;
            employeeCode: string;
        };
        leaveType: {
            id: string;
            code: string;
            name: string;
            isPaid: boolean;
        };
        approver: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        companyId: string;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        startDate: Date;
        employeeId: string;
        reason: string | null;
        leaveTypeId: string;
        endDate: Date;
        totalDays: number;
        approverId: string | null;
        approverRemarks: string | null;
        decidedAt: Date | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    updateStatus(id: string, dto: UpdateLeaveStatusDto): Promise<{
        employee: {
            id: string;
            firstName: string;
            lastName: string;
            employeeCode: string;
        };
        leaveType: {
            id: string;
            code: string;
            name: string;
            isPaid: boolean;
        };
        approver: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        companyId: string;
        status: import(".prisma/client").$Enums.ApprovalStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        startDate: Date;
        employeeId: string;
        reason: string | null;
        leaveTypeId: string;
        endDate: Date;
        totalDays: number;
        approverId: string | null;
        approverRemarks: string | null;
        decidedAt: Date | null;
    }>;
}
