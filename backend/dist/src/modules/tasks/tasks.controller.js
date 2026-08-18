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
exports.TasksController = void 0;
const common_1 = require("@nestjs/common");
const tasks_service_1 = require("./tasks.service");
const task_dto_1 = require("./dto/task.dto");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const public_decorator_1 = require("../../common/decorators/public.decorator");
let TasksController = class TasksController {
    tasksService;
    constructor(tasksService) {
        this.tasksService = tasksService;
    }
    listTasks(assignedToId, assignedToName, status, priority, departmentName, search) {
        return this.tasksService.listTasks({
            assignedToId,
            assignedToName,
            status,
            priority,
            departmentName,
            search,
        });
    }
    getDashboardSummary(employeeId) {
        return this.tasksService.getDashboardSummary(employeeId);
    }
    listRequests(requestedById) {
        return this.tasksService.listRequests(requestedById);
    }
    createRequest(dto) {
        return this.tasksService.createRequest(dto);
    }
    reviewRequest(id, dto) {
        return this.tasksService.reviewRequest(id, dto);
    }
    findOne(id) {
        return this.tasksService.findById(id);
    }
    createTask(dto) {
        return this.tasksService.createTask(dto);
    }
    startTask(id, startedBy) {
        return this.tasksService.startTask(id, startedBy);
    }
    updateProgress(id, dto) {
        return this.tasksService.updateProgress(id, dto);
    }
    completeTask(id, dto) {
        return this.tasksService.completeTask(id, dto);
    }
    reviewTask(id, dto) {
        return this.tasksService.reviewTask(id, dto);
    }
};
exports.TasksController = TasksController;
__decorate([
    (0, common_1.Get)(),
    (0, public_decorator_1.Public)(),
    (0, permissions_decorator_1.Permissions)('employees.read'),
    __param(0, (0, common_1.Query)('assignedToId')),
    __param(1, (0, common_1.Query)('assignedToName')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('priority')),
    __param(4, (0, common_1.Query)('departmentName')),
    __param(5, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "listTasks", null);
__decorate([
    (0, common_1.Get)('dashboard-summary'),
    (0, public_decorator_1.Public)(),
    (0, permissions_decorator_1.Permissions)('employees.read'),
    __param(0, (0, common_1.Query)('employeeId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "getDashboardSummary", null);
__decorate([
    (0, common_1.Get)('requests'),
    (0, public_decorator_1.Public)(),
    (0, permissions_decorator_1.Permissions)('employees.read'),
    __param(0, (0, common_1.Query)('requestedById')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "listRequests", null);
__decorate([
    (0, common_1.Post)('requests'),
    (0, public_decorator_1.Public)(),
    (0, permissions_decorator_1.Permissions)('employees.write'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [task_dto_1.CreateTaskRequestDto]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "createRequest", null);
__decorate([
    (0, common_1.Patch)('requests/:id/review'),
    (0, public_decorator_1.Public)(),
    (0, permissions_decorator_1.Permissions)('employees.write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, task_dto_1.ReviewTaskRequestDto]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "reviewRequest", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, public_decorator_1.Public)(),
    (0, permissions_decorator_1.Permissions)('employees.read'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, public_decorator_1.Public)(),
    (0, permissions_decorator_1.Permissions)('employees.write'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [task_dto_1.CreateTaskDto]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "createTask", null);
__decorate([
    (0, common_1.Patch)(':id/start'),
    (0, public_decorator_1.Public)(),
    (0, permissions_decorator_1.Permissions)('employees.write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('startedBy')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "startTask", null);
__decorate([
    (0, common_1.Patch)(':id/progress'),
    (0, public_decorator_1.Public)(),
    (0, permissions_decorator_1.Permissions)('employees.write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, task_dto_1.UpdateTaskProgressDto]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "updateProgress", null);
__decorate([
    (0, common_1.Patch)(':id/complete'),
    (0, public_decorator_1.Public)(),
    (0, permissions_decorator_1.Permissions)('employees.write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, task_dto_1.CompleteTaskDto]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "completeTask", null);
__decorate([
    (0, common_1.Patch)(':id/review'),
    (0, public_decorator_1.Public)(),
    (0, permissions_decorator_1.Permissions)('employees.write'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, task_dto_1.ReviewTaskDto]),
    __metadata("design:returntype", void 0)
], TasksController.prototype, "reviewTask", null);
exports.TasksController = TasksController = __decorate([
    (0, common_1.Controller)('tasks'),
    __metadata("design:paramtypes", [tasks_service_1.TasksService])
], TasksController);
//# sourceMappingURL=tasks.controller.js.map