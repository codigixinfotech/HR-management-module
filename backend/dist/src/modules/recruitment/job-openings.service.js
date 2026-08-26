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
exports.JobOpeningsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let JobOpeningsService = class JobOpeningsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateNextRequisitionCode() {
        const year = new Date().getFullYear();
        const count = await this.prisma.jobOpening.count();
        const seq = String(count + 1).padStart(3, '0');
        return `JR-${year}-${seq}`;
    }
    async list(companyId, status) {
        try {
            await this.prisma.jobOpening.updateMany({
                where: { status: 'DRAFT', manpowerRequisitionId: null },
                data: { status: 'READY_TO_PUBLISH' },
            });
        }
        catch (e) {
        }
        return this.prisma.jobOpening.findMany({
            where: {
                ...(companyId ? { companyId } : {}),
                ...(status ? { status } : {}),
            },
            include: {
                department: { select: { id: true, name: true } },
                designation: { select: { id: true, title: true } },
                manpowerRequisition: true,
                candidates: { orderBy: { createdAt: 'desc' } },
                _count: { select: { candidates: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findById(id) {
        const opening = await this.prisma.jobOpening.findUnique({
            where: { id },
            include: {
                department: { select: { id: true, name: true } },
                designation: { select: { id: true, title: true } },
                manpowerRequisition: true,
                candidates: { orderBy: { createdAt: 'desc' } },
            },
        });
        if (!opening)
            throw new common_1.NotFoundException('Job requisition not found');
        return opening;
    }
    async create(dto) {
        const requisitionCode = dto.requisitionCode || (await this.generateNextRequisitionCode());
        const candidateType = dto.candidateType || 'BOTH';
        const minExp = dto.minExperience ?? dto.minExp ?? 0;
        const maxExp = dto.maxExperience ?? dto.maxExp ?? minExp;
        const numPositions = dto.numPositions ?? dto.positionsCount ?? 1;
        const requiredSkills = dto.requiredSkills || dto.skills || null;
        const workLocation = dto.workLocation || dto.location || null;
        const deadlineVal = dto.applicationDeadline || dto.deadline;
        const visibilityVal = dto.jobVisibility || dto.visibility || 'Public';
        const numRoundsVal = dto.numInterviewRounds ?? dto.numRounds ?? 3;
        let formattedExp = dto.experience;
        if (candidateType === 'FRESHER') {
            formattedExp = 'Fresher / 0 Years';
        }
        else if (candidateType === 'EXPERIENCED') {
            formattedExp = `${minExp} - ${maxExp} Years`;
        }
        else if (candidateType === 'BOTH') {
            formattedExp = 'Freshers & Experienced';
        }
        return this.prisma.jobOpening.create({
            data: {
                companyId: dto.companyId,
                departmentId: dto.departmentId || null,
                designationId: dto.designationId || null,
                manpowerRequisitionId: dto.manpowerRequisitionId || null,
                requisitionCode,
                manpowerPlanCode: dto.manpowerPlanCode || null,
                mrNumber: dto.mrNumber || null,
                title: dto.title,
                description: dto.description || dto.summary || null,
                responsibilities: dto.responsibilities || null,
                numPositions,
                costCenter: dto.costCenter || null,
                employmentType: dto.employmentType || 'FULL_TIME',
                priority: dto.priority || 'NORMAL',
                candidateType,
                minExperience: minExp,
                maxExperience: maxExp,
                graduationYear: dto.graduationYear || null,
                minSalary: dto.minSalary || null,
                maxSalary: dto.maxSalary || null,
                qualification: dto.qualification || null,
                experience: formattedExp || null,
                requiredSkills,
                workLocation,
                reportingManagerId: dto.reportingManagerId || null,
                applicationDeadline: deadlineVal ? new Date(deadlineVal) : null,
                status: dto.status || 'READY_TO_PUBLISH',
                isActive: dto.status === 'PUBLISHED',
                hiringManagerId: dto.hiringManagerId || null,
                recruiterId: dto.recruiterId || null,
                hrbpId: dto.hrbpId || null,
                applicationStartDate: dto.applicationStartDate ? new Date(dto.applicationStartDate) : new Date(),
                jobVisibility: visibilityVal,
                preferredSkills: dto.preferredSkills || null,
                preferredQualification: dto.preferredQualification || null,
                certifications: dto.certifications || null,
                benefits: dto.benefits || null,
                interviewProcess: dto.interviewProcess || null,
                numInterviewRounds: numRoundsVal,
                internalNotes: dto.internalNotes || null,
                internalJustification: dto.internalJustification || null,
            },
        });
    }
    async publishOpening(id) {
        await this.findById(id);
        return this.prisma.jobOpening.update({
            where: { id },
            data: {
                status: 'PUBLISHED',
                isActive: true,
                publishedAt: new Date(),
            },
        });
    }
    async update(id, dto) {
        await this.findById(id);
        return this.prisma.jobOpening.update({
            where: { id },
            data: {
                ...(dto.title ? { title: dto.title } : {}),
                ...(dto.description !== undefined ? { description: dto.description } : {}),
                ...(dto.responsibilities !== undefined ? { responsibilities: dto.responsibilities } : {}),
                ...(dto.numPositions ? { numPositions: dto.numPositions } : {}),
                ...(dto.costCenter !== undefined ? { costCenter: dto.costCenter } : {}),
                ...(dto.employmentType !== undefined ? { employmentType: dto.employmentType } : {}),
                ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
                ...(dto.minSalary !== undefined ? { minSalary: dto.minSalary } : {}),
                ...(dto.maxSalary !== undefined ? { maxSalary: dto.maxSalary } : {}),
                ...(dto.qualification !== undefined ? { qualification: dto.qualification } : {}),
                ...(dto.experience !== undefined ? { experience: dto.experience } : {}),
                ...(dto.requiredSkills !== undefined ? { requiredSkills: dto.requiredSkills } : {}),
                ...(dto.workLocation !== undefined ? { workLocation: dto.workLocation } : {}),
                ...(dto.applicationDeadline ? { applicationDeadline: new Date(dto.applicationDeadline) } : {}),
                ...(dto.status ? { status: dto.status, isActive: dto.status === 'PUBLISHED' } : {}),
            },
        });
    }
    async remove(id) {
        await this.findById(id);
        await this.prisma.jobOpening.delete({ where: { id } });
        return { success: true };
    }
    listPublicJobs(companyId) {
        return this.prisma.jobOpening.findMany({
            where: {
                status: 'PUBLISHED',
                isActive: true,
                ...(companyId ? { companyId } : {}),
            },
            include: {
                department: { select: { id: true, name: true } },
                designation: { select: { id: true, title: true } },
                company: { select: { id: true, name: true, code: true } },
            },
            orderBy: { publishedAt: 'desc' },
        });
    }
    async findPublicJob(id) {
        const job = await this.prisma.jobOpening.findFirst({
            where: {
                id,
                status: 'PUBLISHED',
                isActive: true,
            },
            include: {
                department: { select: { id: true, name: true } },
                designation: { select: { id: true, title: true } },
                company: { select: { id: true, name: true, code: true } },
            },
        });
        if (!job)
            throw new common_1.NotFoundException('Public job opening not found or expired');
        return job;
    }
};
exports.JobOpeningsService = JobOpeningsService;
exports.JobOpeningsService = JobOpeningsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], JobOpeningsService);
//# sourceMappingURL=job-openings.service.js.map