export declare class CreatePayGradeDto {
    companyId: string;
    businessUnit?: string;
    gradeCode: string;
    gradeName: string;
    level?: string;
    category?: string;
    jobFamily?: string;
    departmentId?: string;
    minSalary?: number;
    maxSalary?: number;
    currency?: string;
    effectiveFrom?: string;
    description?: string;
    isActive?: boolean;
}
export declare class UpdatePayGradeDto {
    businessUnit?: string;
    gradeName?: string;
    level?: string;
    category?: string;
    jobFamily?: string;
    departmentId?: string;
    minSalary?: number;
    maxSalary?: number;
    currency?: string;
    effectiveFrom?: string;
    description?: string;
    isActive?: boolean;
}
