import { PrismaService } from '../../common/prisma/prisma.service';
export declare class PayslipsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private readonly listInclude;
    list(payrollRunId?: string, employeeId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        employee: {
            id: string;
            firstName: string;
            lastName: string;
            employeeCode: string;
        };
        components: {
            id: string;
            name: string;
            type: import(".prisma/client").$Enums.SalaryComponentType;
            salaryComponentId: string | null;
            payslipId: string;
            amount: number;
        }[];
    } & {
        id: string;
        createdAt: Date;
        employeeId: string;
        otherDeductions: number;
        grossEarnings: number;
        pf: number;
        esic: number;
        professionalTax: number;
        netPay: number;
        payrollRunId: string;
    })[]>;
    findById(id: string): Promise<{
        employee: {
            id: string;
            firstName: string;
            lastName: string;
            employeeCode: string;
        };
        components: {
            id: string;
            name: string;
            type: import(".prisma/client").$Enums.SalaryComponentType;
            salaryComponentId: string | null;
            payslipId: string;
            amount: number;
        }[];
    } & {
        id: string;
        createdAt: Date;
        employeeId: string;
        otherDeductions: number;
        grossEarnings: number;
        pf: number;
        esic: number;
        professionalTax: number;
        netPay: number;
        payrollRunId: string;
    }>;
}
