export declare class CreateCompanyDto {
    code: string;
    name: string;
    legalName?: string;
    country: string;
    currency: string;
    timezone?: string;
    isActive?: boolean;
}
declare const UpdateCompanyDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateCompanyDto>>;
export declare class UpdateCompanyDto extends UpdateCompanyDto_base {
}
export {};
