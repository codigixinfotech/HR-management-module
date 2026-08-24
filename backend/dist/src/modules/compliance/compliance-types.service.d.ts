import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateComplianceTypeDto, UpdateComplianceTypeDto } from './dto/compliance-type.dto';
export declare class ComplianceTypesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(companyId?: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        category: string;
        updatedAt: Date;
        description: string | null;
        code: string;
        frequency: import(".prisma/client").$Enums.ComplianceFrequency;
        isActive: boolean;
    }[]>;
    findById(id: string): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        category: string;
        updatedAt: Date;
        description: string | null;
        code: string;
        frequency: import(".prisma/client").$Enums.ComplianceFrequency;
        isActive: boolean;
    }>;
    create(dto: CreateComplianceTypeDto): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        category: string;
        updatedAt: Date;
        description: string | null;
        code: string;
        frequency: import(".prisma/client").$Enums.ComplianceFrequency;
        isActive: boolean;
    }>;
    update(id: string, dto: UpdateComplianceTypeDto): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        category: string;
        updatedAt: Date;
        description: string | null;
        code: string;
        frequency: import(".prisma/client").$Enums.ComplianceFrequency;
        isActive: boolean;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
