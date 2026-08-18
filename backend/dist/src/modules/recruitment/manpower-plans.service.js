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
exports.ManpowerPlansService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let ManpowerPlansService = class ManpowerPlansService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async onModuleInit() {
        try {
            const count = await this.prisma.manpowerPlan.count();
            if (count === 0) {
                await this.prisma.manpowerPlan.createMany({
                    data: [
                        { code: 'MP-01', departmentName: 'Engineering', role: 'Senior Software Engineer', costCenter: 'CC-102', budgeted: 15, quarter: 'Q3 2026', reason: 'Additional engineering capacity needed for Q3 project releases' },
                        { code: 'MP-02', departmentName: 'Engineering', role: 'DevOps Lead', costCenter: 'CC-102', budgeted: 4, quarter: 'Q3 2026', reason: 'Cloud infrastructure scaling and CI/CD automation' },
                        { code: 'MP-03', departmentName: 'Sales', role: 'Regional Sales Manager', costCenter: 'CC-103', budgeted: 8, quarter: 'Q3 2026', reason: 'Expansion into western sales territory' },
                        { code: 'MP-04', departmentName: 'Operations', role: 'Production Supervisor', costCenter: 'CC-104', budgeted: 10, quarter: 'Q4 2026', reason: 'Plant expansion shift management' },
                        { code: 'MP-05', departmentName: 'Human Resources', role: 'HR Business Partner', costCenter: 'CC-101', budgeted: 5, quarter: 'Q4 2026', reason: 'Support new tech business units' },
                    ],
                });
            }
        }
        catch (e) {
            console.error('Failed to seed initial manpower plans:', e);
        }
    }
    async countActiveStaff(departmentName, role, companyId, departmentId, designationId) {
        const where = {
            status: 'ACTIVE',
        };
        if (companyId) {
            where.companyId = companyId;
        }
        if (designationId) {
            where.designationId = designationId;
        }
        if (departmentId) {
            where.departmentId = departmentId;
        }
        else if (departmentName && departmentName !== 'all') {
            where.OR = [
                { department: { name: { contains: departmentName } } },
                { departmentId: departmentName },
            ];
        }
        const allActive = await this.prisma.employee.findMany({
            where,
            select: {
                id: true,
                designationId: true,
                designation: { select: { title: true } },
                prevJobTitle: true,
            },
        });
        if (designationId) {
            return allActive.length;
        }
        if (!role || role.trim() === '') {
            return allActive.length;
        }
        const roleLower = role.toLowerCase().trim();
        const matched = allActive.filter((emp) => {
            const desigTitle = (emp.designation?.title || '').toLowerCase();
            const prevTitle = (emp.prevJobTitle || '').toLowerCase();
            return desigTitle.includes(roleLower) || roleLower.includes(desigTitle) || prevTitle.includes(roleLower);
        });
        return matched.length;
    }
    async list(companyId) {
        const plans = await this.prisma.manpowerPlan.findMany({
            where: {
                isActive: true,
                ...(companyId ? { companyId } : {}),
            },
            orderBy: { createdAt: 'asc' },
        });
        return Promise.all(plans.map(async (p, idx) => {
            const activeCount = await this.countActiveStaff(p.departmentName, p.role, p.companyId || undefined, p.departmentId || undefined, p.designationId || undefined);
            const rawPlannedHires = Math.max(0, p.budgeted - activeCount);
            const availableOpenings = Math.max(0, rawPlannedHires - (p.mrRaisedHires || 0));
            let status = p.status;
            if (activeCount >= p.budgeted || availableOpenings === 0) {
                status = 'CAP-REACHED';
            }
            else if (availableOpenings > 0) {
                status = p.status === 'ON-TRACK' ? 'ON-TRACK' : 'UNDER-STAFFED';
            }
            const formattedCode = p.code || `MP-0${idx + 1}`;
            return {
                ...p,
                code: formattedCode,
                active: activeCount,
                plannedHires: availableOpenings,
                status,
            };
        }));
    }
    async findOne(id) {
        const plan = await this.prisma.manpowerPlan.findUnique({ where: { id } });
        if (!plan || !plan.isActive)
            throw new common_1.NotFoundException('Manpower forecast plan not found');
        const activeCount = await this.countActiveStaff(plan.departmentName, plan.role, plan.companyId || undefined, plan.departmentId || undefined, plan.designationId || undefined);
        const rawPlannedHires = Math.max(0, plan.budgeted - activeCount);
        const availableOpenings = Math.max(0, rawPlannedHires - (plan.mrRaisedHires || 0));
        let status = plan.status;
        if (activeCount >= plan.budgeted || availableOpenings === 0) {
            status = 'CAP-REACHED';
        }
        else if (availableOpenings > 0) {
            status = plan.status === 'ON-TRACK' ? 'ON-TRACK' : 'UNDER-STAFFED';
        }
        return {
            ...plan,
            active: activeCount,
            plannedHires: availableOpenings,
            status,
        };
    }
    async create(dto) {
        const count = await this.prisma.manpowerPlan.count();
        const code = dto.code || `MP-0${count + 1}`;
        const activeCount = await this.countActiveStaff(dto.departmentName, dto.role, dto.companyId, dto.departmentId, dto.designationId);
        const plannedHires = Math.max(0, dto.budgeted - activeCount);
        const status = activeCount >= dto.budgeted || plannedHires === 0 ? 'CAP-REACHED' : 'UNDER-STAFFED';
        return this.prisma.manpowerPlan.create({
            data: {
                code,
                companyId: dto.companyId || null,
                departmentId: dto.departmentId || null,
                designationId: dto.designationId || null,
                departmentName: dto.departmentName,
                costCenter: dto.costCenter,
                role: dto.role,
                budgeted: dto.budgeted,
                active: activeCount,
                plannedHires,
                quarter: dto.quarter,
                reason: dto.reason,
                status,
            },
        });
    }
    async update(id, dto) {
        const existing = await this.findOne(id);
        const departmentName = dto.departmentName ?? existing.departmentName;
        const role = dto.role ?? existing.role;
        const companyId = dto.companyId ?? existing.companyId ?? undefined;
        const budgeted = dto.budgeted ?? existing.budgeted;
        const activeCount = await this.countActiveStaff(departmentName, role, companyId);
        const plannedHires = Math.max(0, budgeted - activeCount);
        const status = activeCount >= budgeted || plannedHires === 0 ? 'CAP-REACHED' : 'UNDER-STAFFED';
        return this.prisma.manpowerPlan.update({
            where: { id },
            data: {
                ...dto,
                active: activeCount,
                plannedHires,
                status,
            },
        });
    }
    async remove(id) {
        const existing = await this.prisma.manpowerPlan.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Manpower forecast plan not found');
        await this.prisma.manpowerPlan.update({
            where: { id },
            data: { isActive: false },
        });
        return { success: true };
    }
};
exports.ManpowerPlansService = ManpowerPlansService;
exports.ManpowerPlansService = ManpowerPlansService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ManpowerPlansService);
//# sourceMappingURL=manpower-plans.service.js.map