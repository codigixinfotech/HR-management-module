import { CostCentersService } from './cost-centers.service';
import { CreateCostCenterDto, UpdateCostCenterDto } from './dto/cost-center.dto';
export declare class CostCentersController {
    private readonly service;
    constructor(service: CostCentersService);
    list(companyId?: string, branchId?: string, departmentId?: string): Promise<({
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
        createdAt: Date;
        name: string;
        updatedAt: Date;
        branchId: string | null;
        departmentId: string | null;
        description: string | null;
        code: string;
        isActive: boolean;
        type: string;
        headcountCapacity: number;
        effectiveFrom: Date;
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
        createdAt: Date;
        name: string;
        updatedAt: Date;
        branchId: string | null;
        departmentId: string | null;
        description: string | null;
        code: string;
        isActive: boolean;
        type: string;
        headcountCapacity: number;
        effectiveFrom: Date;
        managerId: string | null;
        managerName: string | null;
        budget: import("@prisma/client/runtime/library").Decimal;
    }>;
    create(dto: CreateCostCenterDto): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        branchId: string | null;
        departmentId: string | null;
        description: string | null;
        code: string;
        isActive: boolean;
        type: string;
        headcountCapacity: number;
        effectiveFrom: Date;
        managerId: string | null;
        managerName: string | null;
        budget: import("@prisma/client/runtime/library").Decimal;
    }>;
    update(id: string, dto: UpdateCostCenterDto): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        branchId: string | null;
        departmentId: string | null;
        description: string | null;
        code: string;
        isActive: boolean;
        type: string;
        headcountCapacity: number;
        effectiveFrom: Date;
        managerId: string | null;
        managerName: string | null;
        budget: import("@prisma/client/runtime/library").Decimal;
    }>;
    remove(id: string): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        updatedAt: Date;
        branchId: string | null;
        departmentId: string | null;
        description: string | null;
        code: string;
        isActive: boolean;
        type: string;
        headcountCapacity: number;
        effectiveFrom: Date;
        managerId: string | null;
        managerName: string | null;
        budget: import("@prisma/client/runtime/library").Decimal;
    }>;
}
