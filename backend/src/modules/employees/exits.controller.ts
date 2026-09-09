import {
  Body,
  Controller,
  Delete,
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
import { getTenantCompanyId } from '../../common/utils/tenant-context.util';

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
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.service.getKpis(tenantCompanyId);
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
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.service.findAll(search, status, tenantCompanyId);
  }

  @Get(':id')
  @Permissions('employees.read')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/recalculate-clearance')
  @Permissions('employees.write')
  recalculateClearance(
    @Param('id') id: string,
    @Body('performedBy') performedBy?: string,
  ) {
    return this.service.recalculateClearance(id, performedBy);
  }

  @Post()
  @Permissions('employees.write')
  create(@Body() dto: CreateExitDto) {
    return this.service.create(dto);
  }

  @Patch(':id/status')
  @Permissions('employees.write')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateExitStatusDto) {
    return this.service.updateStatus(id, dto);
  }

  @Patch(':id/adjust-lwd')
  @Permissions('employees.write')
  adjustLwd(@Param('id') id: string, @Body() dto: AdjustLwdDto) {
    return this.service.adjustLwd(id, dto);
  }

  @Patch('clearance/:itemId')
  @Permissions('employees.write')
  updateClearanceItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateClearanceItemDto,
  ) {
    return this.service.updateClearanceItem(itemId, dto);
  }

  @Post(':id/exit-interview')
  @Permissions('employees.write')
  saveExitInterview(
    @Param('id') id: string,
    @Body() dto: SaveExitInterviewDto,
  ) {
    return this.service.saveExitInterview(id, dto);
  }

  @Post(':id/fnf')
  @Permissions('employees.write')
  saveFnfSettlement(
    @Param('id') id: string,
    @Body() dto: SaveFnfSettlementDto,
  ) {
    return this.service.saveFnfSettlement(id, dto);
  }

  @Post(':id/complete-exit')
  @Permissions('employees.write')
  completeExit(
    @Param('id') id: string,
    @Body('performedBy') performedBy?: string,
  ) {
    return this.service.completeExit(id, performedBy);
  }

  @Delete(':id')
  @Permissions('employees.write')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
