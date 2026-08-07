import { PayrollRunStatus } from '@prisma/client';
export declare class CreatePayrollRunDto {
    companyId: string;
    month: number;
    year: number;
}
export declare class UpdatePayrollRunStatusDto {
    status: PayrollRunStatus;
}
