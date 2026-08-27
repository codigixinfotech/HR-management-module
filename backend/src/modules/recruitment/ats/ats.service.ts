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

    // 1. Parse Resume & Extract Candidate Entities
    const parsedData = this.resumeParserService.parseCandidateResume(candidate);

    // 2. Perform Skill Matching against Target Requisition Requirements
    const skillResult = this.skillMatchingService.matchSkills(
      parsedData.skills,
      reqCriteria.requiredSkills
    );

    // 3. Perform Experience Matching against Min/Max Experience
    const expResult = this.experienceMatchingService.matchExperience(
      parsedData.experienceYears,
      reqCriteria.minExperience,
      jobOpening.maxExperience
    );

    // 4. Perform Qualification Matching
    const qualResult = this.experienceMatchingService.matchQualification(
      candidate.qualification || parsedData.education[0],
      reqCriteria.qualification
    );

    // 5. Calculate Dynamic Weighted ATS Match Score:
    //    - Skill Match Weight: 50%
    //    - Experience Match Weight: 30%
    //    - Qualification Match Weight: 20%
    const weightedScore =
      skillResult.score * 0.5 + expResult.score * 0.3 + qualResult.score * 0.2;
    const finalScore = Math.min(100, Math.max(10, Math.round(weightedScore * 10) / 10));

    // 6. Save or Update ATS Analysis Record in Database
    const atsAnalysis = await (this.prisma as any).atsAnalysis.upsert({
      where: { candidateId: candidate.id },
      update: {
        jobOpeningId: jobOpening.id,
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
        jobOpeningId: jobOpening.id,
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

    // 7. Update Candidate Record aiMatchScore
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
    const analysis = await (this.prisma as any).atsAnalysis.findUnique({
      where: { candidateId },
    });

    if (!analysis) {
      // If not analyzed yet, run analysis on demand
      return this.analyzeCandidate(candidateId);
    }

    return analysis;
  }

  private resolveRequisitionRequirements(jobOpening: any) {
    let requiredSkills = jobOpening.requiredSkills || jobOpening.preferredSkills || '';
    let minExperience = jobOpening.minExperience;
    let qualification = jobOpening.qualification || jobOpening.preferredQualification || 'Graduate';

    const titleLower = (jobOpening.title || '').toLowerCase();

    // Fallback required skills & min experience based on job title if not explicitly set in database
    if (!requiredSkills.trim()) {
      if (titleLower.includes('devops')) {
        requiredSkills = 'Docker, Kubernetes, AWS, CI/CD, Linux, Terraform, Shell Scripting';
      } else if (titleLower.includes('senior')) {
        requiredSkills = 'React, TypeScript, Node.js, System Architecture, SQL, Microservices, Git, CI/CD';
      } else if (titleLower.includes('product designer') || titleLower.includes('design')) {
        requiredSkills = 'Figma, UI/UX Design, Wireframing, Prototyping, User Research, Design Systems';
      } else {
        requiredSkills = 'React, TypeScript, Node.js, MySQL, REST API, Git, Problem Solving';
      }
    }

    if (minExperience === null || minExperience === undefined || minExperience === 0) {
      if (titleLower.includes('senior') || titleLower.includes('lead')) {
        minExperience = 5;
      } else if (titleLower.includes('devops')) {
        minExperience = 3;
      } else if (jobOpening.candidateType === 'EXPERIENCED') {
        minExperience = 2;
      } else {
        minExperience = 0;
      }
    }

    return { requiredSkills, minExperience, qualification };
  }
}
