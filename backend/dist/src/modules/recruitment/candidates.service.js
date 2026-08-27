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
exports.CandidatesService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const offer_email_service_1 = require("./offer-email.service");
let CandidatesService = class CandidatesService {
    prisma;
    offerEmailService;
    constructor(prisma, offerEmailService) {
        this.prisma = prisma;
        this.offerEmailService = offerEmailService;
    }
    listForJobOpening(jobOpeningId) {
        return this.prisma.candidate.findMany({
            where: { jobOpeningId },
            include: {
                jobOpening: true,
                screenings: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findById(id) {
        const candidate = await this.prisma.candidate.findUnique({
            where: { id },
            include: {
                jobOpening: {
                    select: {
                        id: true,
                        title: true,
                        requisitionCode: true,
                        mrNumber: true,
                        department: { select: { id: true, name: true } },
                    },
                },
                screenings: { orderBy: { createdAt: 'desc' } },
            },
        });
        if (!candidate)
            throw new common_1.NotFoundException('Candidate not found');
        return candidate;
    }
    async create(dto) {
        const jobOpening = await this.prisma.jobOpening.findUnique({
            where: { id: dto.jobOpeningId },
        });
        if (jobOpening) {
            if (jobOpening.candidateType === 'EXPERIENCED' && dto.candidateType === 'FRESHER') {
                throw new common_1.BadRequestException('This job requisition requires experienced candidates only.');
            }
            if (jobOpening.candidateType === 'FRESHER' && dto.candidateType === 'EXPERIENCED') {
                throw new common_1.BadRequestException('This job requisition is configured for Freshers only.');
            }
            if (dto.candidateType === 'EXPERIENCED' && jobOpening.minExperience && jobOpening.minExperience > 0) {
                const candidateYears = parseFloat(dto.experience || '0');
                if (isNaN(candidateYears) || candidateYears < jobOpening.minExperience) {
                    throw new common_1.BadRequestException(`Candidate does not meet the minimum experience requirement of ${jobOpening.minExperience} Years. Submitted: ${dto.experience || '0'} Years.`);
                }
            }
        }
        const { middleName, ...prismaData } = dto;
        const finalData = {
            ...prismaData,
            firstName: middleName ? `${prismaData.firstName || ''} ${middleName}`.trim() : prismaData.firstName,
        };
        const candidate = await this.prisma.candidate.create({
            data: finalData,
            include: {
                jobOpening: { select: { title: true, requisitionCode: true } },
            },
        });
        let appId = `APP-2026-${candidate.id.substring(candidate.id.length - 6)}`;
        if (candidate.notes && candidate.notes.includes('App Ref:')) {
            const match = candidate.notes.match(/App Ref:\s*([A-Z0-9-]+)/);
            if (match && match[1])
                appId = match[1];
        }
        const jobTitle = candidate.jobOpening?.title || jobOpening?.title || 'Applied Position';
        const reqCode = candidate.jobOpening?.requisitionCode || jobOpening?.requisitionCode || 'JR-2026-001';
        const formattedDate = new Date(candidate.createdAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
        this.offerEmailService
            .sendApplicationConfirmationEmail({
            candidateEmail: candidate.email,
            candidateName: `${candidate.firstName} ${candidate.lastName}`.trim(),
            jobTitle,
            requisitionCode: reqCode,
            applicationId: appId,
            applicationDate: formattedDate,
        })
            .catch((err) => {
        });
        return candidate;
    }
    async updateStage(id, stage) {
        await this.findById(id);
        return this.prisma.candidate.update({ where: { id }, data: { stage } });
    }
    async getLatestScreening(candidateId) {
        await this.findById(candidateId);
        return this.prisma.candidateScreening.findFirst({
            where: { candidateId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async saveScreening(candidateId, dto) {
        const candidate = await this.prisma.candidate.findUnique({
            where: { id: candidateId },
            include: { jobOpening: true },
        });
        if (!candidate) {
            throw new common_1.NotFoundException(`Candidate with ID ${candidateId} not found`);
        }
        if (!candidate.jobOpening) {
            throw new common_1.NotFoundException(`Job Requisition for candidate ${candidateId} does not exist`);
        }
        if (dto.relevantExperienceYears !== undefined && dto.relevantExperienceYears !== null && dto.relevantExperienceYears < 0) {
            throw new common_1.BadRequestException('Relevant Experience cannot be negative');
        }
        if (dto.currentCtc !== undefined && dto.currentCtc !== null && dto.currentCtc < 0) {
            throw new common_1.BadRequestException('Current CTC cannot be negative');
        }
        if (dto.expectedCtc !== undefined && dto.expectedCtc !== null && dto.expectedCtc < 0) {
            throw new common_1.BadRequestException('Expected CTC cannot be negative');
        }
        if (!dto.technicalRating || dto.technicalRating < 1 || dto.technicalRating > 5) {
            throw new common_1.BadRequestException('Technical Rating must be between 1 and 5');
        }
        if (!dto.communicationRating || dto.communicationRating < 1 || dto.communicationRating > 5) {
            throw new common_1.BadRequestException('Communication Rating must be between 1 and 5');
        }
        if (!dto.profileMatchRating || dto.profileMatchRating < 1 || dto.profileMatchRating > 5) {
            throw new common_1.BadRequestException('Profile Match rating must be between 1 and 5');
        }
        if (!dto.screeningDecision || !['SHORTLIST', 'HOLD', 'REJECT'].includes(dto.screeningDecision)) {
            throw new common_1.BadRequestException('Screening Decision is mandatory and must be Shortlist, Hold, or Reject');
        }
        if (dto.screeningDecision === 'REJECT' && (!dto.screeningRemarks || !dto.screeningRemarks.trim()) && (!dto.rejectionReason || !dto.rejectionReason.trim())) {
            throw new common_1.BadRequestException('Rejection remarks/reason are required when rejecting a candidate');
        }
        const rawScore = (Number(dto.technicalRating) + Number(dto.communicationRating) + Number(dto.profileMatchRating)) / 3;
        const overallScreeningScore = Math.round(rawScore * 100) / 100;
        let targetStage;
        if (dto.screeningDecision === 'SHORTLIST') {
            targetStage = client_1.CandidateStage.SHORTLISTED;
        }
        else if (dto.screeningDecision === 'HOLD') {
            targetStage = client_1.CandidateStage.ON_HOLD;
        }
        else {
            targetStage = client_1.CandidateStage.REJECTED;
        }
        const screenedBy = dto.screenedBy || 'Aishwarya Roy (Director HR)';
        const lastUpdatedBy = dto.lastUpdatedBy || screenedBy;
        const now = new Date();
        const screening = await this.prisma.candidateScreening.create({
            data: {
                candidateId,
                relevantExperienceYears: dto.relevantExperienceYears !== undefined && dto.relevantExperienceYears !== null ? Number(dto.relevantExperienceYears) : null,
                relevantExperienceSummary: dto.relevantExperienceSummary || null,
                currentLocation: dto.currentLocation || candidate.currentLocation || null,
                noticePeriod: dto.noticePeriod || candidate.noticePeriod || null,
                currentCtc: dto.currentCtc !== undefined && dto.currentCtc !== null ? Number(dto.currentCtc) : null,
                expectedCtc: dto.expectedCtc !== undefined && dto.expectedCtc !== null ? Number(dto.expectedCtc) : candidate.expectedCtc,
                highestQualification: dto.highestQualification || candidate.qualification || null,
                qualificationMatch: dto.qualificationMatch || 'YES',
                skillsMatch: dto.skillsMatch || 'YES',
                technicalRating: Number(dto.technicalRating),
                communicationRating: Number(dto.communicationRating),
                profileMatchRating: Number(dto.profileMatchRating),
                overallScreeningScore,
                screeningRemarks: dto.screeningRemarks || null,
                rejectionReason: dto.rejectionReason || dto.screeningRemarks || null,
                screeningDecision: dto.screeningDecision,
                screenedBy,
                screenedAt: now,
                lastUpdatedBy,
                lastUpdatedDate: now,
            },
        });
        const updatedCandidate = await this.prisma.candidate.update({
            where: { id: candidateId },
            data: {
                stage: targetStage,
                experience: dto.relevantExperienceYears !== undefined && dto.relevantExperienceYears !== null ? `${dto.relevantExperienceYears} Years` : candidate.experience,
                currentLocation: dto.currentLocation || candidate.currentLocation,
                currentCtc: dto.currentCtc !== undefined && dto.currentCtc !== null ? Number(dto.currentCtc) : candidate.currentCtc,
                expectedCtc: dto.expectedCtc !== undefined && dto.expectedCtc !== null ? Number(dto.expectedCtc) : candidate.expectedCtc,
                noticePeriod: dto.noticePeriod || candidate.noticePeriod,
                qualification: dto.highestQualification || candidate.qualification,
            },
            include: {
                jobOpening: true,
                screenings: { orderBy: { createdAt: 'desc' }, take: 1 },
            },
        });
        return {
            success: true,
            candidate: updatedCandidate,
            screening,
        };
    }
    async remove(id) {
        await this.findById(id);
        await this.prisma.candidate.delete({ where: { id } });
        return { success: true };
    }
};
exports.CandidatesService = CandidatesService;
exports.CandidatesService = CandidatesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        offer_email_service_1.OfferEmailService])
], CandidatesService);
//# sourceMappingURL=candidates.service.js.map