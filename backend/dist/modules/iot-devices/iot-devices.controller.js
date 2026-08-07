"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IotDevicesController = void 0;
const common_1 = require("@nestjs/common");
const iot_devices_service_1 = require("./iot-devices.service");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let IotDevicesController = class IotDevicesController {
    iotDevicesService;
    constructor(iotDevicesService) {
        this.iotDevicesService = iotDevicesService;
    }
    getStatus() {
        return this.iotDevicesService.getStatus();
    }
};
exports.IotDevicesController = IotDevicesController;
__decorate([
    (0, common_1.Get)('status'),
    (0, permissions_decorator_1.Permissions)('iot_devices.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], IotDevicesController.prototype, "getStatus", null);
exports.IotDevicesController = IotDevicesController = __decorate([
    (0, common_1.Controller)('iot-devices'),
    __metadata("design:paramtypes", [iot_devices_service_1.IotDevicesService])
], IotDevicesController);
//# sourceMappingURL=iot-devices.controller.js.map