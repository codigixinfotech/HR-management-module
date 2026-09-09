import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  name!: string;

  @IsString()
  code!: string;

  @IsString()
  @IsOptional()
  type?: 'STANDARD_PLAN' | 'CUSTOM_PACKAGE' | 'ADD_ON';

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  badge?: string;

  @IsString()
  @IsOptional()
  billingCycle?: 'MONTHLY' | 'YEARLY' | 'ONE_TIME';

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsNumber()
  @IsOptional()
  monthlyPrice?: number;

  @IsNumber()
  @IsOptional()
  annualPrice?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  status?: 'ACTIVE' | 'INACTIVE' | 'DRAFT';

  @IsBoolean()
  @IsOptional()
  isPopular?: boolean;

  @IsNumber()
  @IsOptional()
  maxEmployees?: number;

  @IsNumber()
  @IsOptional()
  maxDepartments?: number;

  @IsNumber()
  @IsOptional()
  maxLocations?: number;

  @IsNumber()
  @IsOptional()
  maxStorageGb?: number;

  @IsNumber()
  @IsOptional()
  maxLmsLearners?: number;

  @IsArray()
  includedModules!: string[];

  @IsOptional()
  featureToggles?: Record<string, boolean>;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class UpdatePlanDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  type?: 'STANDARD_PLAN' | 'CUSTOM_PACKAGE' | 'ADD_ON';

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  badge?: string;

  @IsString()
  @IsOptional()
  billingCycle?: 'MONTHLY' | 'YEARLY' | 'ONE_TIME';

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsNumber()
  @IsOptional()
  monthlyPrice?: number;

  @IsNumber()
  @IsOptional()
  annualPrice?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  status?: 'ACTIVE' | 'INACTIVE' | 'DRAFT';

  @IsBoolean()
  @IsOptional()
  isPopular?: boolean;

  @IsNumber()
  @IsOptional()
  maxEmployees?: number;

  @IsNumber()
  @IsOptional()
  maxDepartments?: number;

  @IsNumber()
  @IsOptional()
  maxLocations?: number;

  @IsNumber()
  @IsOptional()
  maxStorageGb?: number;

  @IsNumber()
  @IsOptional()
  maxLmsLearners?: number;

  @IsArray()
  @IsOptional()
  includedModules?: string[];

  @IsOptional()
  featureToggles?: Record<string, boolean>;

  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class ChangeSubscriptionPlanDto {
  @IsString()
  planId!: string;

  @IsString()
  @IsOptional()
  billingCycle?: 'MONTHLY' | 'ANNUAL';

  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;
}

export class ManageSubscriptionAddonsDto {
  @IsArray()
  addonIds!: string[];
}

export class RenewSubscriptionDto {
  @IsNumber()
  @IsOptional()
  durationMonths?: number;
}

export class CreateSubscriptionDto {
  @IsString()
  companyId!: string;

  @IsString()
  planId!: string;

  @IsString()
  @IsOptional()
  billingCycle?: 'MONTHLY' | 'ANNUAL';

  @IsOptional()
  startDate?: string | Date;

  @IsOptional()
  endDate?: string | Date;

  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  paymentStatus?: 'PAID' | 'PENDING' | 'COMPLIMENTARY';

  @IsString()
  @IsOptional()
  paymentReference?: string;
}

export class SubscribeNewCompanyDto {
  // Company Details
  @IsString()
  companyName!: string;

  @IsString()
  companyCode!: string;

  @IsString()
  @IsOptional()
  industry?: string;

  @IsString()
  registeredAddress!: string;

  @IsString()
  contactPerson!: string;

  @IsString()
  companyEmail!: string;

  @IsString()
  contactPhone!: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsString()
  @IsOptional()
  currency?: string;

  // Admin Account
  @IsString()
  adminName!: string;

  @IsString()
  adminEmail!: string;

  @IsString()
  @IsOptional()
  adminPhone?: string;

  @IsString()
  @IsOptional()
  adminUsername?: string;

  @IsBoolean()
  @IsOptional()
  sendInvitation?: boolean;

  @IsArray()
  @IsOptional()
  invitationDelivery?: string[];

  // Subscription Details
  @IsString()
  planId!: string;

  @IsString()
  @IsOptional()
  billingCycle?: 'MONTHLY' | 'ANNUAL';

  @IsOptional()
  startDate?: string | Date;

  @IsOptional()
  endDate?: string | Date;

  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  paymentStatus?: 'PAID' | 'PENDING' | 'COMPLIMENTARY';

  @IsString()
  @IsOptional()
  paymentReference?: string;
}

