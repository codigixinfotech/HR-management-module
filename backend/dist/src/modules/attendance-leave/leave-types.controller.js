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
exports.LeaveTypesController = void 0;
const common_1 = require("@nestjs/common");
const leave_types_service_1 = require("./leave-types.service");
const leave_type_dto_1 = require("./dto/leave-type.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let LeaveTypesController = class LeaveTypesController {
    leaveTypesService;
    constructor(leaveTypesService) {
        this.leaveTypesService = leaveTypesService;
    }
    list(companyId) {
        return this.leaveTypesService.list(companyId);
    }
    findOne(id) {
        return this.leaveTypesService.findById(id);
    }
    create(dto) {
        return this.leaveTypesService.create(dto);
    }
    update(id, dto) {
        return this.leaveTypesService.update(id, dto);
    }
    remove(id) {
        return this.leaveTypesService.remove(id);
    }
};
exports.LeaveTypesController = LeaveTypesController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('attendance_leave.read'),
    __param(0, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LeaveTypesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('attendance_leave.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LeaveTypesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('attendance_leave.write'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [leave_type_dto_1.CreateLeaveTypeDto]),
    __metadata("design:returntype", void 0)
], LeaveTypesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('attendance_leave.write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, leave_type_dto_1.UpdateLeaveTypeDto]),
    __metadata("design:returntype", void 0)
], LeaveTypesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('attendance_leave.write'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LeaveTypesController.prototype, "remove", null);
exports.LeaveTypesController = LeaveTypesController = __decorate([
    (0, common_1.Controller)('attendance-leave/leave-types'),
    __metadata("design:paramtypes", [leave_types_service_1.LeaveTypesService])
], LeaveTypesController);
//# sourceMappingURL=leave-types.controller.js.map