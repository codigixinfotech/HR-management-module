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
exports.ManpowerPlansController = void 0;
const common_1 = require("@nestjs/common");
const manpower_plans_service_1 = require("./manpower-plans.service");
const manpower_plan_dto_1 = require("./dto/manpower-plan.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let ManpowerPlansController = class ManpowerPlansController {
    manpowerPlansService;
    constructor(manpowerPlansService) {
        this.manpowerPlansService = manpowerPlansService;
    }
    list(companyId) {
        return this.manpowerPlansService.list(companyId);
    }
    countActive(departmentName, role, companyId, departmentId, designationId) {
        return this.manpowerPlansService.countActiveStaff(departmentName, role, companyId, departmentId, designationId);
    }
    findOne(id) {
        return this.manpowerPlansService.findOne(id);
    }
    create(dto) {
        return this.manpowerPlansService.create(dto);
    }
    update(id, dto) {
        return this.manpowerPlansService.update(id, dto);
    }
    remove(id) {
        return this.manpowerPlansService.remove(id);
    }
};
exports.ManpowerPlansController = ManpowerPlansController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('recruitment.read'),
    __param(0, (0, common_1.Query)('companyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ManpowerPlansController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('count-active'),
    (0, permissions_decorator_1.Permissions)('recruitment.read'),
    __param(0, (0, common_1.Query)('departmentName')),
    __param(1, (0, common_1.Query)('role')),
    __param(2, (0, common_1.Query)('companyId')),
    __param(3, (0, common_1.Query)('departmentId')),
    __param(4, (0, common_1.Query)('designationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], ManpowerPlansController.prototype, "countActive", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('recruitment.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ManpowerPlansController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('recruitment.write'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [manpower_plan_dto_1.CreateManpowerPlanDto]),
    __metadata("design:returntype", void 0)
], ManpowerPlansController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('recruitment.write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, manpower_plan_dto_1.UpdateManpowerPlanDto]),
    __metadata("design:returntype", void 0)
], ManpowerPlansController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('recruitment.write'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ManpowerPlansController.prototype, "remove", null);
exports.ManpowerPlansController = ManpowerPlansController = __decorate([
    (0, common_1.Controller)('recruitment/manpower-plans'),
    __metadata("design:paramtypes", [manpower_plans_service_1.ManpowerPlansService])
], ManpowerPlansController);
//# sourceMappingURL=manpower-plans.controller.js.map