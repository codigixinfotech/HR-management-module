import { IsDateString, IsNumber, IsString, Min } from 'class-validator';

export class AssignSalaryComponentDto {
  @IsString()
  employeeId: string;

  @IsString()
  salaryComponentId: string;

  @IsNumber()
  @Min(0)
  monthlyAmount: number;

  @IsDateString()
  effectiveFrom: string;
}
