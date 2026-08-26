import { ComplianceTypesService } from './compliance-types.service';
import { CreateComplianceTypeDto, UpdateComplianceTypeDto } from './dto/compliance-type.dto';
export declare class ComplianceTypesController {
    private readonly complianceTypesService;
    constructor(complianceTypesService: ComplianceTypesService);
    list(companyId?: string): import(".prisma/client").Prisma.PrismaPromise<{
        companyId: string;
        description: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        name: string;
        category: string;
        frequency: import(".prisma/client").$Enums.ComplianceFrequency;
    }[]>;
    findOne(id: string): Promise<{
        companyId: string;
        description: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        name: string;
        category: string;
        frequency: import(".prisma/client").$Enums.ComplianceFrequency;
    }>;
    create(dto: CreateComplianceTypeDto): Promise<{
        companyId: string;
        description: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        name: string;
        category: string;
        frequency: import(".prisma/client").$Enums.ComplianceFrequency;
    }>;
    update(id: string, dto: UpdateComplianceTypeDto): Promise<{
        companyId: string;
        description: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        name: string;
        category: string;
        frequency: import(".prisma/client").$Enums.ComplianceFrequency;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
