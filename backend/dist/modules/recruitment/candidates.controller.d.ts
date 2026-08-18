import { CandidatesService } from './candidates.service';
import { UpdateCandidateStageDto } from './dto/candidate.dto';
export declare class CandidatesController {
    private readonly candidatesService;
    constructor(candidatesService: CandidatesService);
    findOne(id: string): Promise<{
        email: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        firstName: string;
        lastName: string;
        notes: string | null;
        qualification: string | null;
        experience: string | null;
        jobOpeningId: string;
        resumePath: string | null;
        currentCompany: string | null;
        currentLocation: string | null;
        skills: string | null;
        expectedCtc: number | null;
        noticePeriod: string | null;
        coverLetter: string | null;
        source: string | null;
        stage: import(".prisma/client").$Enums.CandidateStage;
        aiMatchScore: number | null;
    }>;
    updateStage(id: string, dto: UpdateCandidateStageDto): Promise<{
        email: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        firstName: string;
        lastName: string;
        notes: string | null;
        qualification: string | null;
        experience: string | null;
        jobOpeningId: string;
        resumePath: string | null;
        currentCompany: string | null;
        currentLocation: string | null;
        skills: string | null;
        expectedCtc: number | null;
        noticePeriod: string | null;
        coverLetter: string | null;
        source: string | null;
        stage: import(".prisma/client").$Enums.CandidateStage;
        aiMatchScore: number | null;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
