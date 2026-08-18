import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSafetyIncidentDto, UpdateSafetyIncidentStatusDto } from './dto/safety-incident.dto';
export declare class IncidentsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private readonly listInclude;
    list(companyId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        reportedBy: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        location: string;
        description: string | null;
        status: import(".prisma/client").$Enums.IncidentStatus;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        incidentType: string;
        severity: import(".prisma/client").$Enums.IncidentSeverity;
        occurredAt: Date;
        correctiveAction: string | null;
        reportedById: string | null;
    })[]>;
    findById(id: string): Promise<{
        reportedBy: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        location: string;
        description: string | null;
        status: import(".prisma/client").$Enums.IncidentStatus;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        incidentType: string;
        severity: import(".prisma/client").$Enums.IncidentSeverity;
        occurredAt: Date;
        correctiveAction: string | null;
        reportedById: string | null;
    }>;
    create(dto: CreateSafetyIncidentDto): import(".prisma/client").Prisma.Prisma__SafetyIncidentClient<{
        reportedBy: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        location: string;
        description: string | null;
        status: import(".prisma/client").$Enums.IncidentStatus;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        incidentType: string;
        severity: import(".prisma/client").$Enums.IncidentSeverity;
        occurredAt: Date;
        correctiveAction: string | null;
        reportedById: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    updateStatus(id: string, dto: UpdateSafetyIncidentStatusDto): Promise<{
        reportedBy: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        location: string;
        description: string | null;
        status: import(".prisma/client").$Enums.IncidentStatus;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        incidentType: string;
        severity: import(".prisma/client").$Enums.IncidentSeverity;
        occurredAt: Date;
        correctiveAction: string | null;
        reportedById: string | null;
    }>;
}
