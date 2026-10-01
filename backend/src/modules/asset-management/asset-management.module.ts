import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { AssetMaintenanceController } from './asset-maintenance.controller';
import { AssetMaintenanceService } from './asset-maintenance.service';
import { AssetRequestsController } from './asset-requests.controller';
import { AssetRequestsService } from './asset-requests.service';

import { AssetMaintenanceRequestsController } from './asset-maintenance-requests.controller';
import { AssetMaintenanceRequestsService } from './asset-maintenance-requests.service';

@Module({
  controllers: [
    AssetsController,
    AssetMaintenanceController,
    AssetRequestsController,
    AssetMaintenanceRequestsController,
  ],
  providers: [
    AssetsService,
    AssetMaintenanceService,
    AssetRequestsService,
    AssetMaintenanceRequestsService,
  ],
  exports: [
    AssetsService,
    AssetMaintenanceService,
    AssetRequestsService,
    AssetMaintenanceRequestsService,
  ],
})
export class AssetManagementModule {}
