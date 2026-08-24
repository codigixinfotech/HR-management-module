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
        frequency: import(".prisma/client").$Enums.ComplianceFrequency;
        isActive: boolean;
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
