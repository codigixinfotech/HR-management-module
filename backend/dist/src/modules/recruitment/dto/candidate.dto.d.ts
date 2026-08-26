import { CandidateStage } from '@prisma/client';
export declare class CreateCandidateDto {
    jobOpeningId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    candidateType?: string;
    qualification?: string;
    graduationYear?: string;
    internshipDetails?: string;
    experience?: string;
    currentCompany?: string;
    currentLocation?: string;
    skills?: string;
    currentCtc?: number;
    expectedCtc?: number;
    noticePeriod?: string;
    coverLetter?: string;
    source?: string;
    notes?: string;
}
export declare class UpdateCandidateStageDto {
    stage: CandidateStage;
}
export declare class SaveCandidateScreeningDto {
    relevantExperienceYears?: number;
    relevantExperienceSummary?: string;
    currentLocation?: string;
    noticePeriod?: string;
    currentCtc?: number;
    expectedCtc?: number;
    highestQualification?: string;
    qualificationMatch?: string;
    skillsMatch?: string;
    technicalRating: number;
    communicationRating: number;
    profileMatchRating: number;
    overallScreeningScore?: number;
    screeningRemarks?: string;
    rejectionReason?: string;
    screeningDecision: 'SHORTLIST' | 'HOLD' | 'REJECT';
    screenedBy?: string;
    lastUpdatedBy?: string;
}
