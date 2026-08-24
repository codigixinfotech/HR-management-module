import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCostCenterDto, UpdateCostCenterDto } from './dto/cost-center.dto';
export declare class CostCentersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
        code: string;
        name: string;
        type: string;
        branchId: string | null;
        departmentId: string | null;
        managerId: string | null;
        managerName: string | null;
        budget: import("@prisma/client/runtime/library").Decimal;
        headcountCapacity: number;
        effectiveFrom: Date;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
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
        code: string;
        name: string;
        type: string;
        branchId: string | null;
        departmentId: string | null;
        managerId: string | null;
        managerName: string | null;
        budget: import("@prisma/client/runtime/library").Decimal;
        headcountCapacity: number;
        effectiveFrom: Date;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(dto: CreateCostCenterDto): Promise<{
        id: string;
        companyId: string;
        code: string;
        name: string;
        type: string;
        branchId: string | null;
        departmentId: string | null;
        managerId: string | null;
        managerName: string | null;
        budget: import("@prisma/client/runtime/library").Decimal;
        headcountCapacity: number;
        effectiveFrom: Date;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateCostCenterDto): Promise<{
        id: string;
        companyId: string;
        code: string;
        name: string;
        type: string;
        branchId: string | null;
        departmentId: string | null;
        managerId: string | null;
        managerName: string | null;
        budget: import("@prisma/client/runtime/library").Decimal;
        headcountCapacity: number;
        effectiveFrom: Date;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        companyId: string;
        code: string;
        name: string;
        type: string;
        branchId: string | null;
        departmentId: string | null;
        managerId: string | null;
        managerName: string | null;
        budget: import("@prisma/client/runtime/library").Decimal;
        headcountCapacity: number;
        effectiveFrom: Date;
        description: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
