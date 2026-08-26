import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCostCenterDto, UpdateCostCenterDto } from './dto/cost-center.dto';
export declare class CostCentersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(companyId?: string, branchId?: string, departmentId?: string): Promise<({
        department: {
            id: string;
            name: string;
        } | null;
        branch: {
            id: string;
            name: string;
        } | null;
    } & {
        companyId: string;
        departmentId: string | null;
        description: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        branchId: string | null;
        code: string;
        name: string;
        type: string;
        headcountCapacity: number;
        effectiveFrom: Date;
        managerId: string | null;
        managerName: string | null;
        budget: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    findOne(id: string): Promise<{
        department: {
            id: string;
            name: string;
        } | null;
        branch: {
            id: string;
            name: string;
        } | null;
    } & {
        companyId: string;
        departmentId: string | null;
        description: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        branchId: string | null;
        code: string;
        name: string;
        type: string;
        headcountCapacity: number;
        effectiveFrom: Date;
        managerId: string | null;
        managerName: string | null;
        budget: import("@prisma/client/runtime/library").Decimal;
    }>;
    create(dto: CreateCostCenterDto): Promise<{
        companyId: string;
        departmentId: string | null;
        description: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        branchId: string | null;
        code: string;
        name: string;
        type: string;
        headcountCapacity: number;
        effectiveFrom: Date;
        managerId: string | null;
        managerName: string | null;
        budget: import("@prisma/client/runtime/library").Decimal;
    }>;
    update(id: string, dto: UpdateCostCenterDto): Promise<{
        companyId: string;
        departmentId: string | null;
        description: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        branchId: string | null;
        code: string;
        name: string;
        type: string;
        headcountCapacity: number;
        effectiveFrom: Date;
        managerId: string | null;
        managerName: string | null;
        budget: import("@prisma/client/runtime/library").Decimal;
    }>;
    remove(id: string): Promise<{
        companyId: string;
        departmentId: string | null;
        description: string | null;
        isActive: boolean;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        branchId: string | null;
        code: string;
        name: string;
        type: string;
        headcountCapacity: number;
        effectiveFrom: Date;
        managerId: string | null;
        managerName: string | null;
        budget: import("@prisma/client/runtime/library").Decimal;
    }>;
}
