export declare class CreateExitDto {
    employeeId: string;
    resignationDate: string;
    noticePeriodDays?: number;
    lastWorkingDay: string;
    exitType?: string;
    exitReason: string;
    resignationLetterUrl?: string;
    remarks?: string;
    companyId?: string;
}
export declare class UpdateExitStatusDto {
    status: string;
    remarks?: string;
    performedBy?: string;
}
export declare class AdjustLwdDto {
    adjustedLwd: string;
    reason: string;
    performedBy?: string;
}
export declare class UpdateClearanceItemDto {
    status: string;
    remarks?: string;
    verifiedBy?: string;
}
export declare class SaveExitInterviewDto {
    primaryReason: string;
    secondaryReason?: string;
    managerFeedback?: string;
    employeeFeedback?: string;
    workEnvironmentRating?: number;
    compensationRating?: number;
    recommendCompany?: boolean;
    rehireEligible?: boolean;
    hrRemarks?: string;
}
export declare class SaveFnfSettlementDto {
    salaryPayable?: number;
    leaveEncashment?: number;
    incentives?: number;
    reimbursements?: number;
    noticeRecovery?: number;
    loanAdvanceRecovery?: number;
    assetRecovery?: number;
    otherDeductions?: number;
    status?: string;
    remarks?: string;
    approvedBy?: string;
}
