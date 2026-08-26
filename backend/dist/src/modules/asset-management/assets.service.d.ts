import { PrismaService } from '../../common/prisma/prisma.service';
import { AllocateAssetDto, CreateAssetDto, ReturnAssetDto, UpdateAssetDto } from './dto/asset.dto';
export declare class AssetsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private readonly listInclude;
    list(companyId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        company: {
            id: string;
            code: string;
            name: string;
        };
        department: {
            id: string;
            code: string;
            name: string;
        } | null;
        branch: {
            id: string;
            code: string;
            name: string;
        } | null;
        currentEmployee: {
            id: string;
            firstName: string;
            lastName: string;
            employeeCode: string;
        } | null;
    } & {
        companyId: string;
        departmentId: string | null;
        status: import(".prisma/client").$Enums.AssetStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        branchId: string | null;
        name: string;
        notes: string | null;
        remarks: string | null;
        category: string;
        assetTag: string;
        assetType: string | null;
        physicalLocation: string | null;
        vendor: string | null;
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
            code: string;
            name: string;
        };
        department: {
            id: string;
            code: string;
            name: string;
        } | null;
        branch: {
            id: string;
            code: string;
            name: string;
        } | null;
        currentEmployee: {
            id: string;
            firstName: string;
            lastName: string;
            employeeCode: string;
        } | null;
        allocations: ({
            employee: {
                id: string;
                firstName: string;
                lastName: string;
                employeeCode: string;
            };
        } & {
            id: string;
            location: string | null;
            remarks: string | null;
            employeeId: string;
            assetId: string;
            allocationType: string | null;
            allocatedAt: Date;
            expectedReturnDate: Date | null;
            returnedAt: Date | null;
            returnReason: string | null;
            returnedBy: string | null;
            returnLocation: string | null;
            conditionOnReturn: string | null;
            accessoriesReturned: string | null;
        })[];
        maintenanceLogs: {
            priority: string | null;
            id: string;
            createdAt: Date;
            notes: string | null;
            startDate: Date;
            vendor: string | null;
            endDate: Date | null;
            assetId: string;
            workOrderNumber: string | null;
            issue: string;
            maintenanceType: string | null;
            warrantyClaim: boolean;
            cost: number | null;
            finalCondition: string | null;
            workPerformed: string | null;
            partsUsed: string | null;
            qcStatus: string | null;
        }[];
    } & {
        companyId: string;
        departmentId: string | null;
        status: import(".prisma/client").$Enums.AssetStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        branchId: string | null;
        name: string;
        notes: string | null;
        remarks: string | null;
        category: string;
        assetTag: string;
        assetType: string | null;
        physicalLocation: string | null;
        vendor: string | null;
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
            code: string;
            name: string;
        };
        department: {
            id: string;
            code: string;
            name: string;
        } | null;
        branch: {
            id: string;
            code: string;
            name: string;
        } | null;
        currentEmployee: {
            id: string;
            firstName: string;
            lastName: string;
            employeeCode: string;
        } | null;
    } & {
        companyId: string;
        departmentId: string | null;
        status: import(".prisma/client").$Enums.AssetStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        branchId: string | null;
        name: string;
        notes: string | null;
        remarks: string | null;
        category: string;
        assetTag: string;
        assetType: string | null;
        physicalLocation: string | null;
        vendor: string | null;
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
            code: string;
            name: string;
        };
        department: {
            id: string;
            code: string;
            name: string;
        } | null;
        branch: {
            id: string;
            code: string;
            name: string;
        } | null;
        currentEmployee: {
            id: string;
            firstName: string;
            lastName: string;
            employeeCode: string;
        } | null;
    } & {
        companyId: string;
        departmentId: string | null;
        status: import(".prisma/client").$Enums.AssetStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        branchId: string | null;
        name: string;
        notes: string | null;
        remarks: string | null;
        category: string;
        assetTag: string;
        assetType: string | null;
        physicalLocation: string | null;
        vendor: string | null;
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
            code: string;
            name: string;
        };
        department: {
            id: string;
            code: string;
            name: string;
        } | null;
        branch: {
            id: string;
            code: string;
            name: string;
        } | null;
        currentEmployee: {
            id: string;
            firstName: string;
            lastName: string;
            employeeCode: string;
        } | null;
    } & {
        companyId: string;
        departmentId: string | null;
        status: import(".prisma/client").$Enums.AssetStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        branchId: string | null;
        name: string;
        notes: string | null;
        remarks: string | null;
        category: string;
        assetTag: string;
        assetType: string | null;
        physicalLocation: string | null;
        vendor: string | null;
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
            code: string;
            name: string;
        };
        department: {
            id: string;
            code: string;
            name: string;
        } | null;
        branch: {
            id: string;
            code: string;
            name: string;
        } | null;
        currentEmployee: {
            id: string;
            firstName: string;
            lastName: string;
            employeeCode: string;
        } | null;
    } & {
        companyId: string;
        departmentId: string | null;
        status: import(".prisma/client").$Enums.AssetStatus;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        branchId: string | null;
        name: string;
        notes: string | null;
        remarks: string | null;
        category: string;
        assetTag: string;
        assetType: string | null;
        physicalLocation: string | null;
        vendor: string | null;
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
