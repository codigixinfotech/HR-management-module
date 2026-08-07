import { IncidentSeverity, IncidentStatus } from '@prisma/client';
export declare class CreateSafetyIncidentDto {
    companyId: string;
    location: string;
    incidentType: string;
    severity: IncidentSeverity;
    occurredAt: string;
    description?: string;
    correctiveAction?: string;
    reportedById?: string;
}
declare const UpdateSafetyIncidentDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateSafetyIncidentDto>>;
export declare class UpdateSafetyIncidentDto extends UpdateSafetyIncidentDto_base {
}
export declare class UpdateSafetyIncidentStatusDto {
    status: IncidentStatus;
    correctiveAction?: string;
}
export {};
