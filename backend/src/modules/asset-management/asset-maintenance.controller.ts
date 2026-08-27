import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AssetMaintenanceService } from './asset-maintenance.service';
import { CreateAssetMaintenanceDto, CompleteAssetMaintenanceDto } from './dto/asset-maintenance.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('asset-management/maintenance')
export class AssetMaintenanceController {
  constructor(private readonly assetMaintenanceService: AssetMaintenanceService) {}

  @Get()
  @Permissions('asset_management.read')
  list(@Query('assetId') assetId?: string) {
    return this.assetMaintenanceService.list(assetId);
  }

  @Post()
  @Permissions('asset_management.write')
  create(@Body() dto: CreateAssetMaintenanceDto) {
    return this.assetMaintenanceService.create(dto);
  }

  @Post(':id/complete')
  @Permissions('asset_management.write')
  complete(@Param('id') id: string, @Body() dto?: CompleteAssetMaintenanceDto) {
    return this.assetMaintenanceService.complete(id, dto);
  }
}
