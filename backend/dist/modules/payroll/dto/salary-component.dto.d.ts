import { SalaryComponentType } from '@prisma/client';
export declare class CreateSalaryComponentDto {
    companyId: string;
    code: string;
    name: string;
    type: SalaryComponentType;
    isStatutory?: boolean;
    isActive?: boolean;
}
declare const UpdateSalaryComponentDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateSalaryComponentDto>>;
export declare class UpdateSalaryComponentDto extends UpdateSalaryComponentDto_base {
}
export {};
