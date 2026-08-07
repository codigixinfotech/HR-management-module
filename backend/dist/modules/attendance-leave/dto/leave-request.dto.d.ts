import { ApprovalStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
export declare class ListLeaveRequestsQueryDto extends PaginationQueryDto {
    employeeId?: string;
    status?: ApprovalStatus;
}
export declare class CreateLeaveRequestDto {
    companyId: string;
    employeeId: string;
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason?: string;
}
export declare class UpdateLeaveStatusDto {
    status: ApprovalStatus;
    approverId?: string;
    approverRemarks?: string;
}
