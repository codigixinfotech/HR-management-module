import { IsBoolean, IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTravelBookingDto {
  @IsOptional()
  @IsString()
  bookingCode?: string;

  @IsString()
  companyId: string;

  @IsString()
  employeeId: string;

  @IsOptional()
  @IsString()
  departmentId?: string;

  @IsOptional()
  @IsString()
  designationId?: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  costCenterId?: string;

  @IsOptional()
  @IsString()
  gradeId?: string;

  @IsOptional()
  @IsString()
  reportingManagerId?: string;

  @IsString()
  purpose: string;

  @IsOptional()
  @IsString()
  travelType?: string;

  @IsString()
  fromLocation: string;

  @IsString()
  toLocation: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  travelMode?: string;

  @IsOptional()
  @IsBoolean()
  accommodationRequired?: boolean;

  @IsOptional()
  @IsString()
  hotelDetails?: string;

  @IsOptional()
  @IsNumber()
  estimatedTravelCost?: number;

  @IsOptional()
  @IsNumber()
  estimatedHotelCost?: number;

  @IsOptional()
  @IsNumber()
  estimatedFoodCost?: number;

  @IsOptional()
  @IsNumber()
  estimatedLocalTransport?: number;

  @IsOptional()
  @IsNumber()
  otherCost?: number;

  @IsOptional()
  @IsBoolean()
  advanceRequired?: boolean;

  @IsOptional()
  @IsNumber()
  advanceAmount?: number;

  @IsOptional()
  @IsString()
  advanceRemarks?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  attachments?: any;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateTravelStatusDto {
  @IsString()
  action: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  userName?: string;
}

export class CreateExpenseClaimDto {
  @IsOptional()
  @IsString()
  travelBookingId?: string;

  @IsString()
  companyId: string;

  @IsString()
  employeeId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
