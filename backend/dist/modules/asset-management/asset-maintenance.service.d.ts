import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAssetMaintenanceDto } from './dto/asset-maintenance.dto';
export declare class AssetMaintenanceService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(assetId?: string): import("@prisma/client").Prisma.PrismaPromise<({
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
