import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CandidateStage } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCandidateDto, SaveCandidateScreeningDto } from './dto/candidate.dto';

import { OfferEmailService } from './offer-email.service';
import { AtsService } from './ats/ats.service';

@Injectable()
export class CandidatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly offerEmailService: OfferEmailService,
    private readonly atsService: AtsService,
  ) {}

  listForJobOpening(jobOpeningId: string) {
    return this.prisma.candidate.findMany({
      where: { jobOpeningId },
      include: {
        jobOpening: true,
        screenings: { orderBy: { createdAt: 'desc' }, take: 1 },
        atsAnalysis: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
      include: {
        jobOpening: {
          select: {
            id: true,
            title: true,
            requisitionCode: true,
            mrNumber: true,
            requiredSkills: true,
            preferredSkills: true,
            minExperience: true,
            maxExperience: true,
            qualification: true,
            department: { select: { id: true, name: true } },
          },
        },
        screenings: { orderBy: { createdAt: 'desc' } },
        atsAnalysis: true,
      },
    });
    if (!candidate) throw new NotFoundException('Candidate not found');
    return candidate;
  }

  async create(dto: CreateCandidateDto) {
    const jobOpening = await this.prisma.jobOpening.findUnique({
      where: { id: dto.jobOpeningId },
    });

    if (jobOpening) {
      // 1. Candidate type eligibility check
      if (jobOpening.candidateType === 'EXPERIENCED' && dto.candidateType === 'FRESHER') {
        throw new BadRequestException('This job requisition requires experienced candidates only.');
      }

      if (jobOpening.candidateType === 'FRESHER' && dto.candidateType === 'EXPERIENCED') {
        throw new BadRequestException('This job requisition is configured for Freshers only.');
      }

      // 2. Minimum experience validation for experienced applicants
      if (dto.candidateType === 'EXPERIENCED' && jobOpening.minExperience && jobOpening.minExperience > 0) {
        const candidateYears = parseFloat(dto.experience || '0');
        if (isNaN(candidateYears) || candidateYears < jobOpening.minExperience) {
          throw new BadRequestException(
            `Candidate does not meet the minimum experience requirement of ${jobOpening.minExperience} Years. Submitted: ${dto.experience || '0'} Years.`
          );
        }
      }
    }

    const { middleName, ...prismaData } = dto as any;
    const finalData = {
      ...prismaData,
      firstName: middleName ? `${prismaData.firstName || ''} ${middleName}`.trim() : prismaData.firstName,
    };

    // 1. Save candidate in database
    const candidate = await this.prisma.candidate.create({
      data: finalData,
      include: {
        jobOpening: { select: { title: true, requisitionCode: true } },
      },
    });

    // 2. Extract Application Reference ID
    let appId = `APP-2026-${candidate.id.substring(candidate.id.length - 6)}`;
    if (candidate.notes && candidate.notes.includes('App Ref:')) {
      const match = candidate.notes.match(/App Ref:\s*([A-Z0-9-]+)/);
      if (match && match[1]) appId = match[1];
    }

    const jobTitle = candidate.jobOpening?.title || jobOpening?.title || 'Applied Position';
    const reqCode = candidate.jobOpening?.requisitionCode || jobOpening?.requisitionCode || 'JR-2026-001';
    const formattedDate = new Date(candidate.createdAt).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

    // 3. Trigger automatic confirmation email asynchronously after DB transaction succeeds
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
        // Logging error so candidate submission is not interrupted if SMTP is unreachable
      });

    // 4. Trigger ATS Resume Parsing & Candidate Job Matching asynchronously
    this.atsService.processCandidateAsync(candidate.id).catch((err) => {
      // Log error so candidate creation is not interrupted
    });

    return candidate;
  }

  async updateStage(id: string, stage: CandidateStage) {
    await this.findById(id);
    return this.prisma.candidate.update({ where: { id }, data: { stage } });
  }

  async getLatestScreening(candidateId: string) {
    await this.findById(candidateId);
    return this.prisma.candidateScreening.findFirst({
      where: { candidateId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async saveScreening(candidateId: string, dto: SaveCandidateScreeningDto) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      include: { jobOpening: true },
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${candidateId} not found`);
    }

    if (!candidate.jobOpening) {
      throw new NotFoundException(`Job Requisition for candidate ${candidateId} does not exist`);
    }

    // Validation Rules:
    if (dto.relevantExperienceYears !== undefined && dto.relevantExperienceYears !== null && dto.relevantExperienceYears < 0) {
      throw new BadRequestException('Relevant Experience cannot be negative');
    }

    if (dto.currentCtc !== undefined && dto.currentCtc !== null && dto.currentCtc < 0) {
      throw new BadRequestException('Current CTC cannot be negative');
    }

    if (dto.expectedCtc !== undefined && dto.expectedCtc !== null && dto.expectedCtc < 0) {
      throw new BadRequestException('Expected CTC cannot be negative');
    }

    if (!dto.technicalRating || dto.technicalRating < 1 || dto.technicalRating > 5) {
      throw new BadRequestException('Technical Rating must be between 1 and 5');
    }

    if (!dto.communicationRating || dto.communicationRating < 1 || dto.communicationRating > 5) {
      throw new BadRequestException('Communication Rating must be between 1 and 5');
    }

    if (!dto.profileMatchRating || dto.profileMatchRating < 1 || dto.profileMatchRating > 5) {
      throw new BadRequestException('Profile Match rating must be between 1 and 5');
    }

    if (!dto.screeningDecision || !['SHORTLIST', 'HOLD', 'REJECT'].includes(dto.screeningDecision)) {
      throw new BadRequestException('Screening Decision is mandatory and must be Shortlist, Hold, or Reject');
    }

    if (dto.screeningDecision === 'REJECT' && (!dto.screeningRemarks || !dto.screeningRemarks.trim()) && (!dto.rejectionReason || !dto.rejectionReason.trim())) {
      throw new BadRequestException('Rejection remarks/reason are required when rejecting a candidate');
    }

    // Calculate overall score (average of ratings rounded to 2 decimal places)
    const rawScore = (Number(dto.technicalRating) + Number(dto.communicationRating) + Number(dto.profileMatchRating)) / 3;
    const overallScreeningScore = Math.round(rawScore * 100) / 100;

    // Determine target candidate stage
    let targetStage: CandidateStage;
    if (dto.screeningDecision === 'SHORTLIST') {
      targetStage = CandidateStage.SHORTLISTED;
    } else if (dto.screeningDecision === 'HOLD') {
      targetStage = CandidateStage.ON_HOLD;
    } else {
      targetStage = CandidateStage.REJECTED;
    }

    const screenedBy = dto.screenedBy || 'Aishwarya Roy (Director HR)';
    const lastUpdatedBy = dto.lastUpdatedBy || screenedBy;
    const now = new Date();

    // Create CandidateScreening record
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

    // Update candidate record
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

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.candidate.delete({ where: { id } });
    return { success: true };
  }

  async update(id: string, dto: any) {
    await this.findById(id);
    const { middleName, ...prismaData } = dto;
    const finalData = {
      ...prismaData,
      firstName: middleName ? `${prismaData.firstName || ''} ${middleName}`.trim() : prismaData.firstName,
    };
    const updated = await this.prisma.candidate.update({
      where: { id },
      data: finalData,
    });

    // Trigger ATS Resume Re-Parsing & Score Re-Analysis asynchronously upon profile/resume update
    this.atsService.processCandidateAsync(id).catch((err) => {
      // Log error so update transaction is not interrupted
    });

    return updated;
  }
}

