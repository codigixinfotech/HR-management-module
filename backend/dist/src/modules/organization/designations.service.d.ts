import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateDesignationDto, UpdateDesignationDto } from './dto/designation.dto';
export declare class DesignationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(companyId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        department: {
            id: string;
            name: string;
        } | null;
        reportingDesignation: {
            title: string;
            id: string;
        } | null;
    } & {
        title: string;
        description: string | null;
        id: string;
        companyId: string;
        departmentId: string | null;
        employmentType: string | null;
        grade: string | null;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        effectiveFrom: Date;
        isActive: boolean;
        jobFamily: string | null;
        reportingDesignationId: string | null;
        minSalary: number | null;
        maxSalary: number | null;
    })[]>;
    findById(id: string): Promise<{
        department: {
            id: string;
            name: string;
        } | null;
        reportingDesignation: {
            title: string;
            id: string;
        } | null;
    } & {
        title: string;
        description: string | null;
        id: string;
        companyId: string;
        departmentId: string | null;
        employmentType: string | null;
        grade: string | null;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        effectiveFrom: Date;
        isActive: boolean;
        jobFamily: string | null;
        reportingDesignationId: string | null;
        minSalary: number | null;
        maxSalary: number | null;
    }>;
    create(dto: CreateDesignationDto): Promise<{
        title: string;
        description: string | null;
        id: string;
        companyId: string;
        departmentId: string | null;
        employmentType: string | null;
        grade: string | null;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        effectiveFrom: Date;
        isActive: boolean;
        jobFamily: string | null;
        reportingDesignationId: string | null;
        minSalary: number | null;
        maxSalary: number | null;
    }>;
    update(id: string, dto: UpdateDesignationDto): Promise<{
        title: string;
        description: string | null;
        id: string;
        companyId: string;
        departmentId: string | null;
        employmentType: string | null;
        grade: string | null;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        effectiveFrom: Date;
        isActive: boolean;
        jobFamily: string | null;
        reportingDesignationId: string | null;
        minSalary: number | null;
        maxSalary: number | null;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
