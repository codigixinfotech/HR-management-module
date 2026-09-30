import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { AssetMaintenanceController } from './asset-maintenance.controller';
import { AssetMaintenanceService } from './asset-maintenance.service';
import { AssetRequestsController } from './asset-requests.controller';
import { AssetRequestsService } from './asset-requests.service';

@Module({
  controllers: [AssetsController, AssetMaintenanceController, AssetRequestsController],
  providers: [AssetsService, AssetMaintenanceService, AssetRequestsService],
  exports: [AssetsService, AssetMaintenanceService, AssetRequestsService],
})
export class AssetManagementModule {}
