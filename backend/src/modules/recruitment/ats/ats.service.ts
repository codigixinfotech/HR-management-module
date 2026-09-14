import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { ResumeParserService } from './resume-parser.service';
import { SkillMatchingService } from './skill-matching.service';
import { ExperienceMatchingService } from './experience-matching.service';

@Injectable()
export class AtsService {
  private readonly logger = new Logger(AtsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly resumeParserService: ResumeParserService,
    private readonly skillMatchingService: SkillMatchingService,
    private readonly experienceMatchingService: ExperienceMatchingService,
  ) {}

  /**
   * Triggers asynchronous ATS analysis for a candidate application
   */
  async processCandidateAsync(candidateId: string): Promise<void> {
    try {
      this.logger.log(`Starting ATS processing for candidate ID ${candidateId}`);
      await this.analyzeCandidate(candidateId);
      this.logger.log(`Completed ATS processing for candidate ID ${candidateId}`);
    } catch (err: any) {
      this.logger.error(`Error processing ATS for candidate ${candidateId}: ${err.message}`, err.stack);
    }
  }

  /**
   * Synchronously analyzes candidate resume & computes ATS Match Score
   */
  async analyzeCandidate(candidateId: string) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: candidateId },
      include: {
        jobOpening: true,
      },
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${candidateId} not found`);
    }

    const jobOpening = candidate.jobOpening;

    // Resolve requisition criteria (skills, minExperience, qualification)
    const reqCriteria = this.resolveRequisitionRequirements(jobOpening);

    // 1. Parse Resume & Extract Candidate Entities from physical file & candidate data
    const parsedData = await this.resumeParserService.parseCandidateResume(candidate);

    // 2. Perform Skill Matching against Target Requisition Requirements
    const skillResult = this.skillMatchingService.matchSkills(
      parsedData.skills,
      reqCriteria.requiredSkills,
    );

    // 3. Perform Experience Matching against Min/Max Experience
    const expResult = this.experienceMatchingService.matchExperience(
      parsedData.experienceYears,
      reqCriteria.minExperience,
      jobOpening?.maxExperience,
    );

    // 4. Perform Qualification Matching
    const candidateQual =
      candidate.qualification || (parsedData.education && parsedData.education[0]) || null;
    const qualResult = this.experienceMatchingService.matchQualification(
      candidateQual,
      reqCriteria.qualification,
    );

    // 5. Calculate Dynamic Weighted ATS Match Score:
    //    - Skill Match Weight: 50%
    //    - Experience Match Weight: 30%
    //    - Qualification Match Weight: 20%
    //    finalScore = (skillMatchPercentage * 0.50) + (experienceMatchPercentage * 0.30) + (qualificationMatchPercentage * 0.20)
    const weightedScore =
      skillResult.score * 0.50 + expResult.score * 0.30 + qualResult.score * 0.20;
    const finalScore = Math.min(100, Math.max(0, Math.round(weightedScore)));

    // 6. Save or Update ATS Analysis Record in Database
    const atsAnalysis = await this.prisma.atsAnalysis.upsert({
      where: { candidateId: candidate.id },
      update: {
        jobOpeningId: jobOpening?.id ?? '',
        matchScore: finalScore,
        skillsMatched: skillResult.matchedSkills,
        skillsMissing: skillResult.missingSkills,
        experienceMatch: expResult as any,
        qualificationMatch: qualResult as any,
        extractedData: parsedData as any,
        rawResumeText: parsedData.rawTextPreview,
        status: 'COMPLETED',
        analyzedAt: new Date(),
      },
      create: {
        candidateId: candidate.id,
        jobOpeningId: jobOpening?.id ?? '',
        matchScore: finalScore,
        skillsMatched: skillResult.matchedSkills,
        skillsMissing: skillResult.missingSkills,
        experienceMatch: expResult as any,
        qualificationMatch: qualResult as any,
        extractedData: parsedData as any,
        rawResumeText: parsedData.rawTextPreview,
        status: 'COMPLETED',
      },
    });

    // 7. Update Candidate Record aiMatchScore with the same calculated score
    await this.prisma.candidate.update({
      where: { id: candidate.id },
      data: { aiMatchScore: finalScore },
    });

    return atsAnalysis;
  }

  /**
   * Retrieves stored ATS analysis for a candidate
   */
  async getAnalysisByCandidateId(candidateId: string) {
    const analysis = await this.prisma.atsAnalysis.findUnique({
      where: { candidateId },
    });

    if (!analysis) {
      // If not analyzed yet, run analysis on demand
      return this.analyzeCandidate(candidateId);
    }

    return analysis;
  }

  private resolveRequisitionRequirements(jobOpening: any) {
    if (!jobOpening) {
      return { requiredSkills: '', minExperience: 0, qualification: '' };
    }

    const requiredSkills = (
      jobOpening.requiredSkills ||
      jobOpening.preferredSkills ||
      ''
    ).trim();
    const minExperience =
      jobOpening.minExperience !== null && jobOpening.minExperience !== undefined
        ? jobOpening.minExperience
        : 0;
    const qualification = (
      jobOpening.qualification ||
      jobOpening.preferredQualification ||
      ''
    ).trim();

    return { requiredSkills, minExperience, qualification };
  }
}
