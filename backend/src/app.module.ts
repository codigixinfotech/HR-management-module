import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { RecruitmentModule } from './modules/recruitment/recruitment.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

import { WorkforceModule } from './modules/workforce/workforce.module';
import { AttendanceLeaveModule } from './modules/attendance-leave/attendance-leave.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { ComplianceModule } from './modules/compliance/compliance.module';
import { PerformanceModule } from './modules/performance/performance.module';
import { LearningModule } from './modules/learning/learning.module';
import { CompensationBenefitsModule } from './modules/compensation-benefits/compensation-benefits.module';
import { EmployeeExperienceModule } from './modules/employee-experience/employee-experience.module';
import { AssetManagementModule } from './modules/asset-management/asset-management.module';
import { TravelExpenseModule } from './modules/travel-expense/travel-expense.module';
import { EhsModule } from './modules/ehs/ehs.module';
import { AiIntelligenceModule } from './modules/ai-intelligence/ai-intelligence.module';
import { IotDevicesModule } from './modules/iot-devices/iot-devices.module';
import { ReportsAnalyticsModule } from './modules/reports-analytics/reports-analytics.module';
import { WorkflowAutomationModule } from './modules/workflow-automation/workflow-automation.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    PrismaModule,
    RedisModule,

    // Phase 1 + 2 - fully functional
    AuthModule,
    UsersModule,
    RolesModule,
    OrganizationModule,
    EmployeesModule,
    RecruitmentModule,
    DashboardModule,

    // Phase 3-7 - scaffolded stubs, extend these in later phases
    WorkforceModule,
    AttendanceLeaveModule,
    PayrollModule,
    ComplianceModule,
    PerformanceModule,
    LearningModule,
    CompensationBenefitsModule,
    EmployeeExperienceModule,
    AssetManagementModule,
    TravelExpenseModule,
    EhsModule,
    AiIntelligenceModule,
    IotDevicesModule,
    ReportsAnalyticsModule,
    WorkflowAutomationModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
