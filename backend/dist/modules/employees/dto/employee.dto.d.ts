import { EmployeeStatus, EmploymentType, Gender } from '@prisma/client';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
export declare class ListEmployeesQueryDto extends PaginationQueryDto {
    companyId?: string;
}
export declare class CreateEmployeeDto {
    companyId: string;
    branchId?: string;
    departmentId?: string;
    designationId?: string;
    reportingManagerId?: string;
    employeeCode: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    gender?: Gender;
    dateOfBirth?: string;
    personalEmail?: string;
    workEmail?: string;
    phone?: string;
    dateOfJoining?: string;
    employmentType?: EmploymentType;
    status?: EmployeeStatus;
    addressLine1?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
}
declare const UpdateEmployeeDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateEmployeeDto>>;
export declare class UpdateEmployeeDto extends UpdateEmployeeDto_base {
}
export {};
