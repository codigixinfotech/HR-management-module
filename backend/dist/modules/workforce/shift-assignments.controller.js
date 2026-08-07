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
exports.ShiftAssignmentsController = void 0;
const common_1 = require("@nestjs/common");
const shift_assignments_service_1 = require("./shift-assignments.service");
const shift_assignment_dto_1 = require("./dto/shift-assignment.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let ShiftAssignmentsController = class ShiftAssignmentsController {
    shiftAssignmentsService;
    constructor(shiftAssignmentsService) {
        this.shiftAssignmentsService = shiftAssignmentsService;
    }
    list(employeeId, shiftTypeId) {
        return this.shiftAssignmentsService.list(employeeId, shiftTypeId);
    }
    findOne(id) {
        return this.shiftAssignmentsService.findById(id);
    }
    create(dto) {
        return this.shiftAssignmentsService.create(dto);
    }
    update(id, dto) {
        return this.shiftAssignmentsService.update(id, dto);
    }
    remove(id) {
        return this.shiftAssignmentsService.remove(id);
    }
};
exports.ShiftAssignmentsController = ShiftAssignmentsController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('workforce.read'),
    __param(0, (0, common_1.Query)('employeeId')),
    __param(1, (0, common_1.Query)('shiftTypeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ShiftAssignmentsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('workforce.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ShiftAssignmentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('workforce.write'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shift_assignment_dto_1.CreateShiftAssignmentDto]),
    __metadata("design:returntype", void 0)
], ShiftAssignmentsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('workforce.write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shift_assignment_dto_1.UpdateShiftAssignmentDto]),
    __metadata("design:returntype", void 0)
], ShiftAssignmentsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('workforce.write'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ShiftAssignmentsController.prototype, "remove", null);
exports.ShiftAssignmentsController = ShiftAssignmentsController = __decorate([
    (0, common_1.Controller)('workforce/shift-assignments'),
    __metadata("design:paramtypes", [shift_assignments_service_1.ShiftAssignmentsService])
], ShiftAssignmentsController);
//# sourceMappingURL=shift-assignments.controller.js.map