import { SafetyAuditsService } from './safety-audits.service';
import { CreateSafetyAuditDto } from './dto/safety-audit.dto';
export declare class SafetyAuditsController {
    private readonly safetyAuditsService;
    constructor(safetyAuditsService: SafetyAuditsService);
    list(companyId?: string): import(".prisma/client").Prisma.PrismaPromise<{
        location: string;
        id: string;
        companyId: string;
        createdAt: Date;
        auditDate: Date;
        score: number;
        auditor: string;
        findings: string | null;
    }[]>;
    create(dto: CreateSafetyAuditDto): import(".prisma/client").Prisma.Prisma__SafetyAuditClient<{
        location: string;
        id: string;
        companyId: string;
        createdAt: Date;
        auditDate: Date;
        score: number;
        auditor: string;
        findings: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
}
