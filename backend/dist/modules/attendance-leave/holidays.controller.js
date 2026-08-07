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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HolidaysController = void 0;
const common_1 = require("@nestjs/common");
const holidays_service_1 = require("./holidays.service");
const holiday_dto_1 = require("./dto/holiday.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let HolidaysController = class HolidaysController {
    holidaysService;
    constructor(holidaysService) {
        this.holidaysService = holidaysService;
    }
    list(companyId, year) {
        return this.holidaysService.list(companyId, year ? Number(year) : undefined);
    }
    findOne(id) {
        return this.holidaysService.findById(id);
    }
    create(dto) {
        return this.holidaysService.create(dto);
    }
    update(id, dto) {
        return this.holidaysService.update(id, dto);
    }
    remove(id) {
        return this.holidaysService.remove(id);
    }
};
exports.HolidaysController = HolidaysController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('attendance_leave.read'),
    __param(0, (0, common_1.Query)('companyId')),
    __param(1, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], HolidaysController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('attendance_leave.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HolidaysController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('attendance_leave.write'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [holiday_dto_1.CreateHolidayDto]),
    __metadata("design:returntype", void 0)
], HolidaysController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('attendance_leave.write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, holiday_dto_1.UpdateHolidayDto]),
    __metadata("design:returntype", void 0)
], HolidaysController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('attendance_leave.write'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HolidaysController.prototype, "remove", null);
exports.HolidaysController = HolidaysController = __decorate([
    (0, common_1.Controller)('attendance-leave/holidays'),
    __metadata("design:paramtypes", [holidays_service_1.HolidaysService])
], HolidaysController);
//# sourceMappingURL=holidays.controller.js.map