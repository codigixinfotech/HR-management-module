import { DesignationsService } from './designations.service';
import { CreateDesignationDto, UpdateDesignationDto } from './dto/designation.dto';
export declare class DesignationsController {
    private readonly designationsService;
    constructor(designationsService: DesignationsService);
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
        employmentType: string | null;
        grade: string | null;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        code: string;
        effectiveFrom: Date;
        isActive: boolean;
        jobFamily: string | null;
        reportingDesignationId: string | null;
        minSalary: number | null;
        maxSalary: number | null;
    })[]>;
    findOne(id: string): Promise<{
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
        employmentType: string | null;
        grade: string | null;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        code: string;
        effectiveFrom: Date;
        isActive: boolean;
        jobFamily: string | null;
        reportingDesignationId: string | null;
        minSalary: number | null;
        maxSalary: number | null;
    }>;
    create(dto: CreateDesignationDto): Promise<{
        id: string;
        companyId: string;
        departmentId: string | null;
        employmentType: string | null;
        grade: string | null;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        code: string;
        effectiveFrom: Date;
        isActive: boolean;
        jobFamily: string | null;
        reportingDesignationId: string | null;
        minSalary: number | null;
        maxSalary: number | null;
    }>;
    update(id: string, dto: UpdateDesignationDto): Promise<{
        id: string;
        companyId: string;
        departmentId: string | null;
        employmentType: string | null;
        grade: string | null;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
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
