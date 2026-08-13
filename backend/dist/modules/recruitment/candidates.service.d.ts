import { CandidateStage } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCandidateDto } from './dto/candidate.dto';
export declare class CandidatesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listForJobOpening(jobOpeningId: string): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        firstName: string;
        lastName: string;
        notes: string | null;
        jobOpeningId: string;
        stage: import("@prisma/client").$Enums.CandidateStage;
        resumePath: string | null;
        aiMatchScore: number | null;
    }[]>;
    findById(id: string): Promise<{
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        firstName: string;
        lastName: string;
        notes: string | null;
        jobOpeningId: string;
        stage: import("@prisma/client").$Enums.CandidateStage;
        resumePath: string | null;
        aiMatchScore: number | null;
    }>;
    create(dto: CreateCandidateDto): import("@prisma/client").Prisma.Prisma__CandidateClient<{
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        firstName: string;
        lastName: string;
        notes: string | null;
        jobOpeningId: string;
        stage: import("@prisma/client").$Enums.CandidateStage;
        resumePath: string | null;
        aiMatchScore: number | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    updateStage(id: string, stage: CandidateStage): Promise<{
        id: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
        phone: string | null;
        firstName: string;
        lastName: string;
        notes: string | null;
        jobOpeningId: string;
        stage: import("@prisma/client").$Enums.CandidateStage;
        resumePath: string | null;
        aiMatchScore: number | null;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
