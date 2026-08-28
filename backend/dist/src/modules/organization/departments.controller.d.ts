import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
export declare class DepartmentsController {
    private readonly departmentsService;
    constructor(departmentsService: DepartmentsService);
    list(companyId?: string, branchId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        parentDepartment: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        costCenter: string | null;
        companyId: string;
        branchId: string | null;
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
    findOne(id: string): Promise<{
        parentDepartment: {
            id: string;
            name: string;
        } | null;
        childDepartments: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            costCenter: string | null;
            companyId: string;
            branchId: string | null;
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
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        costCenter: string | null;
        companyId: string;
        branchId: string | null;
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
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        costCenter: string | null;
        companyId: string;
        branchId: string | null;
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
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        costCenter: string | null;
        companyId: string;
        branchId: string | null;
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
