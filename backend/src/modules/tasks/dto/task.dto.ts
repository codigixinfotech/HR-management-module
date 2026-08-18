import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  taskType?: string;

  @IsOptional()
  @IsString()
  departmentName?: string;

  @IsOptional()
  @IsString()
  projectName?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsString()
  assignedToId: string;

  @IsOptional()
  @IsString()
  assignedById?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  estimatedHours?: number;

  @IsOptional()
  @IsString()
  attachments?: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsString()
  managerRemarks?: string;
}

export class UpdateTaskProgressDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  progress: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  actualHours?: number;

  @IsOptional()
  @IsString()
  completionAttachment?: string;

  @IsOptional()
  @IsString()
  updatedBy?: string;
}

export class CompleteTaskDto {
  @IsString()
  completionRemarks: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  actualHours?: number;

  @IsOptional()
  @IsString()
  completionAttachment?: string;

  @IsOptional()
  @IsString()
  completedBy?: string;
}

export class ReviewTaskDto {
  @IsString()
  action: 'APPROVE' | 'SEND_BACK' | 'REOPEN';

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  reviewedBy?: string;
}

export class CreateTaskRequestDto {
  @IsString()
  requestTitle: string;

  @IsOptional()
  @IsString()
  requestType?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  priority?: string;

  @IsString()
  requestedById: string;
}

export class ReviewTaskRequestDto {
  @IsString()
  action: 'APPROVE' | 'REJECT' | 'CONVERT_TO_TASK';

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsString()
  reviewedBy?: string;
}
