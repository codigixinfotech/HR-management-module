import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { AssetMaintenanceController } from './asset-maintenance.controller';
import { AssetMaintenanceService } from './asset-maintenance.service';

@Module({
  controllers: [AssetsController, AssetMaintenanceController],
  providers: [AssetsService, AssetMaintenanceService],
  exports: [AssetsService, AssetMaintenanceService],
})
export class AssetManagementModule {}
