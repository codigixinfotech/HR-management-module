import { ComplianceStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { CreateComplianceTaskDto, UpdateComplianceTaskStatusDto } from './dto/compliance-task.dto';
export declare class ComplianceTasksService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private readonly listInclude;
    list(query: PaginationQueryDto, companyId?: string, status?: ComplianceStatus): Promise<{
        items: ({
            complianceType: {
                id: string;
                name: string;
                category: string;
                code: string;
                frequency: import(".prisma/client").$Enums.ComplianceFrequency;
            };
            filedBy: {
                id: string;
                firstName: string;
                lastName: string;
            } | null;
        } & {
            id: string;
            companyId: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.ComplianceStatus;
            remarks: string | null;
            complianceTypeId: string;
            periodLabel: string;
            dueDate: Date;
            filedDate: Date | null;
            filedById: string | null;
        })[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findById(id: string): Promise<{
        complianceType: {
            id: string;
            name: string;
            category: string;
            code: string;
            frequency: import(".prisma/client").$Enums.ComplianceFrequency;
        };
        filedBy: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ComplianceStatus;
        remarks: string | null;
        complianceTypeId: string;
        periodLabel: string;
        dueDate: Date;
        filedDate: Date | null;
        filedById: string | null;
    }>;
    create(dto: CreateComplianceTaskDto): import(".prisma/client").Prisma.Prisma__ComplianceTaskClient<{
        complianceType: {
            id: string;
            name: string;
            category: string;
            code: string;
            frequency: import(".prisma/client").$Enums.ComplianceFrequency;
        };
        filedBy: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ComplianceStatus;
        remarks: string | null;
        complianceTypeId: string;
        periodLabel: string;
        dueDate: Date;
        filedDate: Date | null;
        filedById: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    updateStatus(id: string, dto: UpdateComplianceTaskStatusDto): Promise<{
        complianceType: {
            id: string;
            name: string;
            category: string;
            code: string;
            frequency: import(".prisma/client").$Enums.ComplianceFrequency;
        };
        filedBy: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.ComplianceStatus;
        remarks: string | null;
        complianceTypeId: string;
        periodLabel: string;
        dueDate: Date;
        filedDate: Date | null;
        filedById: string | null;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
