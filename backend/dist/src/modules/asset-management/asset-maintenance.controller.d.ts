import { AssetMaintenanceService } from './asset-maintenance.service';
import { CreateAssetMaintenanceDto } from './dto/asset-maintenance.dto';
export declare class AssetMaintenanceController {
    private readonly assetMaintenanceService;
    constructor(assetMaintenanceService: AssetMaintenanceService);
    list(assetId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        asset: {
            id: string;
            name: string;
            assetTag: string;
        };
    } & {
        startDate: Date;
        id: string;
        createdAt: Date;
        endDate: Date | null;
        assetId: string;
        issue: string;
        cost: number | null;
    })[]>;
    create(dto: CreateAssetMaintenanceDto): Promise<{
        startDate: Date;
        id: string;
        createdAt: Date;
        endDate: Date | null;
        assetId: string;
        issue: string;
        cost: number | null;
    }>;
    complete(id: string): Promise<{
        startDate: Date;
        id: string;
        createdAt: Date;
        endDate: Date | null;
        assetId: string;
        issue: string;
        cost: number | null;
    }>;
}
