import { PayslipsService } from './payslips.service';
export declare class PayslipsController {
    private readonly payslipsService;
    constructor(payslipsService: PayslipsService);
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
    findOne(id: string): Promise<{
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
