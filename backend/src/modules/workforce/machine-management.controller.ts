import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { MachineManagementService } from './machine-management.service';
import {
  CreateMachineAllocationDto,
  CreateMachineDto,
  CreateMachineOperatorDto,
  CreateProductionLineDto,
  StartMachineMaintenanceDto,
  CompleteMachineMaintenanceDto,
  UpdateMachineDto,
  UpdateMachineOperatorDto,
  UpdateProductionLineDto,
  CreateCapacityUomDto,
  UpdateCapacityUomDto,
} from './dto/machine-management.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { getWorkforceTenantScope } from '../../common/utils/tenant-context.util';

@Controller('workforce')
export class MachineManagementController {
  constructor(private readonly service: MachineManagementService) {}

  // ─────────────────────────────────────────────────────────────
  // 1. KPI Dashboard
  // ─────────────────────────────────────────────────────────────
  @Get('machine-management/kpis')
  @Permissions('workforce.read')
  getKpis(
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const scope = getWorkforceTenantScope(user, companyId, branchId);
    return this.service.getKpis(scope.companyId, scope.branchId);
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Machines
  // ─────────────────────────────────────────────────────────────
  @Get('machines')
  @Permissions('workforce.read')
  listMachines(
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('productionLineId') productionLineId?: string,
    @Query('machineType') machineType?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const scope = getWorkforceTenantScope(user, companyId, branchId);
    return this.service.listMachines(scope.companyId, scope.branchId, {
      departmentId,
      productionLineId,
      machineType,
      status,
      search,
    });
  }

  @Get('machine-management/maintenance/due')
  @Permissions('workforce.read')
  getMaintenanceDueSummary(
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const scope = getWorkforceTenantScope(user, companyId, branchId);
    return this.service.getMaintenanceDueSummary(scope.companyId, scope.branchId);
  }

  @Get('machine-management/scan/:qrToken')
  @Permissions('workforce.read')
  getMachineByQrToken(@Param('qrToken') qrToken: string) {
    return this.service.getMachineByQrToken(qrToken);
  }

  @Get('machines/:id')
  @Permissions('workforce.read')
  getMachineById(@Param('id') id: string) {
    return this.service.getMachineById(id);
  }

  @Post('machines/:id/regenerate-qr')
  @Permissions('workforce.write')
  regenerateQrToken(@Param('id') id: string) {
    return this.service.regenerateQrToken(id);
  }

  @Post('machines')
  @Permissions('workforce.write')
  createMachine(
    @Body() dto: CreateMachineDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const scope = getWorkforceTenantScope(user, dto.companyId, dto.branchId || undefined);
    return this.service.createMachine(dto, scope.companyId, scope.branchId);
  }

  @Patch('machines/:id')
  @Permissions('workforce.write')
  updateMachine(
    @Param('id') id: string,
    @Body() dto: UpdateMachineDto,
  ) {
    return this.service.updateMachine(id, dto);
  }

  @Delete('machines/:id')
  @Permissions('workforce.write')
  deleteMachine(@Param('id') id: string) {
    return this.service.deleteMachine(id);
  }

  @Post('machines/:id/report-breakdown')
  @Permissions('workforce.write')
  reportBreakdown(
    @Param('id') id: string,
    @Body() dto: { reason: string; breakdownDateTime?: string; remarks?: string; technicianName?: string },
  ) {
    return this.service.reportBreakdown(id, dto);
  }

  @Post('machines/:id/mark-away')
  @Permissions('workforce.write')
  markOperatorAway(
    @Param('id') id: string,
    @Body() dto: { reason?: string; awayTime?: string },
  ) {
    return this.service.markOperatorAway(id, dto);
  }

  @Post('machines/:id/resume-work')
  @Permissions('workforce.write')
  resumeOperatorWork(@Param('id') id: string) {
    return this.service.resumeOperatorWork(id);
  }

  @Post('machines/:id/power-switch')
  @Permissions('workforce.write')
  switchPowerStatus(
    @Param('id') id: string,
    @Body() body: { status: 'OFFLINE' | 'ACTIVE' },
  ) {
    return this.service.switchPowerStatus(id, body.status);
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Production Lines
  // ─────────────────────────────────────────────────────────────
  @Get('production-lines')
  @Permissions('workforce.read')
  listProductionLines(
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
    @Query('departmentId') departmentId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const scope = getWorkforceTenantScope(user, companyId, branchId);
    return this.service.listProductionLines(scope.companyId, scope.branchId, {
      departmentId,
      status,
      search,
    });
  }

  @Post('production-lines')
  @Permissions('workforce.write')
  createProductionLine(
    @Body() dto: CreateProductionLineDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const scope = getWorkforceTenantScope(user, dto.companyId, dto.branchId || undefined);
    return this.service.createProductionLine(dto, scope.companyId, scope.branchId);
  }

  @Patch('production-lines/:id')
  @Permissions('workforce.write')
  updateProductionLine(
    @Param('id') id: string,
    @Body() dto: UpdateProductionLineDto,
  ) {
    return this.service.updateProductionLine(id, dto);
  }

  @Delete('production-lines/:id')
  @Permissions('workforce.write')
  deleteProductionLine(@Param('id') id: string) {
    return this.service.deleteProductionLine(id);
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Machine Operators
  // ─────────────────────────────────────────────────────────────
  @Get('machine-operators')
  @Permissions('workforce.read')
  listOperators(
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
    @Query('operatorType') operatorType?: string,
    @Query('skill') skill?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const scope = getWorkforceTenantScope(user, companyId, branchId);
    return this.service.listOperators(scope.companyId, scope.branchId, {
      operatorType,
      skill,
      status,
      search,
    });
  }

  @Get('machine-operators/:id')
  @Permissions('workforce.read')
  getOperatorById(@Param('id') id: string) {
    return this.service.getOperatorById(id);
  }

  @Post('machine-operators')
  @Permissions('workforce.write')
  createOperator(
    @Body() dto: CreateMachineOperatorDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const scope = getWorkforceTenantScope(user, dto.companyId, dto.branchId || undefined);
    return this.service.createOperator(dto, scope.companyId, scope.branchId);
  }

  @Patch('machine-operators/:id')
  @Permissions('workforce.write')
  updateOperator(
    @Param('id') id: string,
    @Body() dto: UpdateMachineOperatorDto,
  ) {
    return this.service.updateOperator(id, dto);
  }

  @Delete('machine-operators/:id')
  @Permissions('workforce.write')
  deleteOperator(@Param('id') id: string) {
    return this.service.deleteOperator(id);
  }

  // ─────────────────────────────────────────────────────────────
  // 5. Machine Allocations
  // ─────────────────────────────────────────────────────────────
  @Get('machine-allocations')
  @Permissions('workforce.read')
  listAllocations(
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
    @Query('productionLineId') productionLineId?: string,
    @Query('machineId') machineId?: string,
    @Query('operatorId') operatorId?: string,
    @Query('shift') shift?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const scope = getWorkforceTenantScope(user, companyId, branchId);
    return this.service.listAllocations(scope.companyId, scope.branchId, {
      productionLineId,
      machineId,
      operatorId,
      shift,
      status,
      search,
    });
  }

  @Post('machine-allocations')
  @Permissions('workforce.write')
  createAllocation(
    @Body() dto: CreateMachineAllocationDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const scope = getWorkforceTenantScope(user, dto.companyId, dto.branchId || undefined);
    return this.service.createAllocation(dto, scope.companyId, scope.branchId);
  }

  @Post('machine-allocations/:id/complete')
  @Permissions('workforce.write')
  completeAllocation(@Param('id') id: string) {
    return this.service.completeAllocation(id);
  }

  @Post('machine-allocations/:id/cancel')
  @Permissions('workforce.write')
  cancelAllocation(@Param('id') id: string) {
    return this.service.cancelAllocation(id);
  }

  @Delete('machine-allocations/:id')
  @Permissions('workforce.write')
  deleteAllocation(@Param('id') id: string) {
    return this.service.deleteAllocation(id);
  }

  // ─────────────────────────────────────────────────────────────
  // 6. Machine Maintenance
  // ─────────────────────────────────────────────────────────────
  @Get('machine-maintenances')
  @Permissions('workforce.read')
  listMaintenances(
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
    @Query('machineId') machineId?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const scope = getWorkforceTenantScope(user, companyId, branchId);
    return this.service.listMaintenances(scope.companyId, scope.branchId, {
      machineId,
      status,
      search,
    });
  }

  @Post('machine-maintenances/start')
  @Permissions('workforce.write')
  startMaintenance(
    @Body() dto: StartMachineMaintenanceDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const scope = getWorkforceTenantScope(user, dto.companyId, dto.branchId || undefined);
    return this.service.startMaintenance(dto, scope.companyId, scope.branchId);
  }

  @Post('machine-maintenances/:id/complete')
  @Permissions('workforce.write')
  completeMaintenance(
    @Param('id') id: string,
    @Body() dto: CompleteMachineMaintenanceDto,
  ) {
    return this.service.completeMaintenance(id, dto);
  }

  @Delete('machine-maintenances/:id')
  @Permissions('workforce.write')
  deleteMaintenance(@Param('id') id: string) {
    return this.service.deleteMaintenance(id);
  }

  // ─────────────────────────────────────────────────────────────
  // 7. Capacity UOM Master (Database Endpoints)
  // ─────────────────────────────────────────────────────────────
  @Get('capacity-uoms')
  @Permissions('workforce.read')
  listCapacityUoms(
    @Query('companyId') companyId?: string,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.service.listCapacityUoms(companyId, search, category);
  }

  @Get('capacity-uoms/:id')
  @Permissions('workforce.read')
  getCapacityUomById(@Param('id') id: string) {
    return this.service.getCapacityUomById(id);
  }

  @Post('capacity-uoms')
  @Permissions('workforce.write')
  createCapacityUom(
    @Body() dto: CreateCapacityUomDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const scope = getWorkforceTenantScope(user, dto.companyId);
    return this.service.createCapacityUom({
      ...dto,
      companyId: scope.companyId || dto.companyId,
    });
  }

  @Patch('capacity-uoms/:id')
  @Permissions('workforce.write')
  updateCapacityUom(
    @Param('id') id: string,
    @Body() dto: UpdateCapacityUomDto,
  ) {
    return this.service.updateCapacityUom(id, dto);
  }

  @Delete('capacity-uoms/:id')
  @Permissions('workforce.write')
  deleteCapacityUom(@Param('id') id: string) {
    return this.service.deleteCapacityUom(id);
  }
}
