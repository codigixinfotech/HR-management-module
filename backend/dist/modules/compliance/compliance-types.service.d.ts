import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateComplianceTypeDto, UpdateComplianceTypeDto } from './dto/compliance-type.dto';
export declare class ComplianceTypesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(companyId?: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        companyId: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        category: string;
        frequency: import(".prisma/client").$Enums.ComplianceFrequency;
    }[]>;
    findById(id: string): Promise<{
        id: string;
        companyId: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        category: string;
        frequency: import(".prisma/client").$Enums.ComplianceFrequency;
    }>;
    create(dto: CreateComplianceTypeDto): Promise<{
        id: string;
        companyId: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        category: string;
        frequency: import(".prisma/client").$Enums.ComplianceFrequency;
    }>;
    update(id: string, dto: UpdateComplianceTypeDto): Promise<{
        id: string;
        companyId: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        category: string;
        frequency: import(".prisma/client").$Enums.ComplianceFrequency;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
