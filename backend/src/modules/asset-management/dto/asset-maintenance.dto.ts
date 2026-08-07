import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAssetMaintenanceDto {
  @IsString()
  assetId: string;

  @IsString()
  issue: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsNumber()
  cost?: number;
}
