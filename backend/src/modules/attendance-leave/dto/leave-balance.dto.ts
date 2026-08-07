import { IsInt, IsNumber, IsString, Min } from 'class-validator';

export class AllocateLeaveBalanceDto {
  @IsString()
  employeeId: string;

  @IsString()
  leaveTypeId: string;

  @IsInt()
  year: number;

  @IsNumber()
  @Min(0)
  allocated: number;
}
