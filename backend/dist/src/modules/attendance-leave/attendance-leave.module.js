"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceLeaveModule = void 0;
const common_1 = require("@nestjs/common");
const leave_types_controller_1 = require("./leave-types.controller");
const leave_types_service_1 = require("./leave-types.service");
const holidays_controller_1 = require("./holidays.controller");
const holidays_service_1 = require("./holidays.service");
const leave_balances_controller_1 = require("./leave-balances.controller");
const leave_balances_service_1 = require("./leave-balances.service");
const leave_requests_controller_1 = require("./leave-requests.controller");
const leave_requests_service_1 = require("./leave-requests.service");
const attendance_controller_1 = require("./attendance.controller");
const attendance_service_1 = require("./attendance.service");
let AttendanceLeaveModule = class AttendanceLeaveModule {
};
exports.AttendanceLeaveModule = AttendanceLeaveModule;
exports.AttendanceLeaveModule = AttendanceLeaveModule = __decorate([
    (0, common_1.Module)({
        controllers: [
            leave_types_controller_1.LeaveTypesController,
            holidays_controller_1.HolidaysController,
            leave_balances_controller_1.LeaveBalancesController,
            leave_requests_controller_1.LeaveRequestsController,
            attendance_controller_1.AttendanceController,
        ],
        providers: [
            leave_types_service_1.LeaveTypesService,
            holidays_service_1.HolidaysService,
            leave_balances_service_1.LeaveBalancesService,
            leave_requests_service_1.LeaveRequestsService,
            attendance_service_1.AttendanceService,
        ],
        exports: [
            leave_types_service_1.LeaveTypesService,
            holidays_service_1.HolidaysService,
            leave_balances_service_1.LeaveBalancesService,
            leave_requests_service_1.LeaveRequestsService,
            attendance_service_1.AttendanceService,
        ],
    })
], AttendanceLeaveModule);
//# sourceMappingURL=attendance-leave.module.js.map