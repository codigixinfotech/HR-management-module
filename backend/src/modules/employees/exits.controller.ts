import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ExitsService } from './exits.service';
import { ExitClearanceMasterService } from './exit-clearance-master.service';
import {
  AdjustLwdDto,
  CreateExitDto,
  SaveExitInterviewDto,
  SaveFnfSettlementDto,
  UpdateClearanceItemDto,
  UpdateExitStatusDto,
} from './dto/exit.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { getTenantCompanyId, getTenantBranchId } from '../../common/utils/tenant-context.util';

@Controller('employees/exits')
export class ExitsController {
  constructor(
    private readonly service: ExitsService,
    private readonly clearanceMasterService: ExitClearanceMasterService,
  ) {}

  @Get('kpis')
  @Permissions('employees.read')
  getKpis(
    @CurrentUser() user: CurrentUserPayload,
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    const tenantBranchId = getTenantBranchId(user, branchId);
    return this.service.getKpis(tenantCompanyId, tenantBranchId);
  }

  @Get('clearance-master')
  @Permissions('employees.read')
  getClearanceMaster(
    @CurrentUser() user: CurrentUserPayload,
    @Query('companyId') companyId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.clearanceMasterService.getClearanceRules(tenantCompanyId);
  }

  @Put('clearance-master')
  @Permissions('employees.write')
  saveClearanceMaster(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { companyId?: string; sector: string; rules: any[] },
  ) {
    const tenantCompanyId = getTenantCompanyId(user, body.companyId);
    return this.clearanceMasterService.saveCompanyRules(
      tenantCompanyId || 'default',
      body.sector,
      body.rules,
    );
  }

  @Post('clearance-master/reset-preset')
  @Permissions('employees.write')
  resetClearanceMasterToPreset(
    @CurrentUser() user: CurrentUserPayload,
    @Body() body: { companyId?: string; sector: string },
  ) {
    const tenantCompanyId = getTenantCompanyId(user, body.companyId);
    return this.clearanceMasterService.resetToPreset(
      tenantCompanyId || 'default',
      body.sector,
    );
  }

  @Get()
  @Permissions('employees.read')
  findAll(
    @CurrentUser() user: CurrentUserPayload,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    const tenantBranchId = getTenantBranchId(user, branchId);
    return this.service.findAll(search, status, tenantCompanyId, tenantBranchId);
  }

  @Get(':id')
  @Permissions('employees.read')
  findOne(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Query('companyId') companyId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.service.findOne(id, tenantCompanyId);
  }

  @Post(':id/recalculate-clearance')
  recalculateClearance(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body('performedBy') performedBy?: string,
  ) {
    this.assertApprover(user);
    return this.service.recalculateClearance(id, performedBy);
  }

  @Post()
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateExitDto,
  ) {
    const isBranchAdmin = user.roles?.some((r) => r.includes('BRANCH_ADMIN') || r.includes('BRANCH ADMIN')) ||
      user.primaryRole?.toUpperCase().includes('BRANCH ADMIN');
    const isHrOrAdmin = isBranchAdmin || user.roles?.some((r) => r.includes('HR') || r.includes('ADMIN') || r === 'SUPER_ADMIN') ||
      user.primaryRole?.toUpperCase().includes('ADMIN') || user.primaryRole?.toUpperCase().includes('HR') ||
      user.permissions?.includes('*') || user.permissions?.includes('employees.write');

    const userEmpId = user.employee?.id;

    // Regular employees can only initiate exit cases for themselves
    if (!isHrOrAdmin) {
      if (userEmpId && dto.employeeId && dto.employeeId !== userEmpId) {
        throw new ForbiddenException('Employees can only initiate separation cases for themselves');
      }
    }

    const tenantCompanyId = getTenantCompanyId(user, dto.companyId);
    return this.service.create(dto, tenantCompanyId);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateExitStatusDto,
  ) {
    this.assertApprover(user);
    return this.service.updateStatus(id, dto);
  }

  @Patch(':id/adjust-lwd')
  adjustLwd(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: AdjustLwdDto,
  ) {
    this.assertApprover(user);
    return this.service.adjustLwd(id, dto);
  }

  @Patch('clearance/:itemId')
  updateClearanceItem(
    @CurrentUser() user: CurrentUserPayload,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateClearanceItemDto,
  ) {
    this.assertApprover(user);
    return this.service.updateClearanceItem(itemId, dto);
  }

  @Post(':id/exit-interview')
  saveExitInterview(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: SaveExitInterviewDto,
  ) {
    this.assertApprover(user);
    return this.service.saveExitInterview(id, dto);
  }

  @Post(':id/fnf')
  saveFnfSettlement(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: SaveFnfSettlementDto,
  ) {
    this.assertApprover(user);
    return this.service.saveFnfSettlement(id, dto);
  }

  @Post(':id/complete-exit')
  completeExit(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body('performedBy') performedBy?: string,
  ) {
    this.assertApprover(user);
    return this.service.completeExit(id, performedBy);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    this.assertApprover(user);
    return this.service.remove(id);
  }

  private assertApprover(user: CurrentUserPayload) {
    const isBranchAdmin = user.roles?.some((r) => r.includes('BRANCH_ADMIN') || r.includes('BRANCH ADMIN')) ||
      user.primaryRole?.toUpperCase().includes('BRANCH ADMIN');
    const isHrOrAdmin = isBranchAdmin || user.roles?.some((r) => r.includes('HR') || r.includes('ADMIN') || r === 'SUPER_ADMIN') ||
      user.primaryRole?.toUpperCase().includes('ADMIN') || user.primaryRole?.toUpperCase().includes('HR') ||
      user.permissions?.includes('*') || user.permissions?.includes('employees.write');

    if (!isBranchAdmin && !isHrOrAdmin) {
      throw new ForbiddenException('Only Branch Admin or HR Admin can manage exit lifecycles and approvals');
    }
  }
}
