import { ComplianceTypesService } from './compliance-types.service';
import { CreateComplianceTypeDto, UpdateComplianceTypeDto } from './dto/compliance-type.dto';
export declare class ComplianceTypesController {
    private readonly complianceTypesService;
    constructor(complianceTypesService: ComplianceTypesService);
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
    findOne(id: string): Promise<{
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
