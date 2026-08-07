import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateOnboardingTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  ownerType: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
