import { PrismaService } from '../../common/prisma/prisma.service';
import { AllocateAssetDto, CreateAssetDto, UpdateAssetDto } from './dto/asset.dto';
export declare class AssetsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private readonly listInclude;
    list(companyId?: string): import("@prisma/client").Prisma.PrismaPromise<({
        currentEmployee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        category: string;
        status: import("@prisma/client").$Enums.AssetStatus;
        assetTag: string;
        value: number | null;
        currentEmployeeId: string | null;
        purchaseDate: Date | null;
        warrantyExpiry: Date | null;
        notes: string | null;
    })[]>;
    findById(id: string): Promise<{
        currentEmployee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
        } | null;
        allocations: {
            id: string;
            employeeId: string;
            remarks: string | null;
            assetId: string;
            allocatedAt: Date;
            returnedAt: Date | null;
        }[];
        maintenanceLogs: {
            id: string;
            createdAt: Date;
            startDate: Date;
            endDate: Date | null;
            assetId: string;
            issue: string;
            cost: number | null;
        }[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        category: string;
        status: import("@prisma/client").$Enums.AssetStatus;
        assetTag: string;
        value: number | null;
        currentEmployeeId: string | null;
        purchaseDate: Date | null;
        warrantyExpiry: Date | null;
        notes: string | null;
    }>;
    create(dto: CreateAssetDto): Promise<{
        currentEmployee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        category: string;
        status: import("@prisma/client").$Enums.AssetStatus;
        assetTag: string;
        value: number | null;
        currentEmployeeId: string | null;
        purchaseDate: Date | null;
        warrantyExpiry: Date | null;
        notes: string | null;
    }>;
    update(id: string, dto: UpdateAssetDto): Promise<{
        currentEmployee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        category: string;
        status: import("@prisma/client").$Enums.AssetStatus;
        assetTag: string;
        value: number | null;
        currentEmployeeId: string | null;
        purchaseDate: Date | null;
        warrantyExpiry: Date | null;
        notes: string | null;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
    allocate(id: string, dto: AllocateAssetDto): Promise<{
        currentEmployee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        category: string;
        status: import("@prisma/client").$Enums.AssetStatus;
        assetTag: string;
        value: number | null;
        currentEmployeeId: string | null;
        purchaseDate: Date | null;
        warrantyExpiry: Date | null;
        notes: string | null;
    }>;
    returnAsset(id: string): Promise<{
        currentEmployee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        category: string;
        status: import("@prisma/client").$Enums.AssetStatus;
        assetTag: string;
        value: number | null;
        currentEmployeeId: string | null;
        purchaseDate: Date | null;
        warrantyExpiry: Date | null;
        notes: string | null;
    }>;
}
