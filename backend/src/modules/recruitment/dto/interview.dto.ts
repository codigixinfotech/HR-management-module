import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  Max,
  IsObject,
} from 'class-validator';

export class CreateInterviewDto {
  @IsString()
  @IsNotEmpty()
  candidateId: string;

  @IsString()
  @IsOptional()
  jobOpeningId?: string;

  @IsString()
  @IsNotEmpty()
  position: string;

  @IsString()
  @IsOptional()
  requisitionCode?: string;

  @IsString()
  @IsNotEmpty()
  interviewDate: string; // ISO date string

  @IsString()
  @IsNotEmpty()
  startTime: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  interviewFormat?: string; // 'Google Meet' | 'On-site' | 'Phone' | 'Microsoft Teams'

  @IsString()
  @IsOptional()
  meetingLink?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsNotEmpty()
  panelMemberIds: string[]; // List of Employee IDs for mandatory panel members

  @IsObject()
  @IsOptional()
  panelMemberRoles?: Record<string, string>; // e.g. { 'emp-1': 'Technical Interviewer' }

  @IsString()
  @IsOptional()
  createdById?: string;

  @IsString()
  @IsOptional()
  createdByName?: string;
}

export class UpdateInterviewScheduleDto {
  @IsString()
  @IsOptional()
  interviewDate?: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsString()
  @IsOptional()
  interviewFormat?: string;

  @IsString()
  @IsOptional()
  meetingLink?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsOptional()
  panelMemberIds?: string[];

  @IsObject()
  @IsOptional()
  panelMemberRoles?: Record<string, string>;
}

export class UpdateInterviewStatusDto {
  @IsString()
  @IsNotEmpty()
  status: string; // 'READY_TO_SCHEDULE' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'EVALUATION_PENDING' | 'EVALUATED' | 'CANCELLED' | 'RESCHEDULED'

  @IsString()
  @IsOptional()
  remarks?: string;
}

export class SubmitEvaluationDto {
  @IsString()
  @IsNotEmpty()
  interviewerId: string;

  @IsString()
  @IsOptional()
  interviewerName?: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  technicalSkills: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  communication: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  problemSolving: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  relevantExperience: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  roleKnowledge: number;

  @IsString()
  @IsOptional()
  strengths?: string;

  @IsString()
  @IsOptional()
  weaknesses?: string;

  @IsString()
  @IsOptional()
  interviewNotes?: string;

  @IsString()
  @IsNotEmpty()
  recommendation: string; // 'Strong Hire' | 'Hire' | 'Hold' | 'Reject'
}
