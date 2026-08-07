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
exports.ReportsAnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const reports_analytics_service_1 = require("./reports-analytics.service");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let ReportsAnalyticsController = class ReportsAnalyticsController {
    reportsAnalyticsService;
    constructor(reportsAnalyticsService) {
        this.reportsAnalyticsService = reportsAnalyticsService;
    }
    getStatus() {
        return this.reportsAnalyticsService.getStatus();
    }
};
exports.ReportsAnalyticsController = ReportsAnalyticsController;
__decorate([
    (0, common_1.Get)('status'),
    (0, permissions_decorator_1.Permissions)('reports_analytics.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ReportsAnalyticsController.prototype, "getStatus", null);
exports.ReportsAnalyticsController = ReportsAnalyticsController = __decorate([
    (0, common_1.Controller)('reports-analytics'),
    __metadata("design:paramtypes", [reports_analytics_service_1.ReportsAnalyticsService])
], ReportsAnalyticsController);
//# sourceMappingURL=reports-analytics.controller.js.map