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
        description: string | null;
        id: string;
        companyId: string;
        branchId: string | null;
        departmentId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
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
        description: string | null;
        id: string;
        companyId: string;
        branchId: string | null;
        departmentId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
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
        description: string | null;
        id: string;
        companyId: string;
        branchId: string | null;
        departmentId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
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
        description: string | null;
        id: string;
        companyId: string;
        branchId: string | null;
        departmentId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
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
        description: string | null;
        id: string;
        companyId: string;
        branchId: string | null;
        departmentId: string | null;
        createdAt: Date;
        updatedAt: Date;
        name: string;
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
