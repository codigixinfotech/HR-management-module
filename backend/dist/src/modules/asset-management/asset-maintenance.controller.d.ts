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
        id: string;
        createdAt: Date;
        startDate: Date;
        endDate: Date | null;
        assetId: string;
        issue: string;
        cost: number | null;
    })[]>;
    create(dto: CreateAssetMaintenanceDto): Promise<{
        id: string;
        createdAt: Date;
        startDate: Date;
        endDate: Date | null;
        assetId: string;
        issue: string;
        cost: number | null;
    }>;
    complete(id: string): Promise<{
        id: string;
        createdAt: Date;
        startDate: Date;
        endDate: Date | null;
        assetId: string;
        issue: string;
        cost: number | null;
    }>;
}
