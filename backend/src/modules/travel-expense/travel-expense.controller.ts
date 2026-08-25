import { Controller, Get, Post, Patch, Body, Param, Query, Request } from '@nestjs/common';
import { TravelExpenseService } from './travel-expense.service';
import { CreateExpenseClaimDto, CreateTravelBookingDto, UpdateTravelStatusDto } from './dto/travel-booking.dto';

@Controller('travel-expense')
export class TravelExpenseController {
  constructor(private readonly travelExpenseService: TravelExpenseService) {}

  @Get('dashboard-stats')
  getDashboardStats(@Query('companyId') companyId?: string) {
    return this.travelExpenseService.getDashboardStats(companyId);
  }

  @Get('bookings')
  listBookings(
    @Query('companyId') companyId?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('travelType') travelType?: string,
    @Query('departmentId') departmentId?: string,
    @Query('employeeId') employeeId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.travelExpenseService.listBookings({
      companyId,
      search,
      status,
      travelType,
      departmentId,
      employeeId,
      startDate,
      endDate,
    });
  }

  @Get('bookings/:id')
  getBooking(@Param('id') id: string) {
    return this.travelExpenseService.getBooking(id);
  }

  @Post('bookings')
  createBooking(@Body() dto: CreateTravelBookingDto, @Request() req: any) {
    const actorName = req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Employee' : 'Employee';
    return this.travelExpenseService.createBooking(dto, actorName);
  }

  @Patch('bookings/:id')
  updateBooking(@Param('id') id: string, @Body() dto: Partial<CreateTravelBookingDto>, @Request() req: any) {
    const actorName = req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Employee' : 'Employee';
    return this.travelExpenseService.updateBooking(id, dto, actorName);
  }

  @Post('bookings/:id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateTravelStatusDto, @Request() req: any) {
    const userId = req.user?.id;
    const userName = req.user ? `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Manager / Admin' : 'Manager / Admin';
    return this.travelExpenseService.updateStatus(id, {
      ...dto,
      userId: dto.userId || userId,
      userName: dto.userName || userName,
    });
  }

  @Post('bookings/:id/create-expense-claim')
  createExpenseClaimFromBooking(@Param('id') id: string, @Body() dto: Partial<CreateExpenseClaimDto>) {
    return this.travelExpenseService.createExpenseClaimFromBooking(id, dto);
  }

  @Get('claims')
  listClaims(@Query('companyId') companyId?: string) {
    return this.travelExpenseService.listClaims(companyId);
  }

  @Post('claims')
  createClaimDirect(@Body() dto: CreateExpenseClaimDto) {
    return this.travelExpenseService.createClaimDirect(dto);
  }

  @Post('claims/:id/status')
  updateClaimStatus(@Param('id') id: string, @Body() body: { status: string; remarks?: string }) {
    return this.travelExpenseService.updateClaimStatus(id, body);
  }
}
