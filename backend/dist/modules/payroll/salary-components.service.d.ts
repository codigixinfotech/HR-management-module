import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSalaryComponentDto, UpdateSalaryComponentDto } from './dto/salary-component.dto';
export declare class SalaryComponentsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(companyId?: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        type: import(".prisma/client").$Enums.SalaryComponentType;
        isStatutory: boolean;
    }[]>;
    findById(id: string): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        type: import(".prisma/client").$Enums.SalaryComponentType;
        isStatutory: boolean;
    }>;
    create(dto: CreateSalaryComponentDto): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        type: import(".prisma/client").$Enums.SalaryComponentType;
        isStatutory: boolean;
    }>;
    update(id: string, dto: UpdateSalaryComponentDto): Promise<{
        id: string;
        companyId: string;
        name: string;
        createdAt: Date;
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
