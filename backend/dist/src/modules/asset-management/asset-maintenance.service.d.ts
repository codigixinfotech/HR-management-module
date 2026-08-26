import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAssetMaintenanceDto, CompleteAssetMaintenanceDto } from './dto/asset-maintenance.dto';
export declare class AssetMaintenanceService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(assetId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        asset: {
            id: string;
            company: {
                id: string;
                name: string;
            };
            department: {
                id: string;
                name: string;
            } | null;
            name: string;
            branch: {
                id: string;
                name: string;
            } | null;
            category: string;
            assetTag: string;
            serialNumber: string | null;
            currentEmployee: {
                id: string;
                firstName: string;
                lastName: string;
                employeeCode: string;
            } | null;
        };
    } & {
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
    })[]>;
    create(dto: CreateAssetMaintenanceDto): Promise<{
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
    }>;
    complete(id: string, dto?: CompleteAssetMaintenanceDto): Promise<{
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
    }>;
}
