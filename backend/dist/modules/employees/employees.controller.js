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
exports.EmployeesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const client_1 = require("@prisma/client");
const employees_service_1 = require("./employees.service");
const onboarding_service_1 = require("./onboarding.service");
const employee_dto_1 = require("./dto/employee.dto");
const onboarding_task_dto_1 = require("./dto/onboarding-task.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const multer_config_1 = require("./multer.config");
let EmployeesController = class EmployeesController {
    employeesService;
    onboardingService;
    constructor(employeesService, onboardingService) {
        this.employeesService = employeesService;
        this.onboardingService = onboardingService;
    }
    list(query) {
        return this.employeesService.list(query, query.companyId);
    }
    findOne(id) {
        return this.employeesService.findById(id);
    }
    create(dto) {
        return this.employeesService.create(dto);
    }
    update(id, dto) {
        return this.employeesService.update(id, dto);
    }
    remove(id) {
        return this.employeesService.remove(id);
    }
    listDocuments(id) {
        return this.employeesService.listDocuments(id);
    }
    uploadDocument(id, file, docType) {
        return this.employeesService.addDocument(id, docType, file.originalname, file.path);
    }
    removeDocument(id, documentId) {
        return this.employeesService.removeDocument(id, documentId);
    }
    listOnboardingTasks(id) {
        return this.onboardingService.listForEmployee(id);
    }
    createOnboardingTask(id, dto) {
        return this.onboardingService.createTask(id, dto);
    }
    updateOnboardingTaskStatus(taskId, status) {
        return this.onboardingService.updateStatus(taskId, status);
    }
};
exports.EmployeesController = EmployeesController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.Permissions)('employees.read'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [employee_dto_1.ListEmployeesQueryDto]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, permissions_decorator_1.Permissions)('employees.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, permissions_decorator_1.Permissions)('employees.write'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [employee_dto_1.CreateEmployeeDto]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, permissions_decorator_1.Permissions)('employees.write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, employee_dto_1.UpdateEmployeeDto]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, permissions_decorator_1.Permissions)('employees.write'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(':id/documents'),
    (0, permissions_decorator_1.Permissions)('employees.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "listDocuments", null);
__decorate([
    (0, common_1.Post)(':id/documents'),
    (0, permissions_decorator_1.Permissions)('employees.write'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { storage: multer_config_1.employeeDocumentStorage })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)('docType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "uploadDocument", null);
__decorate([
    (0, common_1.Delete)(':id/documents/:documentId'),
    (0, permissions_decorator_1.Permissions)('employees.write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('documentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "removeDocument", null);
__decorate([
    (0, common_1.Get)(':id/onboarding-tasks'),
    (0, permissions_decorator_1.Permissions)('employees.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "listOnboardingTasks", null);
__decorate([
    (0, common_1.Post)(':id/onboarding-tasks'),
    (0, permissions_decorator_1.Permissions)('employees.write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, onboarding_task_dto_1.CreateOnboardingTaskDto]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "createOnboardingTask", null);
__decorate([
    (0, common_1.Patch)('onboarding-tasks/:taskId/status'),
    (0, permissions_decorator_1.Permissions)('employees.write'),
    __param(0, (0, common_1.Param)('taskId')),
    __param(1, (0, common_1.Body)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], EmployeesController.prototype, "updateOnboardingTaskStatus", null);
exports.EmployeesController = EmployeesController = __decorate([
    (0, common_1.Controller)('employees'),
    __metadata("design:paramtypes", [employees_service_1.EmployeesService,
        onboarding_service_1.OnboardingService])
], EmployeesController);
//# sourceMappingURL=employees.controller.js.map