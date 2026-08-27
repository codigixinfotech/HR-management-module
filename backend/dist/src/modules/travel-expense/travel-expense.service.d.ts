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
            name: string;
            code: string;
        };
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
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
            code: string;
            title: string;
        } | null;
        expenseClaims: {
            id: string;
            companyId: string;
            createdAt: Date;
            category: string;
            updatedAt: Date;
            employeeId: string;
            status: string;
            remarks: string | null;
            title: string;
            claimCode: string;
            travelBookingId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            date: Date;
            receiptUrl: string | null;
        }[];
        approvalHistory: {
            id: string;
            createdAt: Date;
            userId: string | null;
            remarks: string | null;
            travelBookingId: string;
            userName: string;
            action: string;
        }[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        branchId: string | null;
        departmentId: string | null;
        designationId: string | null;
        reportingManagerId: string | null;
        status: string;
        bookingCode: string;
        costCenterId: string | null;
        gradeId: string | null;
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
        rejectionReason: string | null;
    })[]>;
    getBooking(id: string): Promise<{
        company: {
            id: string;
            name: string;
            code: string;
        };
        employee: {
            id: string;
            employeeCode: string;
            firstName: string;
            lastName: string;
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
            code: string;
            title: string;
        } | null;
        expenseClaims: {
            id: string;
            companyId: string;
            createdAt: Date;
            category: string;
            updatedAt: Date;
            employeeId: string;
            status: string;
            remarks: string | null;
            title: string;
            claimCode: string;
            travelBookingId: string | null;
            amount: import("@prisma/client/runtime/library").Decimal;
            date: Date;
            receiptUrl: string | null;
        }[];
        approvalHistory: {
            id: string;
            createdAt: Date;
            userId: string | null;
            remarks: string | null;
            travelBookingId: string;
            userName: string;
            action: string;
        }[];
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        branchId: string | null;
        departmentId: string | null;
        designationId: string | null;
        reportingManagerId: string | null;
        status: string;
        bookingCode: string;
        costCenterId: string | null;
        gradeId: string | null;
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
        rejectionReason: string | null;
    }>;
    createBooking(dto: CreateTravelBookingDto, actorName?: string): Promise<{
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
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        branchId: string | null;
        departmentId: string | null;
        designationId: string | null;
        reportingManagerId: string | null;
        status: string;
        bookingCode: string;
        costCenterId: string | null;
        gradeId: string | null;
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
        rejectionReason: string | null;
    }>;
    updateBooking(id: string, dto: Partial<CreateTravelBookingDto>, actorName?: string): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        branchId: string | null;
        departmentId: string | null;
        designationId: string | null;
        reportingManagerId: string | null;
        status: string;
        bookingCode: string;
        costCenterId: string | null;
        gradeId: string | null;
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
        rejectionReason: string | null;
    }>;
    updateStatus(id: string, dto: UpdateTravelStatusDto): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        branchId: string | null;
        departmentId: string | null;
        designationId: string | null;
        reportingManagerId: string | null;
        status: string;
        bookingCode: string;
        costCenterId: string | null;
        gradeId: string | null;
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
        rejectionReason: string | null;
    }>;
    createClaimDirect(dto: CreateExpenseClaimDto): Promise<{
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
        travelBooking: {
            id: string;
            bookingCode: string;
            purpose: string;
        } | null;
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        category: string;
        updatedAt: Date;
        employeeId: string;
        status: string;
        remarks: string | null;
        title: string;
        claimCode: string;
        travelBookingId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        date: Date;
        receiptUrl: string | null;
    }>;
    createExpenseClaimFromBooking(bookingId: string, dto?: Partial<CreateExpenseClaimDto>): Promise<{
        id: string;
        companyId: string;
        createdAt: Date;
        category: string;
        updatedAt: Date;
        employeeId: string;
        status: string;
        remarks: string | null;
        title: string;
        claimCode: string;
        travelBookingId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        date: Date;
        receiptUrl: string | null;
    }>;
    listClaims(companyId?: string): Promise<({
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
        travelBooking: {
            id: string;
            bookingCode: string;
            purpose: string;
        } | null;
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        category: string;
        updatedAt: Date;
        employeeId: string;
        status: string;
        remarks: string | null;
        title: string;
        claimCode: string;
        travelBookingId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        date: Date;
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
            employeeCode: string;
            firstName: string;
            lastName: string;
        };
        travelBooking: {
            id: string;
            bookingCode: string;
            purpose: string;
        } | null;
    } & {
        id: string;
        companyId: string;
        createdAt: Date;
        category: string;
        updatedAt: Date;
        employeeId: string;
        status: string;
        remarks: string | null;
        title: string;
        claimCode: string;
        travelBookingId: string | null;
        amount: import("@prisma/client/runtime/library").Decimal;
        date: Date;
        receiptUrl: string | null;
    }>;
}
