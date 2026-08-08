export declare class CreateLocationDto {
    branchId: string;
    code: string;
    name: string;
    buildingName?: string;
    floor?: string;
    wing?: string;
    roomCabin?: string;
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
    gps?: string;
    workingHours?: string;
    shift?: string;
    isActive?: boolean;
}
declare const UpdateLocationDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateLocationDto>>;
export declare class UpdateLocationDto extends UpdateLocationDto_base {
}
export {};
