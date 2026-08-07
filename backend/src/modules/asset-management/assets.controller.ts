import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AssetsService } from './assets.service';
import { AllocateAssetDto, CreateAssetDto, UpdateAssetDto } from './dto/asset.dto';
import { Permissions } from '../../common/decorators/permissions.decorator';

@Controller('asset-management/assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  @Get()
  @Permissions('asset_management.read')
  list(@Query('companyId') companyId?: string) {
    return this.assetsService.list(companyId);
  }

  @Get(':id')
  @Permissions('asset_management.read')
  findOne(@Param('id') id: string) {
    return this.assetsService.findById(id);
  }

  @Post()
  @Permissions('asset_management.write')
  create(@Body() dto: CreateAssetDto) {
    return this.assetsService.create(dto);
  }

  @Patch(':id')
  @Permissions('asset_management.write')
  update(@Param('id') id: string, @Body() dto: UpdateAssetDto) {
    return this.assetsService.update(id, dto);
  }

  @Delete(':id')
  @Permissions('asset_management.write')
  remove(@Param('id') id: string) {
    return this.assetsService.remove(id);
  }

  @Post(':id/allocate')
  @Permissions('asset_management.write')
  allocate(@Param('id') id: string, @Body() dto: AllocateAssetDto) {
    return this.assetsService.allocate(id, dto);
  }

  @Post(':id/return')
  @Permissions('asset_management.write')
  returnAsset(@Param('id') id: string) {
    return this.assetsService.returnAsset(id);
  }
}
