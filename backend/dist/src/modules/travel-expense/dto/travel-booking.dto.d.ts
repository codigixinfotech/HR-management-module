export declare class CreateTravelBookingDto {
    bookingCode?: string;
    companyId: string;
    employeeId: string;
    departmentId?: string;
    designationId?: string;
    branchId?: string;
    costCenterId?: string;
    gradeId?: string;
    reportingManagerId?: string;
    purpose: string;
    travelType?: string;
    fromLocation: string;
    toLocation: string;
    startDate: string;
    endDate: string;
    travelMode?: string;
    accommodationRequired?: boolean;
    hotelDetails?: string;
    estimatedTravelCost?: number;
    estimatedHotelCost?: number;
    estimatedFoodCost?: number;
    estimatedLocalTransport?: number;
    otherCost?: number;
    advanceRequired?: boolean;
    advanceAmount?: number;
    advanceRemarks?: string;
    remarks?: string;
    attachments?: any;
    status?: string;
}
export declare class UpdateTravelStatusDto {
    action: string;
    remarks?: string;
    rejectionReason?: string;
    userId?: string;
    userName?: string;
}
export declare class CreateExpenseClaimDto {
    travelBookingId?: string;
    companyId: string;
    employeeId: string;
    title: string;
    category?: string;
    amount: number;
    date?: string;
    receiptUrl?: string;
    remarks?: string;
}
