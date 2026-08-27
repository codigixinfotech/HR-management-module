import { PrismaService } from '../../common/prisma/prisma.service';
import { CreatePayrollRunDto, UpdatePayrollRunStatusDto } from './dto/payroll-run.dto';
export declare class PayrollRunsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(companyId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        _count: {
            payslips: number;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.PayrollRunStatus;
        month: number;
        year: number;
        processedAt: Date | null;
        approvedAt: Date | null;
        paidAt: Date | null;
    })[]>;
    findById(id: string): Promise<{
        _count: {
            payslips: number;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.PayrollRunStatus;
        month: number;
        year: number;
        processedAt: Date | null;
        approvedAt: Date | null;
        paidAt: Date | null;
    }>;
    create(dto: CreatePayrollRunDto): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.PayrollRunStatus;
        month: number;
        year: number;
        processedAt: Date | null;
        approvedAt: Date | null;
        paidAt: Date | null;
    }>;
    updateStatus(id: string, dto: UpdatePayrollRunStatusDto): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.PayrollRunStatus;
        month: number;
        year: number;
        processedAt: Date | null;
        approvedAt: Date | null;
        paidAt: Date | null;
    }>;
    process(id: string): Promise<{
        _count: {
            payslips: number;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.PayrollRunStatus;
        month: number;
        year: number;
        processedAt: Date | null;
        approvedAt: Date | null;
        paidAt: Date | null;
    }>;
}
