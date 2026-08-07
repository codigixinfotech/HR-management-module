import { CandidateStage } from '@prisma/client';
export declare class CreateCandidateDto {
    jobOpeningId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    notes?: string;
}
export declare class UpdateCandidateStageDto {
    stage: CandidateStage;
}
