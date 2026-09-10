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
  ) {
    return this.lifecycleService.getRoster(companyId, startDate, endDate);
  }

  @Post('roster/slot')
  @Permissions('workforce.write')
  saveRosterSlot(@Body() dto: any) {
    return this.lifecycleService.saveRosterSlot(dto);
  }

  @Post('roster/bulk-assign')
  @Permissions('workforce.write')
  bulkAutoAssign(@Body() dto: any) {
    return this.lifecycleService.bulkAutoAssign(dto);
  }

  @Post('roster/publish')
  @Permissions('workforce.write')
  publishRosterBatch(@Body() dto: any) {
    return this.lifecycleService.publishRosterBatch(dto);
  }

  // 2. Rotations
  @Get('rotations')
  @Permissions('workforce.read')
  getRotations(@Query('companyId') companyId?: string) {
    return this.lifecycleService.getRotations(companyId);
  }

  @Post('rotations')
  @Permissions('workforce.write')
  createRotation(@Body() dto: any) {
    return this.lifecycleService.createRotation(dto);
  }

  @Post('rotations/:id/advance')
  @Permissions('workforce.write')
  advanceRotation(@Param('id') id: string) {
    return this.lifecycleService.advanceRotation(id);
  }

  // 3. Shift Changes
  @Get('shift-changes')
  @Permissions('workforce.read')
  getShiftChanges(@Query('companyId') companyId?: string) {
    return this.lifecycleService.getShiftChanges(companyId);
  }

  @Post('shift-changes')
  @Permissions('workforce.write')
  createShiftChange(@Body() dto: any) {
    return this.lifecycleService.createShiftChange(dto);
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
  getShiftSwaps(@Query('companyId') companyId?: string) {
    return this.lifecycleService.getShiftSwaps(companyId);
  }

  @Post('shift-swaps')
  @Permissions('workforce.write')
  createShiftSwap(@Body() dto: any) {
    return this.lifecycleService.createShiftSwap(dto);
  }

  @Patch('shift-swaps/:id/resolve')
  @Permissions('workforce.write')
  resolveShiftSwap(
    @Param('id') id: string,
    @Body() body: { status: 'Approved' | 'Rejected' },
  ) {
    return this.lifecycleService.resolveShiftSwap(id, body.status);
  }

  // 5. Batches
  @Get('batches')
  @Permissions('workforce.read')
  getBatches(@Query('companyId') companyId?: string) {
    return this.lifecycleService.getBatches(companyId);
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
