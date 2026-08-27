import { PayslipsService } from './payslips.service';
export declare class PayslipsController {
    private readonly payslipsService;
    constructor(payslipsService: PayslipsService);
    list(payrollRunId?: string, employeeId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
        };
        components: {
            id: string;
            name: string;
            type: import(".prisma/client").$Enums.SalaryComponentType;
            amount: number;
            payslipId: string;
            salaryComponentId: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        employeeId: string;
        payrollRunId: string;
        grossEarnings: number;
        pf: number;
        esic: number;
        professionalTax: number;
        otherDeductions: number;
        netPay: number;
    })[]>;
    findOne(id: string): Promise<{
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
        };
        components: {
            id: string;
            name: string;
            type: import(".prisma/client").$Enums.SalaryComponentType;
            amount: number;
            payslipId: string;
            salaryComponentId: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        employeeId: string;
        payrollRunId: string;
        grossEarnings: number;
        pf: number;
        esic: number;
        professionalTax: number;
        otherDeductions: number;
        netPay: number;
    }>;
}
