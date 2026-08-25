import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateExpenseClaimDto, CreateTravelBookingDto, UpdateTravelStatusDto } from './dto/travel-booking.dto';

@Injectable()
export class TravelExpenseService {
  constructor(private readonly prisma: PrismaService) {}

  async generateBookingCode(): Promise<string> {
    const count = await this.prisma.travelBooking.count();
    let num = count + 1001;
    let code = `TRV-${num}`;
    let exists = await this.prisma.travelBooking.findUnique({ where: { bookingCode: code } });
    while (exists) {
      num++;
      code = `TRV-${num}`;
      exists = await this.prisma.travelBooking.findUnique({ where: { bookingCode: code } });
    }
    return code;
  }

  async generateClaimCode(): Promise<string> {
    const count = await this.prisma.expenseClaim.count();
    let num = count + 9001;
    let code = `EXP-${num}`;
    let exists = await this.prisma.expenseClaim.findUnique({ where: { claimCode: code } });
    while (exists) {
      num++;
      code = `EXP-${num}`;
      exists = await this.prisma.expenseClaim.findUnique({ where: { claimCode: code } });
    }
    return code;
  }

  async listBookings(params: {
    companyId?: string;
    search?: string;
    status?: string;
    travelType?: string;
    departmentId?: string;
    employeeId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { companyId, search, status, travelType, departmentId, employeeId, startDate, endDate } = params;

    const where: any = {};

    if (companyId && companyId !== 'ALL' && companyId.trim() !== '') {
      where.companyId = companyId;
    }
    if (status && status !== 'ALL') where.status = status;
    if (travelType && travelType !== 'ALL') where.travelType = travelType;
    if (departmentId && departmentId !== 'ALL') where.departmentId = departmentId;
    if (employeeId && employeeId !== 'ALL') where.employeeId = employeeId;

    if (startDate && endDate) {
      where.startDate = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { bookingCode: { contains: q } },
        { purpose: { contains: q } },
        { fromLocation: { contains: q } },
        { toLocation: { contains: q } },
        { employee: { firstName: { contains: q } } },
        { employee: { lastName: { contains: q } } },
      ];
    }

    return this.prisma.travelBooking.findMany({
      where,
      include: {
        company:    { select: { id: true, name: true, code: true } },
        employee:   { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true, code: true } },
        designation:{ select: { id: true, title: true, code: true } },
        branch:     { select: { id: true, name: true, code: true } },
        approvalHistory: { orderBy: { createdAt: 'desc' } },
        expenseClaims:   true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBooking(id: string) {
    const booking = await this.prisma.travelBooking.findUnique({
      where: { id },
      include: {
        company:    { select: { id: true, name: true, code: true } },
        employee:   { select: { id: true, employeeCode: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true, code: true } },
        designation:{ select: { id: true, title: true, code: true } },
        branch:     { select: { id: true, name: true, code: true } },
        approvalHistory: { orderBy: { createdAt: 'desc' } },
        expenseClaims:   true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Travel Booking with ID ${id} not found`);
    }

    return booking;
  }

  async createBooking(dto: CreateTravelBookingDto, actorName = 'Employee') {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
      select: {
        id: true,
        companyId: true,
        departmentId: true,
        designationId: true,
        branchId: true,
        reportingManagerId: true,
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee ${dto.employeeId} not found`);
    }

    const bookingCode = dto.bookingCode || (await this.generateBookingCode());

    const travelCost     = Number(dto.estimatedTravelCost || 0);
    const hotelCost      = Number(dto.estimatedHotelCost || 0);
    const foodCost       = Number(dto.estimatedFoodCost || 0);
    const localTransport = Number(dto.estimatedLocalTransport || 0);
    const otherCost      = Number(dto.otherCost || 0);
    const totalEstimatedCost = travelCost + hotelCost + foodCost + localTransport + otherCost;

    const initialStatus = dto.status || 'DRAFT';

    const cleanStr = (val?: string) => (val && val.trim() !== '' ? val.trim() : null);

    const targetCompanyId =
      dto.companyId && dto.companyId !== 'ALL' && dto.companyId.trim() !== ''
        ? dto.companyId
        : employee.companyId;

    const booking = await this.prisma.travelBooking.create({
      data: {
        bookingCode,
        companyId:          targetCompanyId,
        employeeId:         dto.employeeId,
        departmentId:      cleanStr(dto.departmentId) || employee.departmentId || null,
        designationId:     cleanStr(dto.designationId) || employee.designationId || null,
        branchId:          cleanStr(dto.branchId) || employee.branchId || null,
        costCenterId:      cleanStr(dto.costCenterId) || null,
        gradeId:           cleanStr(dto.gradeId) || null,
        reportingManagerId:cleanStr(dto.reportingManagerId) || employee.reportingManagerId || null,

        purpose:           dto.purpose,
        travelType:        dto.travelType || 'Domestic',
        fromLocation:      dto.fromLocation,
        toLocation:        dto.toLocation,
        startDate:         dto.startDate ? new Date(dto.startDate) : new Date(),
        endDate:           dto.endDate ? new Date(dto.endDate) : new Date(),
        travelMode:        dto.travelMode || 'Flight',

        accommodationRequired: dto.accommodationRequired ?? false,
        hotelDetails:          cleanStr(dto.hotelDetails),

        estimatedTravelCost:     travelCost,
        estimatedHotelCost:      hotelCost,
        estimatedFoodCost:       foodCost,
        estimatedLocalTransport: localTransport,
        otherCost:               otherCost,
        totalEstimatedCost:      totalEstimatedCost,

        advanceRequired:   dto.advanceRequired ?? false,
        advanceAmount:     dto.advanceRequired ? Number(dto.advanceAmount || 0) : 0,
        advanceRemarks:    cleanStr(dto.advanceRemarks),
        remarks:           cleanStr(dto.remarks),
        attachments:       dto.attachments ? JSON.parse(JSON.stringify(dto.attachments)) : null,
        status:            initialStatus,
      },
      include: {
        company:    { select: { id: true, name: true } },
        employee:   { select: { id: true, firstName: true, lastName: true } },
        department: { select: { id: true, name: true } },
      },
    });

    await this.prisma.travelApprovalHistory.create({
      data: {
        travelBookingId: booking.id,
        userName: actorName,
        action: initialStatus === 'SUBMITTED' ? 'SUBMITTED' : 'CREATED_DRAFT',
        remarks: initialStatus === 'SUBMITTED' ? 'Travel request submitted for manager approval' : 'Draft travel request saved',
      },
    });

    return booking;
  }

  async updateBooking(id: string, dto: Partial<CreateTravelBookingDto>, actorName = 'Employee') {
    const existing = await this.getBooking(id);

    if (existing.status !== 'DRAFT' && existing.status !== 'REJECTED') {
      throw new BadRequestException(`Cannot edit travel request in status ${existing.status}`);
    }

    const travelCost     = dto.estimatedTravelCost     !== undefined ? Number(dto.estimatedTravelCost) : Number(existing.estimatedTravelCost);
    const hotelCost      = dto.estimatedHotelCost      !== undefined ? Number(dto.estimatedHotelCost) : Number(existing.estimatedHotelCost);
    const foodCost       = dto.estimatedFoodCost       !== undefined ? Number(dto.estimatedFoodCost) : Number(existing.estimatedFoodCost);
    const localTransport = dto.estimatedLocalTransport !== undefined ? Number(dto.estimatedLocalTransport) : Number(existing.estimatedLocalTransport);
    const otherCost      = dto.otherCost               !== undefined ? Number(dto.otherCost) : Number(existing.otherCost);
    const totalEstimatedCost = travelCost + hotelCost + foodCost + localTransport + otherCost;

    const newStatus = dto.status || existing.status;
    const cleanStr = (val?: string) => (val && val.trim() !== '' ? val.trim() : null);

    const updated = await this.prisma.travelBooking.update({
      where: { id },
      data: {
        ...(dto.purpose && { purpose: dto.purpose }),
        ...(dto.travelType && { travelType: dto.travelType }),
        ...(dto.fromLocation && { fromLocation: dto.fromLocation }),
        ...(dto.toLocation && { toLocation: dto.toLocation }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.travelMode && { travelMode: dto.travelMode }),
        ...(dto.accommodationRequired !== undefined && { accommodationRequired: dto.accommodationRequired }),
        ...(dto.hotelDetails !== undefined && { hotelDetails: cleanStr(dto.hotelDetails) }),

        estimatedTravelCost:     travelCost,
        estimatedHotelCost:      hotelCost,
        estimatedFoodCost:       foodCost,
        estimatedLocalTransport: localTransport,
        otherCost:               otherCost,
        totalEstimatedCost:      totalEstimatedCost,

        ...(dto.advanceRequired !== undefined && { advanceRequired: dto.advanceRequired }),
        ...(dto.advanceAmount !== undefined && { advanceAmount: Number(dto.advanceAmount) }),
        ...(dto.advanceRemarks !== undefined && { advanceRemarks: cleanStr(dto.advanceRemarks) }),
        ...(dto.remarks !== undefined && { remarks: cleanStr(dto.remarks) }),
        ...(dto.attachments !== undefined && { attachments: dto.attachments ? JSON.parse(JSON.stringify(dto.attachments)) : null }),
        status: newStatus,
        ...(newStatus === 'SUBMITTED' && { rejectionReason: null }),
      },
    });

    await this.prisma.travelApprovalHistory.create({
      data: {
        travelBookingId: id,
        userName: actorName,
        action: newStatus === 'SUBMITTED' ? 'SUBMITTED' : 'UPDATED_DRAFT',
        remarks: newStatus === 'SUBMITTED' ? 'Resubmitted travel request for approval' : 'Updated travel request details',
      },
    });

    return updated;
  }

  async updateStatus(id: string, dto: UpdateTravelStatusDto) {
    const booking = await this.getBooking(id);
    const action = dto.action.toUpperCase();

    let targetStatus = action;
    if (action === 'APPROVE' || action === 'MANAGER_APPROVED') {
      targetStatus = 'MANAGER_APPROVED';
    } else if (action === 'ADVANCE_DISBURSED' || action === 'DISBURSE_ADVANCE') {
      targetStatus = 'ADVANCE_DISBURSED';
    } else if (action === 'IN_PROGRESS' || action === 'START_TRIP') {
      targetStatus = 'IN_PROGRESS';
    } else if (action === 'TRIP_COMPLETED' || action === 'COMPLETE_TRIP') {
      targetStatus = 'TRIP_COMPLETED';
    } else if (action === 'HR_APPROVE' || action === 'HR_APPROVED') {
      targetStatus = 'HR_APPROVED';
    } else if (action === 'FINANCE_APPROVE' || action === 'FINANCE_APPROVED') {
      targetStatus = 'FINANCE_APPROVED';
    } else if (action === 'REJECT' || action === 'REJECTED') {
      targetStatus = 'REJECTED';
    } else if (action === 'CANCEL' || action === 'CANCELLED') {
      targetStatus = 'CANCELLED';
    } else if (action === 'COMPLETE' || action === 'COMPLETED') {
      targetStatus = 'COMPLETED';
    }

    const updated = await this.prisma.travelBooking.update({
      where: { id },
      data: {
        status: targetStatus,
        ...(targetStatus === 'REJECTED' && { rejectionReason: dto.rejectionReason || dto.remarks || 'Request rejected' }),
      },
    });

    await this.prisma.travelApprovalHistory.create({
      data: {
        travelBookingId: id,
        userId: dto.userId || null,
        userName: dto.userName || 'Manager / Admin',
        action: targetStatus,
        remarks: dto.remarks || dto.rejectionReason || `Travel booking status changed to ${targetStatus}`,
      },
    });

    return updated;
  }

  async createClaimDirect(dto: CreateExpenseClaimDto) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
      select: { id: true, companyId: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employee ${dto.employeeId} not found`);
    }

    const claimCode = await this.generateClaimCode();

    const claim = await this.prisma.expenseClaim.create({
      data: {
        claimCode,
        companyId:       dto.companyId || employee.companyId,
        employeeId:      dto.employeeId,
        travelBookingId: (dto.travelBookingId && dto.travelBookingId.trim() !== '') ? dto.travelBookingId.trim() : null,
        title:           dto.title,
        category:        dto.category || 'Flight & Hotel',
        amount:          Number(dto.amount || 0),
        date:            dto.date ? new Date(dto.date) : new Date(),
        receiptUrl:      dto.receiptUrl || null,
        remarks:         dto.remarks || null,
        status:          'PENDING',
      },
      include: {
        company:  { select: { id: true, name: true } },
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        travelBooking: { select: { id: true, bookingCode: true, purpose: true } },
      },
    });

    return claim;
  }

  async createExpenseClaimFromBooking(bookingId: string, dto?: Partial<CreateExpenseClaimDto>) {
    const booking = await this.getBooking(bookingId);
    const claimCode = await this.generateClaimCode();

    const claim = await this.prisma.expenseClaim.create({
      data: {
        claimCode,
        companyId:       booking.companyId,
        employeeId:      booking.employeeId,
        travelBookingId: booking.id,
        title:           dto?.title || `Expense Claim for ${booking.purpose} (${booking.bookingCode})`,
        category:        dto?.category || 'Flight & Hotel',
        amount:          dto?.amount !== undefined ? Number(dto.amount) : Number(booking.totalEstimatedCost),
        receiptUrl:      dto?.receiptUrl || null,
        remarks:         dto?.remarks || `Generated from Travel Booking ${booking.bookingCode}`,
        status:          'PENDING',
      },
    });

    return claim;
  }

  async listClaims(companyId?: string) {
    const whereComp = (companyId && companyId !== 'ALL' && companyId.trim() !== '') ? { companyId } : {};
    return this.prisma.expenseClaim.findMany({
      where: whereComp,
      include: {
        company:  { select: { id: true, name: true } },
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        travelBooking: { select: { id: true, bookingCode: true, purpose: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDashboardStats(companyId?: string) {
    const whereComp = (companyId && companyId !== 'ALL' && companyId.trim() !== '') ? { companyId } : {};

    const approvedBookings = await this.prisma.travelBooking.findMany({
      where: {
        ...whereComp,
        status: { in: ['MANAGER_APPROVED', 'HR_APPROVED', 'FINANCE_APPROVED', 'IN_PROGRESS', 'COMPLETED'] },
      },
      select: { totalEstimatedCost: true },
    });

    const ytdSpentNumber = approvedBookings.reduce((acc, b) => acc + Number(b.totalEstimatedCost || 0), 0);

    const pendingClaims = await this.prisma.expenseClaim.findMany({
      where: {
        ...whereComp,
        status: 'PENDING',
      },
      select: { amount: true },
    });

    const pendingAdvances = await this.prisma.travelBooking.findMany({
      where: {
        ...whereComp,
        advanceRequired: true,
        status: 'SUBMITTED',
      },
      select: { advanceAmount: true },
    });

    const pendingClaimsCount = pendingClaims.length + pendingAdvances.length;
    const pendingClaimsAmount =
      pendingClaims.reduce((acc, c) => acc + Number(c.amount || 0), 0) +
      pendingAdvances.reduce((acc, b) => acc + Number(b.advanceAmount || 0), 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const reimbursedClaims = await this.prisma.expenseClaim.findMany({
      where: {
        ...whereComp,
        status: { in: ['APPROVED', 'REIMBURSED'] },
        updatedAt: { gte: startOfMonth },
      },
      select: { amount: true },
    });

    const reimbursedThisMonth = reimbursedClaims.reduce((acc, c) => acc + Number(c.amount || 0), 0);

    return {
      ytdBudgetSpent: ytdSpentNumber,
      pendingClaimsCount,
      pendingClaimsAmount,
      reimbursedThisMonth,
      corporateCardSync: {
        connected: false,
        statusText: 'Not Connected',
        description: 'Corporate Card Integration Disabled',
      },
    };
  }

  async updateClaimStatus(id: string, dto: { status: string; remarks?: string }) {
    const claim = await this.prisma.expenseClaim.findUnique({
      where: { id },
      include: { travelBooking: true },
    });

    if (!claim) {
      throw new NotFoundException(`Expense Claim ${id} not found`);
    }

    const newStatus = dto.status.toUpperCase();

    const updated = await this.prisma.expenseClaim.update({
      where: { id },
      data: {
        status: newStatus,
        ...(dto.remarks !== undefined && { remarks: dto.remarks }),
      },
      include: {
        company:  { select: { id: true, name: true } },
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        travelBooking: { select: { id: true, bookingCode: true, purpose: true } },
      },
    });

    if ((newStatus === 'APPROVED' || newStatus === 'REIMBURSED') && claim.travelBookingId) {
      await this.prisma.travelBooking.update({
        where: { id: claim.travelBookingId },
        data: { status: 'COMPLETED' },
      }).catch(() => {});

      await this.prisma.travelApprovalHistory.create({
        data: {
          travelBookingId: claim.travelBookingId,
          userName: 'Finance / Admin',
          action: 'COMPLETED',
          remarks: `Linked Expense Claim ${claim.claimCode} approved and reimbursed`,
        },
      }).catch(() => {});
    }

    return updated;
  }
}
