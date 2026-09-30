import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AllocateAssetDto, CreateAssetDto, ReturnAssetDto, UpdateAssetDto } from './dto/asset.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { getTenantCompanyId, getTenantBranchId } from '../../common/utils/tenant-context.util';

@Controller('asset-management/assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  @Permissions('asset_management.read')
  list(
    @CurrentUser() user?: CurrentUserPayload,
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
  ) {
    const effectiveCompanyId = getTenantCompanyId(user, companyId);
    let tenantBranchId = getTenantBranchId(user, branchId);
    if (!tenantBranchId && (branchId === 'HEAD_OFFICE' || branchId === 'NONE')) {
      tenantBranchId = 'HEAD_OFFICE';
    }
    return this.assetsService.list(effectiveCompanyId, tenantBranchId);
  }

  @Get(':id')
  @Permissions('asset_management.read')
  findOne(@Param('id') id: string, @CurrentUser() user?: CurrentUserPayload) {
    return this.assetsService.findById(id, user);
  }

  @Post()
  @Permissions('asset_management.write')
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateAssetDto) {
    return this.assetsService.create(dto, user);
  }

  @Patch(':id')
  @Permissions('asset_management.write')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAssetDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.assetsService.update(id, dto, user);
  }

  @Delete(':id')
  @Permissions('asset_management.write')
  remove(@Param('id') id: string, @CurrentUser() user?: CurrentUserPayload) {
    return this.assetsService.remove(id, user);
  }

  @Post(':id/allocate')
  @Permissions('asset_management.write')
  allocate(
    @Param('id') id: string,
    @Body() dto: AllocateAssetDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.assetsService.allocate(id, dto, user);
  }

  @Post(':id/return')
  @Permissions('asset_management.write')
  returnAsset(
    @Param('id') id: string,
    @CurrentUser() user?: CurrentUserPayload,
    @Body() dto?: ReturnAssetDto,
  ) {
    return this.assetsService.returnAsset(id, dto, user);
  }
}
