import { PartialType } from '@nestjs/mapped-types';
import { IsDateString, IsNumber, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

export class CreateAssetDto {
  @IsString({ message: 'Company / Entity is required.' })
  companyId: string;

  @IsOptional()
  @IsString()
  assetTag?: string;

  @IsString({ message: 'Asset Name is required.' })
  @MinLength(3, { message: 'Asset Name must be between 3 and 100 characters.' })
  @MaxLength(100, { message: 'Asset Name must be between 3 and 100 characters.' })
  name: string;

  @IsString({ message: 'Asset Category is required.' })
  category: string;

  @IsOptional()
  @IsString({ message: 'Asset Type is required.' })
  assetType?: string;

  @IsOptional()
  @IsString({ message: 'Branch / Location is required.' })
  branchId?: string;

  @IsOptional()
  @IsString({ message: 'Department is required.' })
  departmentId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'Physical Location cannot exceed 200 characters.' })
  physicalLocation?: string;

  @IsOptional()
  @IsString()
  vendor?: string;

  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @IsOptional()
  @IsString()
  poNumber?: string;

  @IsOptional()
  @IsString()
  serialNumber?: string;

  @IsOptional()
  @IsString()
  manufacturer?: string;

  @IsOptional()
  @IsString()
  modelNumber?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Please enter a valid purchase cost.' })
  @Min(0.01, { message: 'Purchase Cost must be greater than 0.' })
  value?: number;

  @IsOptional()
  @IsDateString({}, { message: 'Purchase Date is required.' })
  purchaseDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Warranty Start Date is invalid.' })
  warrantyStart?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Warranty End Date is invalid.' })
  warrantyExpiry?: string;

  @IsOptional()
  @IsString({ message: 'Asset Status is required.' })
  status?: string;

  @IsOptional()
  @IsString({ message: 'Asset Condition is required.' })
  condition?: string;

  @IsOptional()
  @IsString()
  usefulLife?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Description cannot exceed 500 characters.' })
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Remarks cannot exceed 500 characters.' })
  remarks?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}

export class UpdateAssetDto extends PartialType(CreateAssetDto) {}

export class AllocateAssetDto {
  @IsString({ message: 'Employee is required.' })
  employeeId: string;

  @IsOptional()
  @IsDateString({}, { message: 'Allocation Date is invalid.' })
  allocationDate?: string;

  @IsOptional()
  @IsString()
  allocationType?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Expected Return Date is invalid.' })
  expectedReturnDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Remarks cannot exceed 500 characters.' })
  remarks?: string;
}

export class ReturnAssetDto {
  @IsOptional()
  @IsDateString({}, { message: 'Return Date is invalid.' })
  returnDate?: string;

  @IsString({ message: 'Return Reason is required.' })
  returnReason: string;

  @IsOptional()
  @IsString()
  otherReason?: string;

  @IsOptional()
  @IsString()
  returnedBy?: string;

  @IsOptional()
  @IsString()
  returnLocation?: string;

  @IsString({ message: 'Asset Condition is required.' })
  condition: string;

  @IsOptional()
  @IsString()
  accessoriesReturned?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Remarks cannot exceed 500 characters.' })
  remarks?: string;
}
