export declare class CreateTaskDto {
    title: string;
    description?: string;
    taskType?: string;
    departmentName?: string;
    projectName?: string;
    priority?: string;
    assignedToId: string;
    assignedById?: string;
    startDate?: string;
    dueDate?: string;
    estimatedHours?: number;
    attachments?: string;
    instructions?: string;
    managerRemarks?: string;
}
export declare class UpdateTaskProgressDto {
    progress: number;
    status?: string;
    remarks?: string;
    actualHours?: number;
    completionAttachment?: string;
    updatedBy?: string;
}
export declare class CompleteTaskDto {
    completionRemarks: string;
    actualHours?: number;
    completionAttachment?: string;
    completedBy?: string;
}
export declare class ReviewTaskDto {
    action: 'APPROVE' | 'SEND_BACK' | 'REOPEN';
    remarks?: string;
    reviewedBy?: string;
}
export declare class CreateTaskRequestDto {
    requestTitle: string;
    requestType?: string;
    description?: string;
    priority?: string;
    requestedById: string;
}
export declare class ReviewTaskRequestDto {
    action: 'APPROVE' | 'REJECT' | 'CONVERT_TO_TASK';
    remarks?: string;
    assignedToId?: string;
    reviewedBy?: string;
}
