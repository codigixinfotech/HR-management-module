export declare class CreateHrPolicyDto {
    companyId?: string;
    policyCode: string;
    title: string;
    category?: string;
    description?: string;
    version?: string;
    documentUrl?: string;
    fileSize?: string;
    color?: string;
    esignRequirement?: boolean;
    status?: string;
    totalEmployees?: number;
    signedCount?: number;
    createdBy?: string;
}
export declare class UpdateHrPolicyDto {
    policyCode?: string;
    title?: string;
    category?: string;
    description?: string;
    version?: string;
    documentUrl?: string;
    fileSize?: string;
    color?: string;
    esignRequirement?: boolean;
    status?: string;
    totalEmployees?: number;
    signedCount?: number;
    updatedBy?: string;
}
export declare class CreatePolicyVersionDto {
    version: string;
    title?: string;
    description?: string;
    documentUrl?: string;
    fileSize?: string;
    esignRequirement?: boolean;
    updatedBy?: string;
}
