import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateComplianceTypeDto, UpdateComplianceTypeDto } from './dto/compliance-type.dto';
export declare class ComplianceTypesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(companyId?: string): import(".prisma/client").Prisma.PrismaPromise<{
        description: string | null;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
        isActive: boolean;
        category: string;
        frequency: import(".prisma/client").$Enums.ComplianceFrequency;
    }[]>;
    findById(id: string): Promise<{
        description: string | null;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
        isActive: boolean;
        category: string;
        frequency: import(".prisma/client").$Enums.ComplianceFrequency;
    }>;
    create(dto: CreateComplianceTypeDto): Promise<{
        description: string | null;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
        isActive: boolean;
        category: string;
        frequency: import(".prisma/client").$Enums.ComplianceFrequency;
    }>;
    update(id: string, dto: UpdateComplianceTypeDto): Promise<{
        description: string | null;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        code: string;
        isActive: boolean;
        category: string;
        frequency: import(".prisma/client").$Enums.ComplianceFrequency;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
