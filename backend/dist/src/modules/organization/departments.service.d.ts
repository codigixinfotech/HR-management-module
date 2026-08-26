import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
export declare class DepartmentsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(companyId?: string, branchId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        parentDepartment: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        companyId: string;
        branchId: string | null;
        code: string;
        name: string;
        type: string;
        parentDepartmentId: string | null;
        manager: string | null;
        costCenter: string | null;
        headcountCapacity: number;
        annualBudget: number | null;
        effectiveFrom: Date;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    findById(id: string): Promise<{
        parentDepartment: {
            id: string;
            name: string;
        } | null;
        childDepartments: {
            id: string;
            companyId: string;
            branchId: string | null;
            code: string;
            name: string;
            type: string;
            parentDepartmentId: string | null;
            manager: string | null;
            costCenter: string | null;
            headcountCapacity: number;
            annualBudget: number | null;
            effectiveFrom: Date;
            description: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        }[];
    } & {
        id: string;
        companyId: string;
        branchId: string | null;
        code: string;
        name: string;
        type: string;
        parentDepartmentId: string | null;
        manager: string | null;
        costCenter: string | null;
        headcountCapacity: number;
        annualBudget: number | null;
        effectiveFrom: Date;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(dto: CreateDepartmentDto): Promise<{
        id: string;
        companyId: string;
        branchId: string | null;
        code: string;
        name: string;
        type: string;
        parentDepartmentId: string | null;
        manager: string | null;
        costCenter: string | null;
        headcountCapacity: number;
        annualBudget: number | null;
        effectiveFrom: Date;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateDepartmentDto): Promise<{
        id: string;
        companyId: string;
        branchId: string | null;
        code: string;
        name: string;
        type: string;
        parentDepartmentId: string | null;
        manager: string | null;
        costCenter: string | null;
        headcountCapacity: number;
        annualBudget: number | null;
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
