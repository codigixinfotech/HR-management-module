import { ComplianceTasksService } from './compliance-tasks.service';
import { CreateComplianceTaskDto, ListComplianceTasksQueryDto, UpdateComplianceTaskStatusDto } from './dto/compliance-task.dto';
export declare class ComplianceTasksController {
    private readonly complianceTasksService;
    constructor(complianceTasksService: ComplianceTasksService);
    list(query: ListComplianceTasksQueryDto): Promise<{
        items: ({
            complianceType: {
                id: string;
                name: string;
                code: string;
                category: string;
                frequency: import("@prisma/client").$Enums.ComplianceFrequency;
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
            status: import("@prisma/client").$Enums.ComplianceStatus;
            dueDate: Date;
            remarks: string | null;
            complianceTypeId: string;
            periodLabel: string;
            filedDate: Date | null;
            filedById: string | null;
        })[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    findOne(id: string): Promise<{
        complianceType: {
            id: string;
            name: string;
            code: string;
            category: string;
            frequency: import("@prisma/client").$Enums.ComplianceFrequency;
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
        status: import("@prisma/client").$Enums.ComplianceStatus;
        dueDate: Date;
        remarks: string | null;
        complianceTypeId: string;
        periodLabel: string;
        filedDate: Date | null;
        filedById: string | null;
    }>;
    create(dto: CreateComplianceTaskDto): import("@prisma/client").Prisma.Prisma__ComplianceTaskClient<{
        complianceType: {
            id: string;
            name: string;
            code: string;
            category: string;
            frequency: import("@prisma/client").$Enums.ComplianceFrequency;
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
        status: import("@prisma/client").$Enums.ComplianceStatus;
        dueDate: Date;
        remarks: string | null;
        complianceTypeId: string;
        periodLabel: string;
        filedDate: Date | null;
        filedById: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    updateStatus(id: string, dto: UpdateComplianceTaskStatusDto): Promise<{
        complianceType: {
            id: string;
            name: string;
            code: string;
            category: string;
            frequency: import("@prisma/client").$Enums.ComplianceFrequency;
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
        status: import("@prisma/client").$Enums.ComplianceStatus;
        dueDate: Date;
        remarks: string | null;
        complianceTypeId: string;
        periodLabel: string;
        filedDate: Date | null;
        filedById: string | null;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
