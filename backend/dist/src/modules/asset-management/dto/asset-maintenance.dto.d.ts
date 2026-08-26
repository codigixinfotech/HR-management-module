export declare class CreateAssetMaintenanceDto {
    assetId: string;
    issue: string;
    priority?: string;
    maintenanceType?: string;
    vendor?: string;
    warrantyClaim?: boolean;
    startDate: string;
    cost?: number;
    notes?: string;
}
export declare class CompleteAssetMaintenanceDto {
    completionDate?: string;
    finalCondition?: string;
    actualCost?: number;
    vendor?: string;
    workPerformed?: string;
    partsUsed?: string;
    qcStatus?: string;
    repairNotes?: string;
}
