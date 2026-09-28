import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { getTenantCompanyId, getTenantBranchId } from '../../common/utils/tenant-context.util';

@Controller('employees/transfers')
export class TransfersController {
  constructor(private readonly transfersService: TransfersService) {}

  @Get()
  @Permissions('employees.read')
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    const tenantBranchId = getTenantBranchId(user, branchId);
    return this.transfersService.list(tenantCompanyId, tenantBranchId);
  }

  @Get(':id')
  @Permissions('employees.read')
  findOne(@Param('id') id: string) {
    return this.transfersService.findById(id);
  }

  @Post()
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: any,
  ) {
    const isBranchAdmin = user.roles?.some((r) => r.includes('BRANCH_ADMIN') || r.includes('BRANCH ADMIN')) ||
      user.primaryRole?.toUpperCase().includes('BRANCH ADMIN');
    const isHrOrAdmin = isBranchAdmin || user.roles?.some((r) => r.includes('HR') || r.includes('ADMIN') || r === 'SUPER_ADMIN') ||
      user.primaryRole?.toUpperCase().includes('ADMIN') || user.primaryRole?.toUpperCase().includes('HR') ||
      user.permissions?.includes('*') || user.permissions?.includes('employees.write');

    const userEmpId = user.employee?.id;

    // Regular employees can only queue workforce movements for themselves
    if (!isHrOrAdmin) {
      if (userEmpId && dto.employeeId && dto.employeeId !== userEmpId) {
        throw new ForbiddenException('Employees can only queue workforce movements for themselves');
      }
    }

    const tenantCompanyId = getTenantCompanyId(user);
    const tenantBranchId = getTenantBranchId(user);
    return this.transfersService.create(dto, tenantCompanyId, tenantBranchId);
  }

  @Put(':id')
  @Permissions('employees.write')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.transfersService.update(id, dto);
  }

  @Post(':id/approve')
  approve(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    this.assertApprover(user);
    const tenantBranchId = getTenantBranchId(user);
    const approverName = user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : (user.primaryRole || 'Branch Admin');
    return this.transfersService.approve(id, { ...body, approvedBy: approverName }, tenantBranchId);
  }

  @Post(':id/reject')
  reject(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    this.assertApprover(user);
    const tenantBranchId = getTenantBranchId(user);
    const approverName = user.employee ? `${user.employee.firstName} ${user.employee.lastName}` : (user.primaryRole || 'Branch Admin');
    return this.transfersService.reject(id, { ...body, approvedBy: approverName }, tenantBranchId);
  }

  @Post(':id/effective')
  effective(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    this.assertApprover(user);
    return this.transfersService.makeEffective(id);
  }

  @Post(':id/cancel')
  cancel(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.transfersService.cancel(id);
  }

  private assertApprover(user: CurrentUserPayload) {
    const isBranchAdmin = user.roles?.some((r) => r.includes('BRANCH_ADMIN') || r.includes('BRANCH ADMIN')) ||
      user.primaryRole?.toUpperCase().includes('BRANCH ADMIN');
    const isHrOrAdmin = isBranchAdmin || user.roles?.some((r) => r.includes('HR') || r.includes('ADMIN') || r === 'SUPER_ADMIN') ||
      user.primaryRole?.toUpperCase().includes('ADMIN') || user.primaryRole?.toUpperCase().includes('HR') ||
      user.permissions?.includes('*') || user.permissions?.includes('employees.write');

    if (!isBranchAdmin && !isHrOrAdmin) {
      throw new ForbiddenException('Only Branch Admin or HR Admin can approve/reject workforce movements');
    }
  }
}
