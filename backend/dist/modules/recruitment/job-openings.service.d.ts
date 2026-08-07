import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateJobOpeningDto, UpdateJobOpeningDto } from './dto/job-opening.dto';
export declare class JobOpeningsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    findById(id: string): Promise<{
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
            firstName: string;
            lastName: string;
            phone: string | null;
            jobOpeningId: string;
            notes: string | null;
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
}
