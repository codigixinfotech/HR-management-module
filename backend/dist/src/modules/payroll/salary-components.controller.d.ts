import { SalaryComponentsService } from './salary-components.service';
import { CreateSalaryComponentDto, UpdateSalaryComponentDto } from './dto/salary-component.dto';
export declare class SalaryComponentsController {
    private readonly salaryComponentsService;
    constructor(salaryComponentsService: SalaryComponentsService);
    list(companyId?: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        type: import(".prisma/client").$Enums.SalaryComponentType;
        isStatutory: boolean;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        type: import(".prisma/client").$Enums.SalaryComponentType;
        isStatutory: boolean;
    }>;
    create(dto: CreateSalaryComponentDto): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        type: import(".prisma/client").$Enums.SalaryComponentType;
        isStatutory: boolean;
    }>;
    update(id: string, dto: UpdateSalaryComponentDto): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        type: import(".prisma/client").$Enums.SalaryComponentType;
        isStatutory: boolean;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
