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
exports.LeaveBalancesController = void 0;
const common_1 = require("@nestjs/common");
const leave_balances_service_1 = require("./leave-balances.service");
const leave_balance_dto_1 = require("./dto/leave-balance.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let LeaveBalancesController = class LeaveBalancesController {
    leaveBalancesService;
    constructor(leaveBalancesService) {
        this.leaveBalancesService = leaveBalancesService;
    }
    list(employeeId, year) {
        return this.leaveBalancesService.list(employeeId, year ? Number(year) : undefined);
    }
    allocate(dto) {
        return this.leaveBalancesService.allocate(dto);
    }
};
exports.LeaveBalancesController = LeaveBalancesController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('attendance_leave.read'),
    __param(0, (0, common_1.Query)('employeeId')),
    __param(1, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], LeaveBalancesController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('attendance_leave.write'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [leave_balance_dto_1.AllocateLeaveBalanceDto]),
    __metadata("design:returntype", void 0)
], LeaveBalancesController.prototype, "allocate", null);
exports.LeaveBalancesController = LeaveBalancesController = __decorate([
    (0, common_1.Controller)('attendance-leave/leave-balances'),
    __metadata("design:paramtypes", [leave_balances_service_1.LeaveBalancesService])
], LeaveBalancesController);
//# sourceMappingURL=leave-balances.controller.js.map