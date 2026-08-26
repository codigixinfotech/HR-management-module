import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSafetyAuditDto } from './dto/safety-audit.dto';
export declare class SafetyAuditsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(companyId?: string): import(".prisma/client").Prisma.PrismaPromise<{
        companyId: string;
        id: string;
        createdAt: Date;
        location: string;
        auditDate: Date;
        score: number;
        auditor: string;
        findings: string | null;
    }[]>;
    create(dto: CreateSafetyAuditDto): import(".prisma/client").Prisma.Prisma__SafetyAuditClient<{
        companyId: string;
        id: string;
        createdAt: Date;
        location: string;
        auditDate: Date;
        score: number;
        auditor: string;
        findings: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
}
