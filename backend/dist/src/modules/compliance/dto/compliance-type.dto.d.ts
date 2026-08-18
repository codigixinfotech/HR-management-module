import { ComplianceFrequency } from '@prisma/client';
export declare class CreateComplianceTypeDto {
    companyId: string;
    code: string;
    name: string;
    category: string;
    frequency: ComplianceFrequency;
    description?: string;
    isActive?: boolean;
}
declare const UpdateComplianceTypeDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateComplianceTypeDto>>;
export declare class UpdateComplianceTypeDto extends UpdateComplianceTypeDto_base {
}
export {};
