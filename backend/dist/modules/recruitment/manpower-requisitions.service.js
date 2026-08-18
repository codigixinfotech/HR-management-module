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
exports.ManpowerRequisitionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let ManpowerRequisitionsService = class ManpowerRequisitionsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateNextMrNumber() {
        const year = new Date().getFullYear();
        const count = await this.prisma.manpowerRequisition.count();
        const seq = String(count + 1).padStart(3, '0');
        return `MR-${year}-${seq}`;
    }
    async list(companyId, status) {
        return this.prisma.manpowerRequisition.findMany({
            where: {
                isActive: true,
                ...(companyId ? { companyId } : {}),
                ...(status ? { status } : {}),
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const mr = await this.prisma.manpowerRequisition.findUnique({
            where: { id },
            include: {
                department: true,
                manpowerPlan: true,
            },
        });
        if (!mr || !mr.isActive) {
            throw new common_1.NotFoundException('Manpower Requisition not found');
        }
        return mr;
    }
    async create(dto) {
        const mrNumber = dto.mrNumber || (await this.generateNextMrNumber());
        if (dto.manpowerPlanId) {
            const plan = await this.prisma.manpowerPlan.findUnique({ where: { id: dto.manpowerPlanId } });
            if (plan) {
                const activeCount = await this.prisma.employee.count({
                    where: {
                        status: 'ACTIVE',
                        ...(plan.departmentId ? { departmentId: plan.departmentId } : {}),
                    },
                });
                const currentPlannedHires = Math.max(0, plan.budgeted - activeCount);
                const availableOpenings = Math.max(0, currentPlannedHires - plan.mrRaisedHires);
                if (availableOpenings <= 0) {
                    throw new common_1.BadRequestException('No available planned hires remaining for this manpower plan.');
                }
                const actualNumOpenings = Math.min(dto.numOpenings, availableOpenings);
                dto.numOpenings = actualNumOpenings;
                const newRaisedHires = plan.mrRaisedHires + actualNumOpenings;
                await this.prisma.manpowerPlan.update({
                    where: { id: plan.id },
                    data: {
                        mrRaisedHires: newRaisedHires,
                        status: newRaisedHires >= currentPlannedHires ? 'CAP-REACHED' : 'UNDER-STAFFED',
                    },
                });
            }
        }
        return this.prisma.manpowerRequisition.create({
            data: {
                mrNumber,
                manpowerPlanId: dto.manpowerPlanId || null,
                companyId: dto.companyId || null,
                departmentId: dto.departmentId || null,
                departmentName: dto.departmentName,
                costCenter: dto.costCenter,
                designationId: dto.designationId || null,
                role: dto.role,
                numOpenings: dto.numOpenings,
                joiningDate: new Date(dto.joiningDate),
                employmentType: dto.employmentType || 'FULL_TIME',
                priority: dto.priority || 'NORMAL',
                minSalary: dto.minSalary || null,
                maxSalary: dto.maxSalary || null,
                qualification: dto.qualification,
                experience: dto.experience,
                requiredSkills: dto.requiredSkills || null,
                workLocation: dto.workLocation,
                reportingManagerId: dto.reportingManagerId || null,
                requestorName: dto.requestorName || 'HR Admin',
                reason: dto.reason,
                comments: dto.comments || null,
                status: dto.status || 'PENDING_APPROVAL',
            },
        });
    }
    async updateStatus(id, dto) {
        const mr = await this.findOne(id);
        const newStatus = dto.status.toUpperCase();
        if (newStatus === 'REJECTED' && mr.manpowerPlanId) {
            const plan = await this.prisma.manpowerPlan.findUnique({ where: { id: mr.manpowerPlanId } });
            if (plan) {
                const restoredRaisedHires = Math.max(0, plan.mrRaisedHires - mr.numOpenings);
                await this.prisma.manpowerPlan.update({
                    where: { id: plan.id },
                    data: {
                        mrRaisedHires: restoredRaisedHires,
                        status: 'UNDER-STAFFED',
                    },
                });
            }
        }
        return this.prisma.manpowerRequisition.update({
            where: { id },
            data: {
                status: newStatus,
                rejectionReason: dto.rejectionReason || null,
                ...(newStatus === 'APPROVED'
                    ? { approvedBy: 'HR Manager', approvedAt: new Date() }
                    : {}),
            },
        });
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.manpowerRequisition.update({
            where: { id },
            data: {
                ...(dto.departmentName ? { departmentName: dto.departmentName } : {}),
                ...(dto.costCenter ? { costCenter: dto.costCenter } : {}),
                ...(dto.role ? { role: dto.role } : {}),
                ...(dto.numOpenings ? { numOpenings: dto.numOpenings } : {}),
                ...(dto.joiningDate ? { joiningDate: new Date(dto.joiningDate) } : {}),
                ...(dto.employmentType ? { employmentType: dto.employmentType } : {}),
                ...(dto.priority ? { priority: dto.priority } : {}),
                ...(dto.minSalary !== undefined ? { minSalary: dto.minSalary } : {}),
                ...(dto.maxSalary !== undefined ? { maxSalary: dto.maxSalary } : {}),
                ...(dto.qualification ? { qualification: dto.qualification } : {}),
                ...(dto.experience ? { experience: dto.experience } : {}),
                ...(dto.requiredSkills ? { requiredSkills: dto.requiredSkills } : {}),
                ...(dto.workLocation ? { workLocation: dto.workLocation } : {}),
                ...(dto.reportingManagerId ? { reportingManagerId: dto.reportingManagerId } : {}),
                ...(dto.reason ? { reason: dto.reason } : {}),
                ...(dto.comments ? { comments: dto.comments } : {}),
                ...(dto.status ? { status: dto.status } : {}),
            },
        });
    }
    async remove(id) {
        const mr = await this.findOne(id);
        await this.prisma.manpowerRequisition.update({
            where: { id: mr.id },
            data: { isActive: false },
        });
        return { success: true };
    }
};
exports.ManpowerRequisitionsService = ManpowerRequisitionsService;
exports.ManpowerRequisitionsService = ManpowerRequisitionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ManpowerRequisitionsService);
//# sourceMappingURL=manpower-requisitions.service.js.map