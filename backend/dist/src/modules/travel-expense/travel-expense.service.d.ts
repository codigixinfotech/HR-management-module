import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateExpenseClaimDto, CreateTravelBookingDto, UpdateTravelStatusDto } from './dto/travel-booking.dto';
export declare class TravelExpenseService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    generateBookingCode(): Promise<string>;
    generateClaimCode(): Promise<string>;
    listBookings(params: {
        companyId?: string;
        search?: string;
        status?: string;
        travelType?: string;
        departmentId?: string;
        employeeId?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<({
        company: {
            id: string;
            code: string;
            name: string;
        };
        department: {
            id: string;
            code: string;
            name: string;
        } | null;
        designation: {
            title: string;
            id: string;
            code: string;
        } | null;
        branch: {
            id: string;
            code: string;
            name: string;
        } | null;
        expenseClaims: {
            companyId: string;
            title: string;
            status: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            remarks: string | null;
            employeeId: string;
            category: string;
            date: Date;
            claimCode: string;
            travelBookingId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            receiptUrl: string | null;
        }[];
        employee: {
            id: string;
            firstName: string;
            lastName: string;
            employeeCode: string;
        };
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
        companyId: string;
        departmentId: string | null;
        designationId: string | null;
        reportingManagerId: string | null;
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        branchId: string | null;
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
            code: string;
            name: string;
        };
        department: {
            id: string;
            code: string;
            name: string;
        } | null;
        designation: {
            title: string;
            id: string;
            code: string;
        } | null;
        branch: {
            id: string;
            code: string;
            name: string;
        } | null;
        expenseClaims: {
            companyId: string;
            title: string;
            status: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            remarks: string | null;
            employeeId: string;
            category: string;
            date: Date;
            claimCode: string;
            travelBookingId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            receiptUrl: string | null;
        }[];
        employee: {
            id: string;
            firstName: string;
            lastName: string;
            employeeCode: string;
        };
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
        companyId: string;
        departmentId: string | null;
        designationId: string | null;
        reportingManagerId: string | null;
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        branchId: string | null;
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
    createBooking(dto: CreateTravelBookingDto, actorName?: string): Promise<{
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
        companyId: string;
        departmentId: string | null;
        designationId: string | null;
        reportingManagerId: string | null;
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        branchId: string | null;
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
    updateBooking(id: string, dto: Partial<CreateTravelBookingDto>, actorName?: string): Promise<{
        companyId: string;
        departmentId: string | null;
        designationId: string | null;
        reportingManagerId: string | null;
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        branchId: string | null;
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
    updateStatus(id: string, dto: UpdateTravelStatusDto): Promise<{
        companyId: string;
        departmentId: string | null;
        designationId: string | null;
        reportingManagerId: string | null;
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        branchId: string | null;
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
        companyId: string;
        title: string;
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        remarks: string | null;
        employeeId: string;
        category: string;
        date: Date;
        claimCode: string;
        travelBookingId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        receiptUrl: string | null;
    }>;
    createExpenseClaimFromBooking(bookingId: string, dto?: Partial<CreateExpenseClaimDto>): Promise<{
        companyId: string;
        title: string;
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        remarks: string | null;
        employeeId: string;
        category: string;
        date: Date;
        claimCode: string;
        travelBookingId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
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
        companyId: string;
        title: string;
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        remarks: string | null;
        employeeId: string;
        category: string;
        date: Date;
        claimCode: string;
        travelBookingId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        receiptUrl: string | null;
    })[]>;
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
    updateClaimStatus(id: string, dto: {
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
        companyId: string;
        title: string;
        status: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        remarks: string | null;
        employeeId: string;
        category: string;
        date: Date;
        claimCode: string;
        travelBookingId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        receiptUrl: string | null;
    }>;
}
