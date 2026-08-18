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
        costCenter: string | null;
        id: string;
        companyId: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        branchId: string | null;
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
            costCenter: string | null;
            id: string;
            companyId: string;
            name: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
            code: string;
            isActive: boolean;
            branchId: string | null;
            type: string;
            parentDepartmentId: string | null;
            manager: string | null;
            headcountCapacity: number;
            annualBudget: number | null;
            effectiveFrom: Date;
        }[];
    } & {
        costCenter: string | null;
        id: string;
        companyId: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        branchId: string | null;
        type: string;
        parentDepartmentId: string | null;
        manager: string | null;
        headcountCapacity: number;
        annualBudget: number | null;
        effectiveFrom: Date;
    }>;
    create(dto: CreateDepartmentDto): Promise<{
        costCenter: string | null;
        id: string;
        companyId: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        branchId: string | null;
        type: string;
        parentDepartmentId: string | null;
        manager: string | null;
        headcountCapacity: number;
        annualBudget: number | null;
        effectiveFrom: Date;
    }>;
    update(id: string, dto: UpdateDepartmentDto): Promise<{
        costCenter: string | null;
        id: string;
        companyId: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        code: string;
        isActive: boolean;
        branchId: string | null;
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
