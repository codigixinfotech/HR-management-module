import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateDesignationDto, UpdateDesignationDto } from './dto/designation.dto';
export declare class DesignationsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(companyId?: string, departmentId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        department: {
            id: string;
            name: string;
        } | null;
        reportingDesignation: {
            id: string;
            title: string;
        } | null;
    } & {
        id: string;
        companyId: string;
        departmentId: string | null;
        code: string;
        title: string;
        grade: string | null;
        jobFamily: string | null;
        reportingDesignationId: string | null;
        employmentType: string | null;
        minSalary: number | null;
        maxSalary: number | null;
        effectiveFrom: Date;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findById(id: string): Promise<{
        department: {
            id: string;
            name: string;
        } | null;
        reportingDesignation: {
            id: string;
            title: string;
        } | null;
    } & {
        id: string;
        companyId: string;
        departmentId: string | null;
        code: string;
        title: string;
        grade: string | null;
        jobFamily: string | null;
        reportingDesignationId: string | null;
        employmentType: string | null;
        minSalary: number | null;
        maxSalary: number | null;
        effectiveFrom: Date;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(dto: CreateDesignationDto): Promise<{
        id: string;
        companyId: string;
        departmentId: string | null;
        code: string;
        title: string;
        grade: string | null;
        jobFamily: string | null;
        reportingDesignationId: string | null;
        employmentType: string | null;
        minSalary: number | null;
        maxSalary: number | null;
        effectiveFrom: Date;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateDesignationDto): Promise<{
        id: string;
        companyId: string;
        departmentId: string | null;
        code: string;
        title: string;
        grade: string | null;
        jobFamily: string | null;
        reportingDesignationId: string | null;
        employmentType: string | null;
        minSalary: number | null;
        maxSalary: number | null;
        effectiveFrom: Date;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
