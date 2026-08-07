import { PrismaService } from '../../common/prisma/prisma.service';
export declare class DashboardService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    summary(companyId?: string): Promise<{
        counts: {
            totalCompanies: number;
            totalBranches: number;
            totalDepartments: number;
            totalEmployees: number;
            activeEmployees: number;
            onLeaveEmployees: number;
            openJobOpenings: number;
            pendingOnboardingTasks: number;
        };
        departmentDistribution: {
            departmentId: string;
            name: string;
            count: number;
            percentage: number;
        }[];
        recruitmentPipeline: {
            stage: import("@prisma/client").$Enums.CandidateStage;
            count: number;
        }[];
        attendanceToday: {
            date: string;
            present: number;
            absent: number;
            onLeave: number;
            totalMarked: number;
            rate: number;
        };
        upcomingEvents: {
            id: string;
            type: "holiday" | "birthday" | "anniversary" | "onboarding";
            title: string;
            date: string;
            daysAway: number;
        }[];
        recentActivity: {
            id: string;
            text: string;
            tag: string;
            at: string;
        }[];
        compliance: {
            filedRate: number;
            filedTasks: number;
            totalTasks: number;
            latestPayrollRun: {
                month: number;
                year: number;
                status: import("@prisma/client").$Enums.PayrollRunStatus;
            } | null;
        };
        modules: readonly [{
            readonly key: "dashboard";
            readonly label: "Dashboard";
            readonly path: "dashboard";
            readonly phase: 1;
            readonly status: "active";
        }, {
            readonly key: "organization";
            readonly label: "Organization";
            readonly path: "organization";
            readonly phase: 1;
            readonly status: "active";
        }, {
            readonly key: "recruitment";
            readonly label: "Recruitment";
            readonly path: "recruitment";
            readonly phase: 2;
            readonly status: "active";
        }, {
            readonly key: "employees";
            readonly label: "Employee Management";
            readonly path: "employees";
            readonly phase: 2;
            readonly status: "active";
        }, {
            readonly key: "workforce";
            readonly label: "Workforce Management";
            readonly path: "workforce";
            readonly phase: 3;
            readonly status: "active";
        }, {
            readonly key: "attendance-leave";
            readonly label: "Attendance & Leave";
            readonly path: "attendance-leave";
            readonly phase: 3;
            readonly status: "active";
        }, {
            readonly key: "payroll";
            readonly label: "Payroll";
            readonly path: "payroll";
            readonly phase: 4;
            readonly status: "stub";
        }, {
            readonly key: "compliance";
            readonly label: "Compliance";
            readonly path: "compliance";
            readonly phase: 4;
            readonly status: "stub";
        }, {
            readonly key: "performance";
            readonly label: "Performance";
            readonly path: "performance";
            readonly phase: 5;
            readonly status: "stub";
        }, {
            readonly key: "learning";
            readonly label: "Learning";
            readonly path: "learning";
            readonly phase: 5;
            readonly status: "stub";
        }, {
            readonly key: "compensation-benefits";
            readonly label: "Compensation & Benefits";
            readonly path: "compensation-benefits";
            readonly phase: 5;
            readonly status: "stub";
        }, {
            readonly key: "employee-experience";
            readonly label: "Employee Experience";
            readonly path: "employee-experience";
            readonly phase: 5;
            readonly status: "stub";
        }, {
            readonly key: "asset-management";
            readonly label: "Asset Management";
            readonly path: "asset-management";
            readonly phase: 3;
            readonly status: "stub";
        }, {
            readonly key: "travel-expense";
            readonly label: "Travel & Expense";
            readonly path: "travel-expense";
            readonly phase: 5;
            readonly status: "stub";
        }, {
            readonly key: "ehs";
            readonly label: "Health, Safety & EHS";
            readonly path: "ehs";
            readonly phase: 3;
            readonly status: "stub";
        }, {
            readonly key: "ai-intelligence";
            readonly label: "AI Intelligence";
            readonly path: "ai-intelligence";
            readonly phase: 6;
            readonly status: "stub";
        }, {
            readonly key: "iot-devices";
            readonly label: "IoT & Smart Devices";
            readonly path: "iot-devices";
            readonly phase: 6;
            readonly status: "stub";
        }, {
            readonly key: "reports-analytics";
            readonly label: "Reports & Analytics";
            readonly path: "reports-analytics";
            readonly phase: 7;
            readonly status: "stub";
        }, {
            readonly key: "workflow-automation";
            readonly label: "Workflow & Automation";
            readonly path: "workflow-automation";
            readonly phase: 1;
            readonly status: "stub";
        }, {
            readonly key: "administration";
            readonly label: "Administration";
            readonly path: "administration";
            readonly phase: 1;
            readonly status: "active";
        }];
    }>;
    private getDepartmentDistribution;
    private getRecruitmentPipeline;
    private getAttendanceToday;
    private getUpcomingEvents;
    private getRecentActivity;
    private getComplianceSnapshot;
}
