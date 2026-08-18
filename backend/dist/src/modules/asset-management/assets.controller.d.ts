import { AssetsService } from './assets.service';
import { AllocateAssetDto, CreateAssetDto, UpdateAssetDto } from './dto/asset.dto';
export declare class AssetsController {
    private readonly assetsService;
    constructor(assetsService: AssetsService);
    list(companyId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        currentEmployee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
        } | null;
    } & {
        status: import(".prisma/client").$Enums.AssetStatus;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        category: string;
        assetTag: string;
        value: number | null;
        currentEmployeeId: string | null;
        purchaseDate: Date | null;
        warrantyExpiry: Date | null;
        notes: string | null;
    })[]>;
    findOne(id: string): Promise<{
        currentEmployee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
        } | null;
        allocations: {
            remarks: string | null;
            id: string;
            employeeId: string;
            assetId: string;
            allocatedAt: Date;
            returnedAt: Date | null;
        }[];
        maintenanceLogs: {
            startDate: Date;
            id: string;
            createdAt: Date;
            endDate: Date | null;
            assetId: string;
            issue: string;
            cost: number | null;
        }[];
    } & {
        status: import(".prisma/client").$Enums.AssetStatus;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        category: string;
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
        status: import(".prisma/client").$Enums.AssetStatus;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        category: string;
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
        status: import(".prisma/client").$Enums.AssetStatus;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        category: string;
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
        status: import(".prisma/client").$Enums.AssetStatus;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        category: string;
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
        status: import(".prisma/client").$Enums.AssetStatus;
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        category: string;
        assetTag: string;
        value: number | null;
        currentEmployeeId: string | null;
        purchaseDate: Date | null;
        warrantyExpiry: Date | null;
        notes: string | null;
    }>;
}
