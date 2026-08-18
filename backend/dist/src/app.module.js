"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const prisma_module_1 = require("./common/prisma/prisma.module");
const redis_module_1 = require("./common/redis/redis.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const roles_module_1 = require("./modules/roles/roles.module");
const organization_module_1 = require("./modules/organization/organization.module");
const employees_module_1 = require("./modules/employees/employees.module");
const recruitment_module_1 = require("./modules/recruitment/recruitment.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const workforce_module_1 = require("./modules/workforce/workforce.module");
const attendance_leave_module_1 = require("./modules/attendance-leave/attendance-leave.module");
const payroll_module_1 = require("./modules/payroll/payroll.module");
const compliance_module_1 = require("./modules/compliance/compliance.module");
const performance_module_1 = require("./modules/performance/performance.module");
const learning_module_1 = require("./modules/learning/learning.module");
const compensation_benefits_module_1 = require("./modules/compensation-benefits/compensation-benefits.module");
const employee_experience_module_1 = require("./modules/employee-experience/employee-experience.module");
const asset_management_module_1 = require("./modules/asset-management/asset-management.module");
const travel_expense_module_1 = require("./modules/travel-expense/travel-expense.module");
const ehs_module_1 = require("./modules/ehs/ehs.module");
const ai_intelligence_module_1 = require("./modules/ai-intelligence/ai-intelligence.module");
const iot_devices_module_1 = require("./modules/iot-devices/iot-devices.module");
const reports_analytics_module_1 = require("./modules/reports-analytics/reports-analytics.module");
const workflow_automation_module_1 = require("./modules/workflow-automation/workflow-automation.module");
const tasks_module_1 = require("./modules/tasks/tasks.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            roles_module_1.RolesModule,
            organization_module_1.OrganizationModule,
            employees_module_1.EmployeesModule,
            recruitment_module_1.RecruitmentModule,
            dashboard_module_1.DashboardModule,
            tasks_module_1.TasksModule,
            workforce_module_1.WorkforceModule,
            attendance_leave_module_1.AttendanceLeaveModule,
            payroll_module_1.PayrollModule,
            compliance_module_1.ComplianceModule,
            performance_module_1.PerformanceModule,
            learning_module_1.LearningModule,
            compensation_benefits_module_1.CompensationBenefitsModule,
            employee_experience_module_1.EmployeeExperienceModule,
            asset_management_module_1.AssetManagementModule,
            travel_expense_module_1.TravelExpenseModule,
            ehs_module_1.EhsModule,
            ai_intelligence_module_1.AiIntelligenceModule,
            iot_devices_module_1.IotDevicesModule,
            reports_analytics_module_1.ReportsAnalyticsModule,
            workflow_automation_module_1.WorkflowAutomationModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService, { provide: core_1.APP_GUARD, useClass: throttler_1.ThrottlerGuard }],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map