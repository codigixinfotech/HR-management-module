import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ShiftLifecycleService } from './shift-lifecycle.service';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { getTenantCompanyId } from '../../common/utils/tenant-context.util';

@Controller('workforce')
export class ShiftLifecycleController {
  constructor(private readonly lifecycleService: ShiftLifecycleService) {}

  // 1. Roster
  @Get('roster')
  @Permissions('workforce.read')
  getRoster(
    @Query('companyId') companyId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.lifecycleService.getRoster(tenantCompanyId, startDate, endDate);
  }

  @Post('roster/slot')
  @Permissions('workforce.write')
  saveRosterSlot(@Body() dto: any, @CurrentUser() user?: CurrentUserPayload) {
    const tenantCompanyId = getTenantCompanyId(user, dto.companyId);
    return this.lifecycleService.saveRosterSlot({ ...dto, companyId: tenantCompanyId || dto.companyId });
  }

  @Post('roster/bulk-assign')
  @Permissions('workforce.write')
  bulkAutoAssign(@Body() dto: any, @CurrentUser() user?: CurrentUserPayload) {
    const tenantCompanyId = getTenantCompanyId(user, dto.companyId);
    return this.lifecycleService.bulkAutoAssign({ ...dto, companyId: tenantCompanyId || dto.companyId });
  }

  @Post('roster/publish')
  @Permissions('workforce.write')
  publishRosterBatch(@Body() dto: any, @CurrentUser() user?: CurrentUserPayload) {
    const tenantCompanyId = getTenantCompanyId(user, dto.companyId);
    return this.lifecycleService.publishRosterBatch({ ...dto, companyId: tenantCompanyId || dto.companyId });
  }

  // 2. Rotations
  @Get('rotations')
  @Permissions('workforce.read')
  getRotations(
    @Query('companyId') companyId?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.lifecycleService.getRotations(tenantCompanyId);
  }

  @Post('rotations')
  @Permissions('workforce.write')
  createRotation(@Body() dto: any, @CurrentUser() user?: CurrentUserPayload) {
    const tenantCompanyId = getTenantCompanyId(user, dto.companyId);
    return this.lifecycleService.createRotation({ ...dto, companyId: tenantCompanyId || dto.companyId });
  }

  @Post('rotations/:id/start')
  @Permissions('workforce.write')
  startRotation(@Param('id') id: string) {
    return this.lifecycleService.startRotation(id);
  }

  @Post('rotations/:id/pause')
  @Permissions('workforce.write')
  pauseRotation(@Param('id') id: string) {
    return this.lifecycleService.pauseRotation(id);
  }

  @Post('rotations/:id/advance')
  @Permissions('workforce.write')
  advanceRotation(@Param('id') id: string) {
    return this.lifecycleService.advanceRotation(id);
  }

  // 3. Shift Changes
  @Get('shift-changes')
  @Permissions('workforce.read')
  getShiftChanges(
    @Query('companyId') companyId?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.lifecycleService.getShiftChanges(tenantCompanyId);
  }

  @Post('shift-changes')
  @Permissions('workforce.write')
  createShiftChange(@Body() dto: any, @CurrentUser() user?: CurrentUserPayload) {
    const tenantCompanyId = getTenantCompanyId(user, dto.companyId);
    return this.lifecycleService.createShiftChange({ ...dto, companyId: tenantCompanyId || dto.companyId });
  }

  @Patch('shift-changes/:id/resolve')
  @Permissions('workforce.write')
  resolveShiftChange(
    @Param('id') id: string,
    @Body() body: { status: 'Approved' | 'Rejected' | 'Cancelled' | 'Pending Approval'; remarks?: string; actorName?: string },
  ) {
    return this.lifecycleService.resolveShiftChange(id, body.status, body.remarks, body.actorName);
  }

  // 4. Shift Swaps
  @Get('shift-swaps')
  @Permissions('workforce.read')
  getShiftSwaps(
    @Query('companyId') companyId?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.lifecycleService.getShiftSwaps(tenantCompanyId);
  }

  @Post('shift-swaps')
  @Permissions('workforce.write')
  createShiftSwap(@Body() dto: any, @CurrentUser() user?: CurrentUserPayload) {
    const tenantCompanyId = getTenantCompanyId(user, dto.companyId);
    return this.lifecycleService.createShiftSwap({ ...dto, companyId: tenantCompanyId || dto.companyId });
  }

  @Patch('shift-swaps/:id/resolve')
  @Permissions('workforce.write')
  resolveShiftSwap(
    @Param('id') id: string,
    @Body() body: { status: 'Approved' | 'Rejected'; remarks?: string; actorName?: string },
  ) {
    return this.lifecycleService.resolveShiftSwap(id, body.status, body.remarks, body.actorName);
  }

  @Patch('shift-swaps/:id/cancel')
  @Permissions('workforce.write')
  cancelShiftSwap(
    @Param('id') id: string,
    @Body() body: { reason?: string; actorName?: string },
  ) {
    return this.lifecycleService.cancelShiftSwap(id, body.reason, body.actorName);
  }

  // 5. Batches
  @Get('batches')
  @Permissions('workforce.read')
  getBatches(
    @Query('companyId') companyId?: string,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    return this.lifecycleService.getBatches(tenantCompanyId);
  }

  @Patch('batches/:id/status')
  @Permissions('workforce.write')
  resolveBatchStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.lifecycleService.resolveBatchStatus(id, body.status);
  }
}

