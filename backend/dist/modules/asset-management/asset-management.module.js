"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AssetManagementModule = void 0;
const common_1 = require("@nestjs/common");
const assets_controller_1 = require("./assets.controller");
const assets_service_1 = require("./assets.service");
const asset_maintenance_controller_1 = require("./asset-maintenance.controller");
const asset_maintenance_service_1 = require("./asset-maintenance.service");
let AssetManagementModule = class AssetManagementModule {
};
exports.AssetManagementModule = AssetManagementModule;
exports.AssetManagementModule = AssetManagementModule = __decorate([
    (0, common_1.Module)({
        controllers: [assets_controller_1.AssetsController, asset_maintenance_controller_1.AssetMaintenanceController],
        providers: [assets_service_1.AssetsService, asset_maintenance_service_1.AssetMaintenanceService],
        exports: [assets_service_1.AssetsService, asset_maintenance_service_1.AssetMaintenanceService],
    })
], AssetManagementModule);
//# sourceMappingURL=asset-management.module.js.map