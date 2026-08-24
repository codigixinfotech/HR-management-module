import { PrismaService } from '../../common/prisma/prisma.service';
import { AssignSalaryComponentDto } from './dto/employee-salary-component.dto';
export declare class SalaryStructureService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private readonly listInclude;
    list(employeeId: string): import(".prisma/client").Prisma.PrismaPromise<({
        salaryComponent: {
            id: string;
            name: string;
            code: string;
            type: import(".prisma/client").$Enums.SalaryComponentType;
            isStatutory: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        salaryComponentId: string;
        monthlyAmount: number;
        effectiveFrom: Date;
    })[]>;
    assign(dto: AssignSalaryComponentDto): import(".prisma/client").Prisma.Prisma__EmployeeSalaryComponentClient<{
        salaryComponent: {
            id: string;
            name: string;
            code: string;
            type: import(".prisma/client").$Enums.SalaryComponentType;
            isStatutory: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        salaryComponentId: string;
        monthlyAmount: number;
        effectiveFrom: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
