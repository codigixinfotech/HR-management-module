import { PartialType } from '@nestjs/mapped-types';
import { EmployeeStatus, EmploymentType, Gender } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class ListEmployeesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  companyId?: string;
}

export class CreateEmployeeDto {
  @IsString()
  companyId: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  designationId?: string;

  @IsOptional()
  @IsString()
  reportingManagerId?: string;

  @IsString()
  employeeCode: string;

  @IsString()
  firstName: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  personalEmail?: string;

  @IsOptional()
  @IsString()
  workEmail?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  dateOfJoining?: string;

  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @IsOptional()
  @IsString()
  businessUnit?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsString()
  shift?: string;

  @IsOptional()
  @IsString()
  costCenter?: string;

  @IsOptional()
  @IsString()
  employeeCategory?: string;

  @IsOptional()
  @IsString()
  workPhone?: string;

  @IsOptional()
  @IsString()
  workMode?: string;

  @IsOptional()
  @IsString()
  probationPeriod?: string;

  @IsOptional()
  @IsDateString()
  confirmationDate?: string;

  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  emergencyContactRelationship?: string;

  @IsOptional()
  @IsString()
  addressLine1?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  pincode?: string;

  @IsOptional()
  @IsString()
  maritalStatus?: string;

  @IsOptional()
  @IsString()
  nationality?: string;

  @IsOptional()
  @IsString()
  bloodGroup?: string;

  @IsOptional()
  @IsString()
  religion?: string;

  @IsOptional()
  @IsString()
  currentAddress?: string;

  @IsOptional()
  @IsString()
  permanentAddress?: string;

  @IsOptional()
  @IsString()
  familyMemberName?: string;

  @IsOptional()
  @IsString()
  familyRelationship?: string;

  @IsOptional()
  @IsDateString()
  familyDob?: string;

  @IsOptional()
  @IsString()
  familyContact?: string;

  @IsOptional()
  @IsString()
  nomineeName?: string;

  @IsOptional()
  @IsString()
  nomineeRelationship?: string;

  @IsOptional()
  @IsNumber()
  nomineeShare?: number;

  @IsOptional()
  @IsString()
  educationQualification?: string;

  @IsOptional()
  @IsString()
  educationSpecialization?: string;

  @IsOptional()
  @IsString()
  educationInstitution?: string;

  @IsOptional()
  @IsString()
  educationUniversity?: string;

  @IsOptional()
  @IsNumber()
  educationPassingYear?: number;

  @IsOptional()
  @IsNumber()
  educationPercentage?: number;

  @IsOptional()
  @IsString()
  prevCompany?: string;

  @IsOptional()
  @IsString()
  prevJobTitle?: string;

  @IsOptional()
  @IsDateString()
  prevStartDate?: string;

  @IsOptional()
  @IsDateString()
  prevEndDate?: string;

  @IsOptional()
  @IsString()
  prevTotalExp?: string;

  @IsOptional()
  @IsString()
  prevReasonForLeaving?: string;

  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @IsOptional()
  @IsString()
  bankIfscCode?: string;

  @IsOptional()
  @IsString()
  bankBranchName?: string;

  @IsOptional()
  @IsString()
  bankAccountHolderName?: string;

  @IsOptional()
  @IsString()
  aadhaarNumber?: string;

  @IsOptional()
  @IsString()
  panNumber?: string;

  @IsOptional()
  @IsString()
  passportNumber?: string;

  @IsOptional()
  @IsString()
  kycStatus?: string;

  @IsOptional()
  @IsDateString()
  kycVerificationDate?: string;

  @IsOptional()
  @IsString()
  uanNumber?: string;

  @IsOptional()
  @IsString()
  pfMemberId?: string;

  @IsOptional()
  @IsString()
  esicNumber?: string;

  @IsOptional()
  @IsBoolean()
  pfApplicable?: boolean;

  @IsOptional()
  @IsBoolean()
  esicApplicable?: boolean;

  @IsOptional()
  @IsDateString()
  pfEsicJoiningDate?: string;

  @IsOptional()
  @IsString()
  salaryGrade?: string;

  @IsOptional()
  @IsString()
  salaryBand?: string;

  @IsOptional()
  @IsNumber()
  basicSalary?: number;

  @IsOptional()
  @IsNumber()
  hra?: number;

  @IsOptional()
  @IsNumber()
  conveyance?: number;

  @IsOptional()
  @IsNumber()
  specialAllowance?: number;

  @IsOptional()
  @IsNumber()
  otherAllowances?: number;

  @IsOptional()
  @IsNumber()
  grossSalary?: number;

  @IsOptional()
  @IsNumber()
  annualCtc?: number;

  @IsOptional()
  @IsDateString()
  salaryEffectiveFrom?: string;

  @IsOptional()
  @IsString()
  faceTemplate?: string;

  @IsOptional()
  @IsString()
  facePhoto?: string;

  @IsOptional()
  @IsDateString()
  faceRegisteredAt?: string;

  @IsOptional()
  @IsString()
  faceRegisteredBy?: string;
}

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {}
