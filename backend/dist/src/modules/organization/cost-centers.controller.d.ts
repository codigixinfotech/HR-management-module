import { CostCentersService } from './cost-centers.service';
import { CreateCostCenterDto, UpdateCostCenterDto } from './dto/cost-center.dto';
export declare class CostCentersController {
    private readonly service;
    constructor(service: CostCentersService);
    list(companyId?: string): Promise<({
        branch: {
            id: string;
            name: string;
        } | null;
        department: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        companyId: string;
        branchId: string | null;
        departmentId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        code: string;
        type: string;
        headcountCapacity: number;
        effectiveFrom: Date;
        isActive: boolean;
        managerId: string | null;
        managerName: string | null;
        budget: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    findOne(id: string): Promise<{
        branch: {
            id: string;
            name: string;
        } | null;
        department: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        companyId: string;
        branchId: string | null;
        departmentId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        code: string;
        type: string;
        headcountCapacity: number;
        effectiveFrom: Date;
        isActive: boolean;
        managerId: string | null;
        managerName: string | null;
        budget: import("@prisma/client/runtime/library").Decimal;
    }>;
    create(dto: CreateCostCenterDto): Promise<{
        id: string;
        companyId: string;
        branchId: string | null;
        departmentId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        code: string;
        type: string;
        headcountCapacity: number;
        effectiveFrom: Date;
        isActive: boolean;
        managerId: string | null;
        managerName: string | null;
        budget: import("@prisma/client/runtime/library").Decimal;
    }>;
    update(id: string, dto: UpdateCostCenterDto): Promise<{
        id: string;
        companyId: string;
        branchId: string | null;
        departmentId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        code: string;
        type: string;
        headcountCapacity: number;
        effectiveFrom: Date;
        isActive: boolean;
        managerId: string | null;
        managerName: string | null;
        budget: import("@prisma/client/runtime/library").Decimal;
    }>;
    remove(id: string): Promise<{
        id: string;
        companyId: string;
        branchId: string | null;
        departmentId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        code: string;
        type: string;
        headcountCapacity: number;
        effectiveFrom: Date;
        isActive: boolean;
        managerId: string | null;
        managerName: string | null;
        budget: import("@prisma/client/runtime/library").Decimal;
    }>;
}
