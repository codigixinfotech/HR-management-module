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
        costCenter: string | null;
        id: string;
        companyId: string;
        branchId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        code: string;
        type: string;
        parentDepartmentId: string | null;
        manager: string | null;
        headcountCapacity: number;
        annualBudget: number | null;
        effectiveFrom: Date;
        isActive: boolean;
    })[]>;
    findById(id: string): Promise<{
        parentDepartment: {
            id: string;
            name: string;
        } | null;
        childDepartments: {
            costCenter: string | null;
            id: string;
            companyId: string;
            branchId: string | null;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            code: string;
            type: string;
            parentDepartmentId: string | null;
            manager: string | null;
            headcountCapacity: number;
            annualBudget: number | null;
            effectiveFrom: Date;
            isActive: boolean;
        }[];
    } & {
        costCenter: string | null;
        id: string;
        companyId: string;
        branchId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        code: string;
        type: string;
        parentDepartmentId: string | null;
        manager: string | null;
        headcountCapacity: number;
        annualBudget: number | null;
        effectiveFrom: Date;
        isActive: boolean;
    }>;
    create(dto: CreateDepartmentDto): Promise<{
        costCenter: string | null;
        id: string;
        companyId: string;
        branchId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        code: string;
        type: string;
        parentDepartmentId: string | null;
        manager: string | null;
        headcountCapacity: number;
        annualBudget: number | null;
        effectiveFrom: Date;
        isActive: boolean;
    }>;
    update(id: string, dto: UpdateDepartmentDto): Promise<{
        costCenter: string | null;
        id: string;
        companyId: string;
        branchId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        code: string;
        type: string;
        parentDepartmentId: string | null;
        manager: string | null;
        headcountCapacity: number;
        annualBudget: number | null;
        effectiveFrom: Date;
        isActive: boolean;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
