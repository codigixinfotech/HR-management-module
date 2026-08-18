export declare class CreateCompanyDto {
    code: string;
    name: string;
    legalName?: string;
    shortName?: string;
    entityType?: string;
    parentCompanyId?: string;
    cin?: string;
    gst?: string;
    pan?: string;
    tan?: string;
    msme?: string;
    country: string;
    state?: string;
    city?: string;
    timezone?: string;
    currency: string;
    registeredAddress?: string;
    pincode?: string;
    email?: string;
    phone?: string;
    website?: string;
    businessUnit?: string;
    defaultBranchId?: string;
    isActive?: boolean;
}
declare const UpdateCompanyDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateCompanyDto>>;
export declare class UpdateCompanyDto extends UpdateCompanyDto_base {
}
export {};
