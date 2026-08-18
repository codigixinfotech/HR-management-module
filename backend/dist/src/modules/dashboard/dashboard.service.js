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
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const modules_1 = require("../../common/constants/modules");
const PIPELINE_STAGES = [
    client_1.CandidateStage.APPLIED,
    client_1.CandidateStage.SCREENING,
    client_1.CandidateStage.INTERVIEW,
    client_1.CandidateStage.OFFERED,
    client_1.CandidateStage.HIRED,
];
const UPCOMING_WINDOW_DAYS = 14;
const RECENT_ACTIVITY_LIMIT = 6;
const UPCOMING_EVENTS_LIMIT = 6;
function startOfToday() {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
function dayOfYearOffset(from, month, day) {
    const year = from.getUTCFullYear();
    let next = new Date(Date.UTC(year, month, day));
    const fromMidnight = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
    if (next < fromMidnight) {
        next = new Date(Date.UTC(year + 1, month, day));
    }
    return Math.round((next.getTime() - fromMidnight.getTime()) / 86400000);
}
let DashboardService = class DashboardService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async summary(companyId) {
        const employeeWhere = companyId ? { companyId } : {};
        const jobOpeningWhere = companyId ? { companyId, isActive: true } : { isActive: true };
        const today = startOfToday();
        const [totalCompanies, totalBranches, totalDepartments, totalEmployees, activeEmployees, onLeaveEmployees, openJobOpenings, pendingOnboardingTasks,] = await this.prisma.$transaction([
            this.prisma.company.count(),
            this.prisma.branch.count(companyId ? { where: { companyId } } : undefined),
            this.prisma.department.count(companyId ? { where: { companyId } } : undefined),
            this.prisma.employee.count({ where: employeeWhere }),
            this.prisma.employee.count({ where: { ...employeeWhere, status: { in: [client_1.EmployeeStatus.ACTIVE, client_1.EmployeeStatus.PROBATION, client_1.EmployeeStatus.NOTICE_PERIOD] } } }),
            this.prisma.employee.count({ where: { ...employeeWhere, status: client_1.EmployeeStatus.ON_LEAVE } }),
            this.prisma.jobOpening.count({ where: jobOpeningWhere }),
            this.prisma.employeeOnboardingTask.count({ where: { status: client_1.ApprovalStatus.PENDING } }),
        ]);
        const [departmentDistribution, recruitmentPipeline, attendanceToday, upcomingEvents, recentActivity, compliance] = await Promise.all([
            this.getDepartmentDistribution(companyId, totalEmployees),
            this.getRecruitmentPipeline(companyId),
            this.getAttendanceToday(companyId, today, activeEmployees),
            this.getUpcomingEvents(companyId, today),
            this.getRecentActivity(companyId),
            this.getComplianceSnapshot(companyId, today),
        ]);
        return {
            counts: {
                totalCompanies,
                totalBranches,
                totalDepartments,
                totalEmployees,
                activeEmployees,
                onLeaveEmployees,
                openJobOpenings,
                pendingOnboardingTasks,
            },
            departmentDistribution,
            recruitmentPipeline,
            attendanceToday,
            upcomingEvents,
            recentActivity,
            compliance,
            modules: modules_1.HCM_MODULES,
        };
    }
    async getDepartmentDistribution(companyId, totalEmployees) {
        const groups = await this.prisma.employee.groupBy({
            by: ['departmentId'],
            where: companyId ? { companyId } : {},
            _count: { _all: true },
        });
        const deptIds = groups.map((g) => g.departmentId).filter((id) => !!id);
        const departments = deptIds.length
            ? await this.prisma.department.findMany({ where: { id: { in: deptIds } }, select: { id: true, name: true } })
            : [];
        const nameById = new Map(departments.map((d) => [d.id, d.name]));
        return groups
            .filter((g) => g.departmentId)
            .map((g) => ({
            departmentId: g.departmentId,
            name: nameById.get(g.departmentId) ?? 'Unassigned',
            count: g._count._all,
            percentage: totalEmployees > 0 ? Math.round((g._count._all / totalEmployees) * 1000) / 10 : 0,
        }))
            .sort((a, b) => b.count - a.count);
    }
    async getRecruitmentPipeline(companyId) {
        const groups = await this.prisma.candidate.groupBy({
            by: ['stage'],
            where: companyId ? { jobOpening: { companyId } } : {},
            _count: { _all: true },
        });
        const countByStage = new Map(groups.map((g) => [g.stage, g._count._all]));
        return PIPELINE_STAGES.map((stage) => ({
            stage,
            count: countByStage.get(stage) ?? 0,
        }));
    }
    async getAttendanceToday(companyId, today, activeEmployees) {
        const groups = await this.prisma.attendanceRecord.groupBy({
            by: ['status'],
            where: { date: today, ...(companyId ? { companyId } : {}) },
            _count: { _all: true },
        });
        const countByStatus = new Map(groups.map((g) => [g.status, g._count._all]));
        const present = (countByStatus.get(client_1.AttendanceStatus.PRESENT) ?? 0) + (countByStatus.get(client_1.AttendanceStatus.HALF_DAY) ?? 0);
        const absent = countByStatus.get(client_1.AttendanceStatus.ABSENT) ?? 0;
        const onLeave = countByStatus.get(client_1.AttendanceStatus.ON_LEAVE) ?? 0;
        const totalMarked = groups.reduce((sum, g) => sum + g._count._all, 0);
        return {
            date: today.toISOString().slice(0, 10),
            present,
            absent,
            onLeave,
            totalMarked,
            rate: activeEmployees > 0 ? Math.round((present / activeEmployees) * 1000) / 10 : 0,
        };
    }
    async getUpcomingEvents(companyId, today) {
        const employeeWhere = { ...(companyId ? { companyId } : {}), status: { in: [client_1.EmployeeStatus.ACTIVE, client_1.EmployeeStatus.PROBATION, client_1.EmployeeStatus.NOTICE_PERIOD] } };
        const [birthdayCandidates, anniversaryCandidates, onboardingTasks, holidays] = await Promise.all([
            this.prisma.employee.findMany({
                where: { ...employeeWhere, dateOfBirth: { not: null } },
                select: { id: true, firstName: true, lastName: true, dateOfBirth: true },
            }),
            this.prisma.employee.findMany({
                where: { ...employeeWhere, dateOfJoining: { not: null } },
                select: { id: true, firstName: true, lastName: true, dateOfJoining: true },
            }),
            this.prisma.employeeOnboardingTask.findMany({
                where: {
                    status: client_1.ApprovalStatus.PENDING,
                    dueDate: { not: null },
                    ...(companyId ? { employee: { companyId } } : {}),
                },
                select: { id: true, title: true, dueDate: true, employee: { select: { firstName: true, lastName: true } } },
                orderBy: { dueDate: 'asc' },
                take: 20,
            }),
            this.prisma.holiday.findMany({
                where: { isActive: true, date: { gte: today }, ...(companyId ? { companyId } : {}) },
                orderBy: { date: 'asc' },
                take: 10,
            }),
        ]);
        const events = [];
        for (const emp of birthdayCandidates) {
            const dob = emp.dateOfBirth;
            const daysAway = dayOfYearOffset(today, dob.getUTCMonth(), dob.getUTCDate());
            if (daysAway <= UPCOMING_WINDOW_DAYS) {
                const date = new Date(today.getTime() + daysAway * 86400000);
                events.push({ id: `bday-${emp.id}`, type: 'birthday', title: `${emp.firstName} ${emp.lastName} Birthday`, date, daysAway });
            }
        }
        for (const emp of anniversaryCandidates) {
            const doj = emp.dateOfJoining;
            const years = today.getUTCFullYear() - doj.getUTCFullYear();
            if (years < 1)
                continue;
            const daysAway = dayOfYearOffset(today, doj.getUTCMonth(), doj.getUTCDate());
            if (daysAway <= UPCOMING_WINDOW_DAYS) {
                const date = new Date(today.getTime() + daysAway * 86400000);
                events.push({
                    id: `anniv-${emp.id}`,
                    type: 'anniversary',
                    title: `${emp.firstName} ${emp.lastName} (${years} Yr Anniversary)`,
                    date,
                    daysAway,
                });
            }
        }
        for (const task of onboardingTasks) {
            const due = task.dueDate;
            const daysAway = Math.round((due.getTime() - today.getTime()) / 86400000);
            if (daysAway >= 0 && daysAway <= UPCOMING_WINDOW_DAYS) {
                const who = task.employee ? `${task.employee.firstName} ${task.employee.lastName}` : 'Employee';
                events.push({ id: `onboard-${task.id}`, type: 'onboarding', title: `${who} — ${task.title}`, date: due, daysAway });
            }
        }
        for (const holiday of holidays) {
            const daysAway = Math.round((holiday.date.getTime() - today.getTime()) / 86400000);
            if (daysAway <= UPCOMING_WINDOW_DAYS) {
                events.push({ id: `holiday-${holiday.id}`, type: 'holiday', title: `${holiday.name} Holiday`, date: holiday.date, daysAway });
            }
        }
        return events
            .sort((a, b) => a.daysAway - b.daysAway)
            .slice(0, UPCOMING_EVENTS_LIMIT)
            .map((e) => ({
            id: e.id,
            type: e.type,
            title: e.title,
            date: e.date.toISOString().slice(0, 10),
            daysAway: e.daysAway,
        }));
    }
    async getRecentActivity(companyId) {
        const [leaveRequests, candidates, jobOpenings, complianceTasks, assetAllocations] = await Promise.all([
            this.prisma.leaveRequest.findMany({
                where: companyId ? { companyId } : {},
                orderBy: { updatedAt: 'desc' },
                take: 5,
                include: { employee: { select: { firstName: true, lastName: true } }, approver: { select: { firstName: true, lastName: true } } },
            }),
            this.prisma.candidate.findMany({
                where: companyId ? { jobOpening: { companyId } } : {},
                orderBy: { updatedAt: 'desc' },
                take: 5,
                include: { jobOpening: { select: { title: true } } },
            }),
            this.prisma.jobOpening.findMany({
                where: companyId ? { companyId } : {},
                orderBy: { createdAt: 'desc' },
                take: 3,
            }),
            this.prisma.complianceTask.findMany({
                where: { status: client_1.ComplianceStatus.FILED, ...(companyId ? { companyId } : {}) },
                orderBy: { filedDate: 'desc' },
                take: 3,
                include: { complianceType: { select: { name: true } } },
            }),
            this.prisma.assetAllocation.findMany({
                where: companyId ? { asset: { companyId } } : {},
                orderBy: { allocatedAt: 'desc' },
                take: 3,
                include: { asset: { select: { name: true } }, employee: { select: { firstName: true, lastName: true } } },
            }),
        ]);
        const activities = [];
        for (const lr of leaveRequests) {
            const empName = `${lr.employee.firstName} ${lr.employee.lastName}`;
            const verb = lr.status === client_1.ApprovalStatus.APPROVED
                ? 'approved'
                : lr.status === client_1.ApprovalStatus.REJECTED
                    ? 'rejected'
                    : 'requested';
            const who = lr.approver ? `${lr.approver.firstName} ${lr.approver.lastName} ${verb}` : `${empName} requested`;
            activities.push({
                id: `leave-${lr.id}`,
                text: `${who} ${lr.totalDays}-day leave request for ${empName}`,
                tag: 'Leave',
                at: lr.updatedAt,
            });
        }
        for (const c of candidates) {
            activities.push({
                id: `cand-${c.id}`,
                text: `${c.firstName} ${c.lastName} moved to ${c.stage} stage for ${c.jobOpening.title}`,
                tag: 'Recruitment',
                at: c.updatedAt,
            });
        }
        for (const jo of jobOpenings) {
            activities.push({
                id: `job-${jo.id}`,
                text: `New Job Requisition created: ${jo.title} (${jo.numPositions} openings)`,
                tag: 'Recruitment',
                at: jo.createdAt,
            });
        }
        for (const ct of complianceTasks) {
            activities.push({
                id: `comp-${ct.id}`,
                text: `${ct.complianceType.name} filed for ${ct.periodLabel}`,
                tag: 'Compliance',
                at: ct.filedDate,
            });
        }
        for (const aa of assetAllocations) {
            activities.push({
                id: `asset-${aa.id}`,
                text: `Asset ${aa.asset.name} allocated to ${aa.employee.firstName} ${aa.employee.lastName}`,
                tag: 'Assets',
                at: aa.allocatedAt,
            });
        }
        return activities
            .sort((a, b) => b.at.getTime() - a.at.getTime())
            .slice(0, RECENT_ACTIVITY_LIMIT)
            .map((a) => ({ id: a.id, text: a.text, tag: a.tag, at: a.at.toISOString() }));
    }
    async getComplianceSnapshot(companyId, today) {
        const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
        const monthEnd = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0));
        const [totalTasks, filedTasks, latestPayrollRun] = await Promise.all([
            this.prisma.complianceTask.count({
                where: { dueDate: { gte: monthStart, lte: monthEnd }, ...(companyId ? { companyId } : {}) },
            }),
            this.prisma.complianceTask.count({
                where: {
                    dueDate: { gte: monthStart, lte: monthEnd },
                    status: client_1.ComplianceStatus.FILED,
                    ...(companyId ? { companyId } : {}),
                },
            }),
            this.prisma.payrollRun.findFirst({
                where: companyId ? { companyId } : {},
                orderBy: [{ year: 'desc' }, { month: 'desc' }],
            }),
        ]);
        return {
            filedRate: totalTasks > 0 ? Math.round((filedTasks / totalTasks) * 1000) / 10 : 100,
            filedTasks,
            totalTasks,
            latestPayrollRun: latestPayrollRun
                ? { month: latestPayrollRun.month, year: latestPayrollRun.year, status: latestPayrollRun.status }
                : null,
        };
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map