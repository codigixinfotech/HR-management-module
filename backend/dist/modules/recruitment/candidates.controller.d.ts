import { CandidatesService } from './candidates.service';
import { UpdateCandidateStageDto } from './dto/candidate.dto';
export declare class CandidatesController {
    private readonly candidatesService;
    constructor(candidatesService: CandidatesService);
    findOne(id: string): Promise<{
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        firstName: string;
        lastName: string;
        jobOpeningId: string;
        notes: string | null;
        stage: import("@prisma/client").$Enums.CandidateStage;
        resumePath: string | null;
        aiMatchScore: number | null;
    }>;
    updateStage(id: string, dto: UpdateCandidateStageDto): Promise<{
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        firstName: string;
        lastName: string;
        jobOpeningId: string;
        notes: string | null;
        stage: import("@prisma/client").$Enums.CandidateStage;
        resumePath: string | null;
        aiMatchScore: number | null;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
