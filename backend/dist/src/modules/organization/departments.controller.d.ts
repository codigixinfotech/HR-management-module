import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto, UpdateDepartmentDto } from './dto/department.dto';
export declare class DepartmentsController {
    private readonly departmentsService;
    constructor(departmentsService: DepartmentsService);
    list(companyId?: string): import(".prisma/client").Prisma.PrismaPromise<({
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
        effectiveFrom: Date;
        parentDepartmentId: string | null;
        manager: string | null;
        headcountCapacity: number;
        annualBudget: number | null;
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
            effectiveFrom: Date;
            parentDepartmentId: string | null;
            manager: string | null;
            headcountCapacity: number;
            annualBudget: number | null;
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
        effectiveFrom: Date;
        parentDepartmentId: string | null;
        manager: string | null;
        headcountCapacity: number;
        annualBudget: number | null;
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
        effectiveFrom: Date;
        parentDepartmentId: string | null;
        manager: string | null;
        headcountCapacity: number;
        annualBudget: number | null;
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
        effectiveFrom: Date;
        parentDepartmentId: string | null;
        manager: string | null;
        headcountCapacity: number;
        annualBudget: number | null;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
