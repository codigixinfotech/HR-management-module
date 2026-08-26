import { AssetMaintenanceService } from './asset-maintenance.service';
import { CreateAssetMaintenanceDto, CompleteAssetMaintenanceDto } from './dto/asset-maintenance.dto';
export declare class AssetMaintenanceController {
    private readonly assetMaintenanceService;
    constructor(assetMaintenanceService: AssetMaintenanceService);
    list(assetId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        asset: {
            company: {
                id: string;
                name: string;
            };
            branch: {
                id: string;
                name: string;
            } | null;
            department: {
                id: string;
                name: string;
            } | null;
            id: string;
            name: string;
            category: string;
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
        priority: string | null;
        startDate: Date;
        vendor: string | null;
        notes: string | null;
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
    })[]>;
    create(dto: CreateAssetMaintenanceDto): Promise<{
        id: string;
        createdAt: Date;
        priority: string | null;
        startDate: Date;
        vendor: string | null;
        notes: string | null;
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
    }>;
    complete(id: string, dto?: CompleteAssetMaintenanceDto): Promise<{
        id: string;
        createdAt: Date;
        priority: string | null;
        startDate: Date;
        vendor: string | null;
        notes: string | null;
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
    }>;
}
