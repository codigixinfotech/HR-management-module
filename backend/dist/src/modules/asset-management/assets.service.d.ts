import { PrismaService } from '../../common/prisma/prisma.service';
import { AllocateAssetDto, CreateAssetDto, ReturnAssetDto, UpdateAssetDto } from './dto/asset.dto';
export declare class AssetsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private readonly listInclude;
    list(companyId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        company: {
            id: string;
            name: string;
            code: string;
        };
        branch: {
            id: string;
            name: string;
            code: string;
        } | null;
        department: {
            id: string;
            name: string;
            code: string;
        } | null;
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
        name: string;
        category: string;
        updatedAt: Date;
        branchId: string | null;
        departmentId: string | null;
        status: import(".prisma/client").$Enums.AssetStatus;
        remarks: string | null;
        vendor: string | null;
        notes: string | null;
        assetTag: string;
        assetType: string | null;
        physicalLocation: string | null;
        invoiceNumber: string | null;
        poNumber: string | null;
        serialNumber: string | null;
        manufacturer: string | null;
        modelNumber: string | null;
        warrantyStart: Date | null;
        warrantyExpiry: Date | null;
        value: number | null;
        condition: string | null;
        usefulLife: string | null;
        photoUrl: string | null;
        currentEmployeeId: string | null;
        purchaseDate: Date | null;
    })[]>;
    findById(id: string): Promise<{
        company: {
            id: string;
            name: string;
            code: string;
        };
        branch: {
            id: string;
            name: string;
            code: string;
        } | null;
        department: {
            id: string;
            name: string;
            code: string;
        } | null;
        currentEmployee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
        } | null;
        allocations: ({
            employee: {
                id: string;
                employeeCode: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            location: string | null;
            employeeId: string;
            remarks: string | null;
            assetId: string;
            allocatedAt: Date;
            allocationType: string | null;
            expectedReturnDate: Date | null;
            returnedAt: Date | null;
            returnReason: string | null;
            returnedBy: string | null;
            returnLocation: string | null;
            conditionOnReturn: string | null;
            accessoriesReturned: string | null;
        })[];
        maintenanceLogs: {
            id: string;
            createdAt: Date;
            startDate: Date;
            endDate: Date | null;
            assetId: string;
            workOrderNumber: string | null;
            issue: string;
            priority: string | null;
            maintenanceType: string | null;
            vendor: string | null;
            warrantyClaim: boolean;
            cost: number | null;
            finalCondition: string | null;
            workPerformed: string | null;
            partsUsed: string | null;
            qcStatus: string | null;
            notes: string | null;
        }[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        name: string;
        category: string;
        updatedAt: Date;
        branchId: string | null;
        departmentId: string | null;
        status: import(".prisma/client").$Enums.AssetStatus;
        remarks: string | null;
        vendor: string | null;
        notes: string | null;
        assetTag: string;
        assetType: string | null;
        physicalLocation: string | null;
        invoiceNumber: string | null;
        poNumber: string | null;
        serialNumber: string | null;
        manufacturer: string | null;
        modelNumber: string | null;
        warrantyStart: Date | null;
        warrantyExpiry: Date | null;
        value: number | null;
        condition: string | null;
        usefulLife: string | null;
        photoUrl: string | null;
        currentEmployeeId: string | null;
        purchaseDate: Date | null;
    }>;
    private generateNextAssetTag;
    create(dto: CreateAssetDto): Promise<{
        company: {
            id: string;
            name: string;
            code: string;
        };
        branch: {
            id: string;
            name: string;
            code: string;
        } | null;
        department: {
            id: string;
            name: string;
            code: string;
        } | null;
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
        name: string;
        category: string;
        updatedAt: Date;
        branchId: string | null;
        departmentId: string | null;
        status: import(".prisma/client").$Enums.AssetStatus;
        remarks: string | null;
        vendor: string | null;
        notes: string | null;
        assetTag: string;
        assetType: string | null;
        physicalLocation: string | null;
        invoiceNumber: string | null;
        poNumber: string | null;
        serialNumber: string | null;
        manufacturer: string | null;
        modelNumber: string | null;
        warrantyStart: Date | null;
        warrantyExpiry: Date | null;
        value: number | null;
        condition: string | null;
        usefulLife: string | null;
        photoUrl: string | null;
        currentEmployeeId: string | null;
        purchaseDate: Date | null;
    }>;
    update(id: string, dto: UpdateAssetDto): Promise<{
        company: {
            id: string;
            name: string;
            code: string;
        };
        branch: {
            id: string;
            name: string;
            code: string;
        } | null;
        department: {
            id: string;
            name: string;
            code: string;
        } | null;
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
        name: string;
        category: string;
        updatedAt: Date;
        branchId: string | null;
        departmentId: string | null;
        status: import(".prisma/client").$Enums.AssetStatus;
        remarks: string | null;
        vendor: string | null;
        notes: string | null;
        assetTag: string;
        assetType: string | null;
        physicalLocation: string | null;
        invoiceNumber: string | null;
        poNumber: string | null;
        serialNumber: string | null;
        manufacturer: string | null;
        modelNumber: string | null;
        warrantyStart: Date | null;
        warrantyExpiry: Date | null;
        value: number | null;
        condition: string | null;
        usefulLife: string | null;
        photoUrl: string | null;
        currentEmployeeId: string | null;
        purchaseDate: Date | null;
    }>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
    allocate(id: string, dto: AllocateAssetDto): Promise<{
        company: {
            id: string;
            name: string;
            code: string;
        };
        branch: {
            id: string;
            name: string;
            code: string;
        } | null;
        department: {
            id: string;
            name: string;
            code: string;
        } | null;
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
        name: string;
        category: string;
        updatedAt: Date;
        branchId: string | null;
        departmentId: string | null;
        status: import(".prisma/client").$Enums.AssetStatus;
        remarks: string | null;
        vendor: string | null;
        notes: string | null;
        assetTag: string;
        assetType: string | null;
        physicalLocation: string | null;
        invoiceNumber: string | null;
        poNumber: string | null;
        serialNumber: string | null;
        manufacturer: string | null;
        modelNumber: string | null;
        warrantyStart: Date | null;
        warrantyExpiry: Date | null;
        value: number | null;
        condition: string | null;
        usefulLife: string | null;
        photoUrl: string | null;
        currentEmployeeId: string | null;
        purchaseDate: Date | null;
    }>;
    returnAsset(id: string, dto?: ReturnAssetDto): Promise<{
        company: {
            id: string;
            name: string;
            code: string;
        };
        branch: {
            id: string;
            name: string;
            code: string;
        } | null;
        department: {
            id: string;
            name: string;
            code: string;
        } | null;
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
        name: string;
        category: string;
        updatedAt: Date;
        branchId: string | null;
        departmentId: string | null;
        status: import(".prisma/client").$Enums.AssetStatus;
        remarks: string | null;
        vendor: string | null;
        notes: string | null;
        assetTag: string;
        assetType: string | null;
        physicalLocation: string | null;
        invoiceNumber: string | null;
        poNumber: string | null;
        serialNumber: string | null;
        manufacturer: string | null;
        modelNumber: string | null;
        warrantyStart: Date | null;
        warrantyExpiry: Date | null;
        value: number | null;
        condition: string | null;
        usefulLife: string | null;
        photoUrl: string | null;
        currentEmployeeId: string | null;
        purchaseDate: Date | null;
    }>;
}
