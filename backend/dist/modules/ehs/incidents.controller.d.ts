import { IncidentsService } from './incidents.service';
import { CreateSafetyIncidentDto, UpdateSafetyIncidentStatusDto } from './dto/safety-incident.dto';
export declare class IncidentsController {
    private readonly incidentsService;
    constructor(incidentsService: IncidentsService);
    list(companyId?: string): import("@prisma/client").Prisma.PrismaPromise<({
        reportedBy: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        location: string;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        status: import("@prisma/client").$Enums.IncidentStatus;
        incidentType: string;
        severity: import("@prisma/client").$Enums.IncidentSeverity;
        occurredAt: Date;
        correctiveAction: string | null;
        reportedById: string | null;
    })[]>;
    findOne(id: string): Promise<{
        reportedBy: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        location: string;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        status: import("@prisma/client").$Enums.IncidentStatus;
        incidentType: string;
        severity: import("@prisma/client").$Enums.IncidentSeverity;
        occurredAt: Date;
        correctiveAction: string | null;
        reportedById: string | null;
    }>;
    create(dto: CreateSafetyIncidentDto): import("@prisma/client").Prisma.Prisma__SafetyIncidentClient<{
        reportedBy: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        location: string;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        status: import("@prisma/client").$Enums.IncidentStatus;
        incidentType: string;
        severity: import("@prisma/client").$Enums.IncidentSeverity;
        occurredAt: Date;
        correctiveAction: string | null;
        reportedById: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    updateStatus(id: string, dto: UpdateSafetyIncidentStatusDto): Promise<{
        reportedBy: {
            id: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        location: string;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        status: import("@prisma/client").$Enums.IncidentStatus;
        incidentType: string;
        severity: import("@prisma/client").$Enums.IncidentSeverity;
        occurredAt: Date;
        correctiveAction: string | null;
        reportedById: string | null;
    }>;
}
