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
exports.WorkflowAutomationController = void 0;
const common_1 = require("@nestjs/common");
const workflow_automation_service_1 = require("./workflow-automation.service");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
let WorkflowAutomationController = class WorkflowAutomationController {
    workflowAutomationService;
    constructor(workflowAutomationService) {
        this.workflowAutomationService = workflowAutomationService;
    }
    getStatus() {
        return this.workflowAutomationService.getStatus();
    }
};
exports.WorkflowAutomationController = WorkflowAutomationController;
__decorate([
    (0, common_1.Get)('status'),
    (0, permissions_decorator_1.Permissions)('workflow_automation.read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WorkflowAutomationController.prototype, "getStatus", null);
exports.WorkflowAutomationController = WorkflowAutomationController = __decorate([
    (0, common_1.Controller)('workflow-automation'),
    __metadata("design:paramtypes", [workflow_automation_service_1.WorkflowAutomationService])
], WorkflowAutomationController);
//# sourceMappingURL=workflow-automation.controller.js.map