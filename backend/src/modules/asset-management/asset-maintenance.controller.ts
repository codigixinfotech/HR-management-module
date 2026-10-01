import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AssetMaintenanceService } from './asset-maintenance.service';
import { CreateAssetMaintenanceDto, CompleteAssetMaintenanceDto } from './dto/asset-maintenance.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { getTenantCompanyId, getTenantBranchId } from '../../common/utils/tenant-context.util';

@Controller('asset-management/maintenance')
export class AssetMaintenanceController {
  constructor(private readonly assetMaintenanceService: AssetMaintenanceService) {}

  @Get()
  @Permissions('asset_management.read')
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query('assetId') assetId?: string,
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    let tenantBranchId = getTenantBranchId(user, branchId);
    if (!tenantBranchId && (branchId === 'HEAD_OFFICE' || branchId === 'NONE')) {
      tenantBranchId = 'HEAD_OFFICE';
    }
    return this.assetMaintenanceService.list(assetId, tenantCompanyId, tenantBranchId);
  }

  @Get('recoveries')
  @Permissions('asset_management.read')
  listRecoveries(
    @CurrentUser() user: CurrentUserPayload,
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    const tenantCompanyId = getTenantCompanyId(user, companyId);
    const tenantBranchId = getTenantBranchId(user, branchId);
    return this.assetMaintenanceService.listRecoveries(tenantCompanyId, tenantBranchId, employeeId);
  }

  @Post()
  @Permissions('asset_management.write')
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateAssetMaintenanceDto) {
    return this.assetMaintenanceService.create(dto, user);
  }

  @Post(':id/complete')
  @Permissions('asset_management.write')
  complete(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto?: CompleteAssetMaintenanceDto,
  ) {
    return this.assetMaintenanceService.complete(id, dto, user);
  }
}

