import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AssetRequestsService } from './asset-requests.service';
import {
  AllocateAssetRequestDto,
  CreateAssetRequestDto,
  ReviewAssetRequestDto,
  UpdateAssetRequestDto,
} from './dto/asset-request.dto';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { getTenantCompanyId, getTenantBranchId } from '../../common/utils/tenant-context.util';

@Controller('asset-management/requests')
export class AssetRequestsController {
  constructor(private readonly assetRequestsService: AssetRequestsService) {}

  @Get('my-requests')
  getMyRequests(@CurrentUser() user: CurrentUserPayload) {
    return this.assetRequestsService.getMyRequests(user);
  }

  @Get('my-assets')
  getMyAssets(@CurrentUser() user: CurrentUserPayload) {
    return this.assetRequestsService.getMyAssets(user);
  }

  @Get()
  list(
    @CurrentUser() user: CurrentUserPayload,
    @Query('companyId') companyId?: string,
    @Query('branchId') branchId?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    const effectiveCompanyId = getTenantCompanyId(user, companyId);
    let tenantBranchId = getTenantBranchId(user, branchId);
    if (!tenantBranchId && (branchId === 'HEAD_OFFICE' || branchId === 'NONE')) {
      tenantBranchId = 'HEAD_OFFICE';
    }

    return this.assetRequestsService.list(
      {
        companyId: effectiveCompanyId,
        branchId: tenantBranchId,
        status,
        category,
        employeeId,
      },
      user,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user?: CurrentUserPayload) {
    return this.assetRequestsService.findById(id, user);
  }

  @Post()
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateAssetRequestDto) {
    return this.assetRequestsService.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAssetRequestDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.assetRequestsService.update(id, dto, user);
  }

  @Post(':id/review')
  review(
    @Param('id') id: string,
    @Body() dto: ReviewAssetRequestDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.assetRequestsService.review(id, dto, user);
  }

  @Post(':id/waiting-procurement')
  markWaitingProcurement(@Param('id') id: string, @CurrentUser() user?: CurrentUserPayload) {
    return this.assetRequestsService.markWaitingProcurement(id, user);
  }

  @Post(':id/allocate')
  allocate(
    @Param('id') id: string,
    @Body() dto: AllocateAssetRequestDto,
    @CurrentUser() user?: CurrentUserPayload,
  ) {
    return this.assetRequestsService.allocate(id, dto, user);
  }
}
