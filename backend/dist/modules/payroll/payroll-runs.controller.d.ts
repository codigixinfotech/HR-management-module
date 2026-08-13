import { PayrollRunsService } from './payroll-runs.service';
import { CreatePayrollRunDto, UpdatePayrollRunStatusDto } from './dto/payroll-run.dto';
export declare class PayrollRunsController {
    private readonly payrollRunsService;
    constructor(payrollRunsService: PayrollRunsService);
    list(companyId?: string): import("@prisma/client").Prisma.PrismaPromise<({
        _count: {
            payslips: number;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        year: number;
        status: import("@prisma/client").$Enums.PayrollRunStatus;
        approvedAt: Date | null;
        month: number;
        processedAt: Date | null;
        paidAt: Date | null;
    })[]>;
    findOne(id: string): Promise<{
        _count: {
            payslips: number;
        };
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        year: number;
        status: import("@prisma/client").$Enums.PayrollRunStatus;
        approvedAt: Date | null;
        month: number;
        processedAt: Date | null;
        paidAt: Date | null;
    }>;
    create(dto: CreatePayrollRunDto): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        year: number;
        status: import("@prisma/client").$Enums.PayrollRunStatus;
        approvedAt: Date | null;
        month: number;
        processedAt: Date | null;
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
        year: number;
        status: import("@prisma/client").$Enums.PayrollRunStatus;
        approvedAt: Date | null;
        month: number;
        processedAt: Date | null;
        paidAt: Date | null;
    }>;
    updateStatus(id: string, dto: UpdatePayrollRunStatusDto): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        year: number;
        status: import("@prisma/client").$Enums.PayrollRunStatus;
        approvedAt: Date | null;
        month: number;
        processedAt: Date | null;
        paidAt: Date | null;
    }>;
}
