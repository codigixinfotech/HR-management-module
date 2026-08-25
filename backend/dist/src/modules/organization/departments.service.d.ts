import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
export declare class DepartmentsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(companyId?: string): never[] | import(".prisma/client").Prisma.PrismaPromise<({
        parentDepartment: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        code: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        manager: string | null;
        branchId: string | null;
        costCenter: string | null;
        type: string;
        parentDepartmentId: string | null;
        headcountCapacity: number;
        annualBudget: number | null;
        effectiveFrom: Date;
        description: string | null;
    })[]>;
    findById(id: string): Promise<{
        parentDepartment: {
            id: string;
            name: string;
        } | null;
        childDepartments: {
            id: string;
            code: string;
            name: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            manager: string | null;
            branchId: string | null;
            costCenter: string | null;
            type: string;
            parentDepartmentId: string | null;
            headcountCapacity: number;
            annualBudget: number | null;
            effectiveFrom: Date;
            description: string | null;
        }[];
    } & {
        id: string;
        code: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        manager: string | null;
        branchId: string | null;
        costCenter: string | null;
        type: string;
        parentDepartmentId: string | null;
        headcountCapacity: number;
        annualBudget: number | null;
        effectiveFrom: Date;
        description: string | null;
    }>;
    create(dto: CreateDepartmentDto): Promise<{
        id: string;
        code: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        manager: string | null;
        branchId: string | null;
        costCenter: string | null;
        type: string;
        parentDepartmentId: string | null;
        headcountCapacity: number;
        annualBudget: number | null;
        effectiveFrom: Date;
        description: string | null;
    }>;
    update(id: string, dto: UpdateDepartmentDto): Promise<{
        id: string;
        code: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        manager: string | null;
        branchId: string | null;
        costCenter: string | null;
        type: string;
        parentDepartmentId: string | null;
        headcountCapacity: number;
        annualBudget: number | null;
        effectiveFrom: Date;
        description: string | null;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
