import { TravelExpenseService } from './travel-expense.service';
import { CreateExpenseClaimDto, CreateTravelBookingDto, UpdateTravelStatusDto } from './dto/travel-booking.dto';
export declare class TravelExpenseController {
    private readonly travelExpenseService;
    constructor(travelExpenseService: TravelExpenseService);
    getDashboardStats(companyId?: string): Promise<{
        ytdBudgetSpent: number;
        pendingClaimsCount: number;
        pendingClaimsAmount: number;
        reimbursedThisMonth: number;
        corporateCardSync: {
            connected: boolean;
            statusText: string;
            description: string;
        };
    }>;
    listBookings(companyId?: string, search?: string, status?: string, travelType?: string, departmentId?: string, employeeId?: string, startDate?: string, endDate?: string): Promise<({
        company: {
            id: string;
            name: string;
            code: string;
        };
        branch: {
            id: string;
            name: string;
            code: string;
        } | null;
        department: {
            id: string;
            name: string;
            code: string;
        } | null;
        designation: {
            id: string;
            title: string;
            code: string;
        } | null;
        employee: {
            id: string;
            firstName: string;
            lastName: string;
            employeeCode: string;
        };
        expenseClaims: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            title: string;
            remarks: string | null;
            employeeId: string;
            category: string;
            date: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            claimCode: string;
            travelBookingId: string | null;
            receiptUrl: string | null;
        }[];
        approvalHistory: {
            id: string;
            createdAt: Date;
            userId: string | null;
            action: string;
            remarks: string | null;
            travelBookingId: string;
            userName: string;
        }[];
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        branchId: string | null;
        departmentId: string | null;
        designationId: string | null;
        reportingManagerId: string | null;
        startDate: Date;
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
        rejectionReason: string | null;
        remarks: string | null;
        employeeId: string;
        endDate: Date;
        bookingCode: string;
        costCenterId: string | null;
        gradeId: string | null;
        purpose: string;
        travelType: string;
        fromLocation: string;
        toLocation: string;
        travelMode: string;
        accommodationRequired: boolean;
        hotelDetails: string | null;
        estimatedTravelCost: import("@prisma/client/runtime/library").Decimal;
        estimatedHotelCost: import("@prisma/client/runtime/library").Decimal;
        estimatedFoodCost: import("@prisma/client/runtime/library").Decimal;
        estimatedLocalTransport: import("@prisma/client/runtime/library").Decimal;
        otherCost: import("@prisma/client/runtime/library").Decimal;
        totalEstimatedCost: import("@prisma/client/runtime/library").Decimal;
        advanceRequired: boolean;
        advanceAmount: import("@prisma/client/runtime/library").Decimal | null;
        advanceRemarks: string | null;
    })[]>;
    getBooking(id: string): Promise<{
        company: {
            id: string;
            name: string;
            code: string;
        };
        branch: {
            id: string;
            name: string;
            code: string;
        } | null;
        department: {
            id: string;
            name: string;
            code: string;
        } | null;
        designation: {
            id: string;
            title: string;
            code: string;
        } | null;
        employee: {
            id: string;
            firstName: string;
            lastName: string;
            employeeCode: string;
        };
        expenseClaims: {
            id: string;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            companyId: string;
            title: string;
            remarks: string | null;
            employeeId: string;
            category: string;
            date: Date;
            amount: import("@prisma/client/runtime/library").Decimal;
            claimCode: string;
            travelBookingId: string | null;
            receiptUrl: string | null;
        }[];
        approvalHistory: {
            id: string;
            createdAt: Date;
            userId: string | null;
            action: string;
            remarks: string | null;
            travelBookingId: string;
            userName: string;
        }[];
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        branchId: string | null;
        departmentId: string | null;
        designationId: string | null;
        reportingManagerId: string | null;
        startDate: Date;
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
        rejectionReason: string | null;
        remarks: string | null;
        employeeId: string;
        endDate: Date;
        bookingCode: string;
        costCenterId: string | null;
        gradeId: string | null;
        purpose: string;
        travelType: string;
        fromLocation: string;
        toLocation: string;
        travelMode: string;
        accommodationRequired: boolean;
        hotelDetails: string | null;
        estimatedTravelCost: import("@prisma/client/runtime/library").Decimal;
        estimatedHotelCost: import("@prisma/client/runtime/library").Decimal;
        estimatedFoodCost: import("@prisma/client/runtime/library").Decimal;
        estimatedLocalTransport: import("@prisma/client/runtime/library").Decimal;
        otherCost: import("@prisma/client/runtime/library").Decimal;
        totalEstimatedCost: import("@prisma/client/runtime/library").Decimal;
        advanceRequired: boolean;
        advanceAmount: import("@prisma/client/runtime/library").Decimal | null;
        advanceRemarks: string | null;
    }>;
    createBooking(dto: CreateTravelBookingDto, req: any): Promise<{
        company: {
            id: string;
            name: string;
        };
        department: {
            id: string;
            name: string;
        } | null;
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        branchId: string | null;
        departmentId: string | null;
        designationId: string | null;
        reportingManagerId: string | null;
        startDate: Date;
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
        rejectionReason: string | null;
        remarks: string | null;
        employeeId: string;
        endDate: Date;
        bookingCode: string;
        costCenterId: string | null;
        gradeId: string | null;
        purpose: string;
        travelType: string;
        fromLocation: string;
        toLocation: string;
        travelMode: string;
        accommodationRequired: boolean;
        hotelDetails: string | null;
        estimatedTravelCost: import("@prisma/client/runtime/library").Decimal;
        estimatedHotelCost: import("@prisma/client/runtime/library").Decimal;
        estimatedFoodCost: import("@prisma/client/runtime/library").Decimal;
        estimatedLocalTransport: import("@prisma/client/runtime/library").Decimal;
        otherCost: import("@prisma/client/runtime/library").Decimal;
        totalEstimatedCost: import("@prisma/client/runtime/library").Decimal;
        advanceRequired: boolean;
        advanceAmount: import("@prisma/client/runtime/library").Decimal | null;
        advanceRemarks: string | null;
    }>;
    updateBooking(id: string, dto: Partial<CreateTravelBookingDto>, req: any): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        branchId: string | null;
        departmentId: string | null;
        designationId: string | null;
        reportingManagerId: string | null;
        startDate: Date;
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
        rejectionReason: string | null;
        remarks: string | null;
        employeeId: string;
        endDate: Date;
        bookingCode: string;
        costCenterId: string | null;
        gradeId: string | null;
        purpose: string;
        travelType: string;
        fromLocation: string;
        toLocation: string;
        travelMode: string;
        accommodationRequired: boolean;
        hotelDetails: string | null;
        estimatedTravelCost: import("@prisma/client/runtime/library").Decimal;
        estimatedHotelCost: import("@prisma/client/runtime/library").Decimal;
        estimatedFoodCost: import("@prisma/client/runtime/library").Decimal;
        estimatedLocalTransport: import("@prisma/client/runtime/library").Decimal;
        otherCost: import("@prisma/client/runtime/library").Decimal;
        totalEstimatedCost: import("@prisma/client/runtime/library").Decimal;
        advanceRequired: boolean;
        advanceAmount: import("@prisma/client/runtime/library").Decimal | null;
        advanceRemarks: string | null;
    }>;
    updateStatus(id: string, dto: UpdateTravelStatusDto, req: any): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        branchId: string | null;
        departmentId: string | null;
        designationId: string | null;
        reportingManagerId: string | null;
        startDate: Date;
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
        rejectionReason: string | null;
        remarks: string | null;
        employeeId: string;
        endDate: Date;
        bookingCode: string;
        costCenterId: string | null;
        gradeId: string | null;
        purpose: string;
        travelType: string;
        fromLocation: string;
        toLocation: string;
        travelMode: string;
        accommodationRequired: boolean;
        hotelDetails: string | null;
        estimatedTravelCost: import("@prisma/client/runtime/library").Decimal;
        estimatedHotelCost: import("@prisma/client/runtime/library").Decimal;
        estimatedFoodCost: import("@prisma/client/runtime/library").Decimal;
        estimatedLocalTransport: import("@prisma/client/runtime/library").Decimal;
        otherCost: import("@prisma/client/runtime/library").Decimal;
        totalEstimatedCost: import("@prisma/client/runtime/library").Decimal;
        advanceRequired: boolean;
        advanceAmount: import("@prisma/client/runtime/library").Decimal | null;
        advanceRemarks: string | null;
    }>;
    createExpenseClaimFromBooking(id: string, dto: Partial<CreateExpenseClaimDto>): Promise<{
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        title: string;
        remarks: string | null;
        employeeId: string;
        category: string;
        date: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        claimCode: string;
        travelBookingId: string | null;
        receiptUrl: string | null;
    }>;
    listClaims(companyId?: string): Promise<({
        company: {
            id: string;
            name: string;
        };
        employee: {
            id: string;
            firstName: string;
            lastName: string;
            employeeCode: string;
        };
        travelBooking: {
            id: string;
            bookingCode: string;
            purpose: string;
        } | null;
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        title: string;
        remarks: string | null;
        employeeId: string;
        category: string;
        date: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        claimCode: string;
        travelBookingId: string | null;
        receiptUrl: string | null;
    })[]>;
    createClaimDirect(dto: CreateExpenseClaimDto): Promise<{
        company: {
            id: string;
            name: string;
        };
        employee: {
            id: string;
            firstName: string;
            lastName: string;
            employeeCode: string;
        };
        travelBooking: {
            id: string;
            bookingCode: string;
            purpose: string;
        } | null;
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        title: string;
        remarks: string | null;
        employeeId: string;
        category: string;
        date: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        claimCode: string;
        travelBookingId: string | null;
        receiptUrl: string | null;
    }>;
    updateClaimStatus(id: string, body: {
        status: string;
        remarks?: string;
    }): Promise<{
        company: {
            id: string;
            name: string;
        };
        employee: {
            id: string;
            firstName: string;
            lastName: string;
            employeeCode: string;
        };
        travelBooking: {
            id: string;
            bookingCode: string;
            purpose: string;
        } | null;
    } & {
        id: string;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        title: string;
        remarks: string | null;
        employeeId: string;
        category: string;
        date: Date;
        amount: import("@prisma/client/runtime/library").Decimal;
        claimCode: string;
        travelBookingId: string | null;
        receiptUrl: string | null;
    }>;
}
