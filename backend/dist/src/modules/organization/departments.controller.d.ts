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
        companyId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        branchId: string | null;
        costCenter: string | null;
        description: string | null;
        code: string;
        isActive: boolean;
        type: string;
        parentDepartmentId: string | null;
        manager: string | null;
        headcountCapacity: number;
        annualBudget: number | null;
        effectiveFrom: Date;
    })[]>;
    findOne(id: string): Promise<{
        parentDepartment: {
            id: string;
            name: string;
        } | null;
        childDepartments: {
            id: string;
            companyId: string;
            createdAt: Date;
            name: string;
            updatedAt: Date;
            branchId: string | null;
            costCenter: string | null;
            description: string | null;
            code: string;
            isActive: boolean;
            type: string;
            parentDepartmentId: string | null;
            manager: string | null;
            headcountCapacity: number;
            annualBudget: number | null;
            effectiveFrom: Date;
        }[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        branchId: string | null;
        costCenter: string | null;
        description: string | null;
        code: string;
        isActive: boolean;
        type: string;
        parentDepartmentId: string | null;
        manager: string | null;
        headcountCapacity: number;
        annualBudget: number | null;
        effectiveFrom: Date;
    }>;
    create(dto: CreateDepartmentDto): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        branchId: string | null;
        costCenter: string | null;
        description: string | null;
        code: string;
        isActive: boolean;
        type: string;
        parentDepartmentId: string | null;
        manager: string | null;
        headcountCapacity: number;
        annualBudget: number | null;
        effectiveFrom: Date;
    }>;
    update(id: string, dto: UpdateDepartmentDto): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        branchId: string | null;
        costCenter: string | null;
        description: string | null;
        code: string;
        isActive: boolean;
        type: string;
        parentDepartmentId: string | null;
        manager: string | null;
        headcountCapacity: number;
        annualBudget: number | null;
        effectiveFrom: Date;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
