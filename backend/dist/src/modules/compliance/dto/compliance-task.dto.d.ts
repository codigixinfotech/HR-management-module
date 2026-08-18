import { ComplianceStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
export declare class ListComplianceTasksQueryDto extends PaginationQueryDto {
    companyId?: string;
    status?: ComplianceStatus;
}
export declare class CreateComplianceTaskDto {
    companyId: string;
    complianceTypeId: string;
    periodLabel: string;
    dueDate: string;
}
export declare class UpdateComplianceTaskStatusDto {
    status: ComplianceStatus;
    filedDate?: string;
    filedById?: string;
    remarks?: string;
}
