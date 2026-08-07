import { PayrollRunStatus } from '@prisma/client';
import { IsEnum, IsInt, IsString, Max, Min } from 'class-validator';

export class CreatePayrollRunDto {
  @IsString()
  companyId: string;

  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsInt()
  @Min(2000)
  year: number;
}

export class UpdatePayrollRunStatusDto {
  @IsEnum(PayrollRunStatus)
  status: PayrollRunStatus;
}
