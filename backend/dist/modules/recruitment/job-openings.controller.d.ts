import { JobOpeningsService } from './job-openings.service';
import { CandidatesService } from './candidates.service';
import { CreateJobOpeningDto, UpdateJobOpeningDto } from './dto/job-opening.dto';
import { CreateCandidateDto } from './dto/candidate.dto';
export declare class JobOpeningsController {
    private readonly jobOpeningsService;
    private readonly candidatesService;
    constructor(jobOpeningsService: JobOpeningsService, candidatesService: CandidatesService);
    list(companyId?: string): import("@prisma/client").Prisma.PrismaPromise<({
        department: {
            id: string;
            name: string;
        } | null;
        designation: {
            id: string;
            title: string;
        } | null;
        _count: {
            candidates: number;
        };
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        departmentId: string | null;
        title: string;
        designationId: string | null;
        numPositions: number;
    })[]>;
    findOne(id: string): Promise<{
        department: {
            id: string;
            name: string;
        } | null;
        designation: {
            id: string;
            title: string;
        } | null;
        candidates: {
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
        }[];
    } & {
        id: string;
        companyId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        departmentId: string | null;
        title: string;
        designationId: string | null;
        numPositions: number;
    }>;
    create(dto: CreateJobOpeningDto): import("@prisma/client").Prisma.Prisma__JobOpeningClient<{
        id: string;
        companyId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        departmentId: string | null;
        title: string;
        designationId: string | null;
        numPositions: number;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, dto: UpdateJobOpeningDto): Promise<{
        id: string;
        companyId: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        departmentId: string | null;
        title: string;
        designationId: string | null;
        numPositions: number;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
    listCandidates(id: string): import("@prisma/client").Prisma.PrismaPromise<{
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
    addCandidate(id: string, dto: Omit<CreateCandidateDto, 'jobOpeningId'>): import("@prisma/client").Prisma.Prisma__CandidateClient<{
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
}
