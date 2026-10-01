import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AssetMaintenanceRequestsService } from './asset-maintenance-requests.service';
import {
  CreateAssetMaintenanceRequestDto,
  InspectMaintenanceRequestDto,
  UpdateMaintenanceRequestStatusDto,
  CreateWorkOrderFromRequestDto,
} from './dto/asset-maintenance-request.dto';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { getTenantCompanyId, getTenantBranchId } from '../../common/utils/tenant-context.util';

@Controller('asset-management/maintenance-requests')
export class AssetMaintenanceRequestsController {
  constructor(
    private readonly maintenanceRequestsService: AssetMaintenanceRequestsService,
  ) {}

  @Post()
  create(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateAssetMaintenanceRequestDto,
  ) {
    return this.maintenanceRequestsService.create(dto, user);
  }

  @Get('my')
  getMyRequests(@CurrentUser() user: CurrentUserPayload) {
    return this.maintenanceRequestsService.listMyRequests(user);
  }

  @Get()
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('assetId') assetId?: string,
  ) {
    const effectiveCompanyId = getTenantCompanyId(user, companyId);
    let tenantBranchId = getTenantBranchId(user, branchId);
    if (!tenantBranchId && (branchId === 'HEAD_OFFICE' || branchId === 'NONE')) {
      tenantBranchId = 'HEAD_OFFICE';
    }

    return this.maintenanceRequestsService.list(
      {
        companyId: effectiveCompanyId,
        branchId: tenantBranchId,
        status,
        priority,
        assetId,
      },
      user,
    );
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.maintenanceRequestsService.getById(id);
  }

  @Patch(':id/inspect')
  inspect(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: InspectMaintenanceRequestDto,
  ) {
    return this.maintenanceRequestsService.inspect(id, dto, user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateMaintenanceRequestStatusDto,
  ) {
    return this.maintenanceRequestsService.updateStatus(id, dto, user);
  }

  @Post(':id/create-work-order')
  createWorkOrder(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateWorkOrderFromRequestDto,
  ) {
    return this.maintenanceRequestsService.createWorkOrder(id, dto, user);
  }
}
