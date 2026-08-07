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
exports.ShiftTypesController = void 0;
const common_1 = require("@nestjs/common");
const shift_types_service_1 = require("./shift-types.service");
const shift_type_dto_1 = require("./dto/shift-type.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let ShiftTypesController = class ShiftTypesController {
    shiftTypesService;
    constructor(shiftTypesService) {
        this.shiftTypesService = shiftTypesService;
    }
    list(companyId) {
        return this.shiftTypesService.list(companyId);
    }
    findOne(id) {
        return this.shiftTypesService.findById(id);
    }
    create(dto) {
        return this.shiftTypesService.create(dto);
    }
    update(id, dto) {
        return this.shiftTypesService.update(id, dto);
    }
    remove(id) {
        return this.shiftTypesService.remove(id);
    }
};
exports.ShiftTypesController = ShiftTypesController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('workforce.read'),
    __param(0, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ShiftTypesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('workforce.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ShiftTypesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('workforce.write'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shift_type_dto_1.CreateShiftTypeDto]),
    __metadata("design:returntype", void 0)
], ShiftTypesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('workforce.write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, shift_type_dto_1.UpdateShiftTypeDto]),
    __metadata("design:returntype", void 0)
], ShiftTypesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('workforce.write'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ShiftTypesController.prototype, "remove", null);
exports.ShiftTypesController = ShiftTypesController = __decorate([
    (0, common_1.Controller)('workforce/shift-types'),
    __metadata("design:paramtypes", [shift_types_service_1.ShiftTypesService])
], ShiftTypesController);
//# sourceMappingURL=shift-types.controller.js.map