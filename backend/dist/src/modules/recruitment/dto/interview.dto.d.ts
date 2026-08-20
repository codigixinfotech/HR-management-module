export declare class CreateInterviewDto {
    candidateId: string;
    jobOpeningId?: string;
    position: string;
    requisitionCode?: string;
    interviewDate: string;
    startTime: string;
    endTime?: string;
    interviewFormat?: string;
    meetingLink?: string;
    notes?: string;
    panelMemberIds: string[];
    panelMemberRoles?: Record<string, string>;
    createdById?: string;
    createdByName?: string;
}
export declare class UpdateInterviewScheduleDto {
    interviewDate?: string;
    startTime?: string;
    endTime?: string;
    interviewFormat?: string;
    meetingLink?: string;
    notes?: string;
    panelMemberIds?: string[];
    panelMemberRoles?: Record<string, string>;
}
export declare class UpdateInterviewStatusDto {
    status: string;
    remarks?: string;
}
export declare class SubmitEvaluationDto {
    interviewerId: string;
    interviewerName?: string;
    technicalSkills: number;
    communication: number;
    problemSolving: number;
    relevantExperience: number;
    roleKnowledge: number;
    strengths?: string;
    weaknesses?: string;
    interviewNotes?: string;
    recommendation: string;
}
