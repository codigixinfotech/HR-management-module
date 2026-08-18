import { CandidateStage } from '@prisma/client';
export declare class CreateCandidateDto {
    jobOpeningId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    qualification?: string;
    experience?: string;
    currentCompany?: string;
    currentLocation?: string;
    skills?: string;
    expectedCtc?: number;
    noticePeriod?: string;
    coverLetter?: string;
    source?: string;
    notes?: string;
}
export declare class UpdateCandidateStageDto {
    stage: CandidateStage;
}
