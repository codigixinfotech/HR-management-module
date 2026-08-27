import { AssetMaintenanceService } from './asset-maintenance.service';
import { CreateAssetMaintenanceDto, CompleteAssetMaintenanceDto } from './dto/asset-maintenance.dto';
export declare class AssetMaintenanceController {
    private readonly assetMaintenanceService;
    constructor(assetMaintenanceService: AssetMaintenanceService);
    list(assetId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        asset: {
            id: string;
            company: {
                id: string;
                name: string;
            };
            name: string;
            category: string;
            branch: {
                id: string;
                name: string;
            } | null;
            department: {
                id: string;
                name: string;
            } | null;
            assetTag: string;
            serialNumber: string | null;
            currentEmployee: {
                id: string;
                employeeCode: string;
                firstName: string;
                lastName: string;
            } | null;
        };
    } & {
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
    })[]>;
    create(dto: CreateAssetMaintenanceDto): Promise<{
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
    }>;
    complete(id: string, dto?: CompleteAssetMaintenanceDto): Promise<{
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
    }>;
}
