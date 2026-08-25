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
            code: string;
            name: string;
        };
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
        };
        department: {
            id: string;
            code: string;
            name: string;
        } | null;
        designation: {
            id: string;
            code: string;
            title: string;
        } | null;
        branch: {
            id: string;
            code: string;
            name: string;
        } | null;
        approvalHistory: {
            id: string;
            remarks: string | null;
            createdAt: Date;
            userId: string | null;
            travelBookingId: string;
            userName: string;
            action: string;
        }[];
        expenseClaims: {
            id: string;
            companyId: string;
            employeeId: string;
            remarks: string | null;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            travelBookingId: string | null;
            claimCode: string;
            category: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            date: Date;
            receiptUrl: string | null;
        }[];
    } & {
        id: string;
        bookingCode: string;
        companyId: string;
        employeeId: string;
        departmentId: string | null;
        designationId: string | null;
        branchId: string | null;
        costCenterId: string | null;
        gradeId: string | null;
        reportingManagerId: string | null;
        purpose: string;
        travelType: string;
        fromLocation: string;
        toLocation: string;
        startDate: Date;
        endDate: Date;
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
        remarks: string | null;
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
        status: string;
        rejectionReason: string | null;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getBooking(id: string): Promise<{
        company: {
            id: string;
            code: string;
            name: string;
        };
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
        };
        department: {
            id: string;
            code: string;
            name: string;
        } | null;
        designation: {
            id: string;
            code: string;
            title: string;
        } | null;
        branch: {
            id: string;
            code: string;
            name: string;
        } | null;
        approvalHistory: {
            id: string;
            remarks: string | null;
            createdAt: Date;
            userId: string | null;
            travelBookingId: string;
            userName: string;
            action: string;
        }[];
        expenseClaims: {
            id: string;
            companyId: string;
            employeeId: string;
            remarks: string | null;
            status: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            travelBookingId: string | null;
            claimCode: string;
            category: string;
            amount: import("@prisma/client/runtime/library").Decimal;
            date: Date;
            receiptUrl: string | null;
        }[];
    } & {
        id: string;
        bookingCode: string;
        companyId: string;
        employeeId: string;
        departmentId: string | null;
        designationId: string | null;
        branchId: string | null;
        costCenterId: string | null;
        gradeId: string | null;
        reportingManagerId: string | null;
        purpose: string;
        travelType: string;
        fromLocation: string;
        toLocation: string;
        startDate: Date;
        endDate: Date;
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
        remarks: string | null;
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
        status: string;
        rejectionReason: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createBooking(dto: CreateTravelBookingDto, req: any): Promise<{
        company: {
            id: string;
            name: string;
        };
        employee: {
            id: string;
            firstName: string;
            lastName: string;
        };
        department: {
            id: string;
            name: string;
        } | null;
    } & {
        id: string;
        bookingCode: string;
        companyId: string;
        employeeId: string;
        departmentId: string | null;
        designationId: string | null;
        branchId: string | null;
        costCenterId: string | null;
        gradeId: string | null;
        reportingManagerId: string | null;
        purpose: string;
        travelType: string;
        fromLocation: string;
        toLocation: string;
        startDate: Date;
        endDate: Date;
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
        remarks: string | null;
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
        status: string;
        rejectionReason: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateBooking(id: string, dto: Partial<CreateTravelBookingDto>, req: any): Promise<{
        id: string;
        bookingCode: string;
        companyId: string;
        employeeId: string;
        departmentId: string | null;
        designationId: string | null;
        branchId: string | null;
        costCenterId: string | null;
        gradeId: string | null;
        reportingManagerId: string | null;
        purpose: string;
        travelType: string;
        fromLocation: string;
        toLocation: string;
        startDate: Date;
        endDate: Date;
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
        remarks: string | null;
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
        status: string;
        rejectionReason: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateStatus(id: string, dto: UpdateTravelStatusDto, req: any): Promise<{
        id: string;
        bookingCode: string;
        companyId: string;
        employeeId: string;
        departmentId: string | null;
        designationId: string | null;
        branchId: string | null;
        costCenterId: string | null;
        gradeId: string | null;
        reportingManagerId: string | null;
        purpose: string;
        travelType: string;
        fromLocation: string;
        toLocation: string;
        startDate: Date;
        endDate: Date;
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
        remarks: string | null;
        attachments: import("@prisma/client/runtime/library").JsonValue | null;
        status: string;
        rejectionReason: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createExpenseClaimFromBooking(id: string, dto: Partial<CreateExpenseClaimDto>): Promise<{
        id: string;
        companyId: string;
        employeeId: string;
        remarks: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        travelBookingId: string | null;
        claimCode: string;
        category: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        date: Date;
        receiptUrl: string | null;
    }>;
    listClaims(companyId?: string): Promise<({
        travelBooking: {
            id: string;
            bookingCode: string;
            purpose: string;
        } | null;
        company: {
            id: string;
            name: string;
        };
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        employeeId: string;
        remarks: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        travelBookingId: string | null;
        claimCode: string;
        category: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        date: Date;
        receiptUrl: string | null;
    })[]>;
    createClaimDirect(dto: CreateExpenseClaimDto): Promise<{
        travelBooking: {
            id: string;
            bookingCode: string;
            purpose: string;
        } | null;
        company: {
            id: string;
            name: string;
        };
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        employeeId: string;
        remarks: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        travelBookingId: string | null;
        claimCode: string;
        category: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        date: Date;
        receiptUrl: string | null;
    }>;
    updateClaimStatus(id: string, body: {
        status: string;
        remarks?: string;
    }): Promise<{
        travelBooking: {
            id: string;
            bookingCode: string;
            purpose: string;
        } | null;
        company: {
            id: string;
            name: string;
        };
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        companyId: string;
        employeeId: string;
        remarks: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        travelBookingId: string | null;
        claimCode: string;
        category: string;
        amount: import("@prisma/client/runtime/library").Decimal;
        date: Date;
        receiptUrl: string | null;
    }>;
}
