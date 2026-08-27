import { ComplianceTypesService } from './compliance-types.service';
import { CreateComplianceTypeDto, UpdateComplianceTypeDto } from './dto/compliance-type.dto';
export declare class ComplianceTypesController {
    private readonly complianceTypesService;
    constructor(complianceTypesService: ComplianceTypesService);
    list(companyId?: string): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        category: string;
        updatedAt: Date;
        description: string | null;
        code: string;
        isActive: boolean;
        frequency: import(".prisma/client").$Enums.ComplianceFrequency;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        category: string;
        updatedAt: Date;
        description: string | null;
        code: string;
        isActive: boolean;
        frequency: import(".prisma/client").$Enums.ComplianceFrequency;
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
        isActive: boolean;
        frequency: import(".prisma/client").$Enums.ComplianceFrequency;
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
        isActive: boolean;
        frequency: import(".prisma/client").$Enums.ComplianceFrequency;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
