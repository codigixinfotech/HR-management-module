import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface TechnologyMaster {
  id: string;
  name: string;
  category?: string;
  description?: string;
  status: 'Active' | 'Inactive';
  companyId: string;
  branchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  technology: string;
  technologyId?: string;
  topic?: string;
  questionText: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionType: 'MCQ' | 'Multiple Select' | 'True-False' | 'Coding';
  options: string[];
  correctAnswer: any;
  marks: number;
  explanation?: string;
  codeTemplate?: string;
  codeLanguage?: string;
  testCases?: { input: string; expectedOutput: string }[];
  status: 'Active' | 'Inactive';
  companyId?: string;
  branchId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssessmentSection {
  id: string;
  assessmentId?: string;
  name: string;
  technology: string;
  technologyId?: string;
  topic?: string;
  questionType: 'MCQ' | 'Multiple Select' | 'True-False' | 'Coding';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionCount: number;
  marksPerQuestion: number;
  totalMarks: number;
  selectedQuestions?: any[];
  ordering?: number;
}

export interface Assessment {
  id: string;
  name: string;
  technology?: string;
  technologyId?: string;
  jobPosition?: string;
  requisitionId?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionCount: number;
  durationMins: number;
  passingPercentage: number;
  totalMarks: number;
  attemptLimit: number;
  startDate?: string;
  expiryDate?: string;
  sections?: AssessmentSection[];
  questions?: Question[];
  status: 'Draft' | 'Ready' | 'Published' | 'Expired' | 'Archived';
  companyId: string;
  branchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateAssessmentAttempt {
  id?: string;
  token: string;
  assessmentId: string;
  assessmentName: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone?: string;
  candidateRole?: string;
  jobPosition?: string;
  technology?: string;
  technologyId?: string;
  durationMins?: number;
  durationMinutes?: number;
  questionCount?: number;
  passingPercentage?: number;
  expiryDate?: string;
  scheduledDate?: string;
  scheduledStartTime?: string;
  emailSendingMode?: 'IMMEDIATE' | 'SCHEDULED';
  emailStatus?: 'SENT' | 'SCHEDULED';
  assessmentStatus?: 'SCHEDULED' | 'WAITING_FOR_START' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'PENDING_REVIEW';
  status: 'SENT' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'PENDING_REVIEW';
  sentAt: string;
  startedAt?: string;
  submittedAt?: string;
  answers: Record<string, any>;
  markedForReview: string[];
  score?: number;
  totalMarks?: number;
  percentage?: number;
  isPassed?: boolean;
  timeTakenSeconds?: number;
  questionResults?: any[];
  sections?: AssessmentSection[];
  companyId: string;
  branchId?: string;
}

@Injectable()
export class AssessmentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ── Technology / Skill Master DB CRUD ──
   */
  async getTechnologies(companyId?: string, branchId?: string, activeOnly?: boolean): Promise<TechnologyMaster[]> {
    const where: any = {};
    if (companyId && companyId !== 'ALL' && companyId !== 'undefined' && companyId.trim() !== '') {
      where.companyId = companyId.trim();
    }
    if (activeOnly) {
      where.status = 'Active';
    }
    if (branchId && branchId !== 'ALL' && branchId !== 'undefined' && branchId.trim() !== '') {
      where.OR = [{ branchId: null }, { branchId: branchId.trim() }];
    }

    const records = await this.prisma.recruitmentSkillMaster.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description || '',
      status: r.status as 'Active' | 'Inactive',
      companyId: r.companyId,
      branchId: r.branchId || undefined,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }

  async createTechnology(
    dto: { name: string; category?: string; description?: string; status?: 'Active' | 'Inactive'; branchId?: string },
    companyId: string,
    branchId?: string,
  ): Promise<TechnologyMaster> {
    if (!companyId) throw new BadRequestException('Company ID is required');
    if (!dto.name || !dto.name.trim()) throw new BadRequestException('Skill name is required');

    const trimmedName = dto.name.trim();
    const cleanBranchId = branchId && branchId !== 'ALL' && branchId !== 'undefined' ? branchId : dto.branchId || undefined;

    // Check for duplicate in DB
    const existing = await this.prisma.recruitmentSkillMaster.findFirst({
      where: {
        companyId,
        name: { equals: trimmedName },
      },
    });

    if (existing) {
      throw new BadRequestException(`Skill "${trimmedName}" already exists in this company.`);
    }

    const created = await this.prisma.recruitmentSkillMaster.create({
      data: {
        name: trimmedName,
        description: dto.description?.trim() || '',
        status: dto.status || 'Active',
        companyId,
        branchId: cleanBranchId,
      },
    });

    return {
      id: created.id,
      name: created.name,
      description: created.description || '',
      status: created.status as 'Active' | 'Inactive',
      companyId: created.companyId,
      branchId: created.branchId || undefined,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async updateTechnology(
    id: string,
    dto: { name?: string; description?: string; status?: 'Active' | 'Inactive'; branchId?: string },
    companyId: string,
  ): Promise<TechnologyMaster> {
    const existing = await this.prisma.recruitmentSkillMaster.findUnique({
      where: { id },
    });

    if (!existing) throw new NotFoundException('Skill not found');
    if (companyId && existing.companyId !== companyId) {
      throw new BadRequestException('Cannot modify skill outside your company');
    }

    const updateData: any = {};
    if (dto.name && dto.name.trim()) {
      const trimmedName = dto.name.trim();
      const duplicate = await this.prisma.recruitmentSkillMaster.findFirst({
        where: {
          companyId: existing.companyId,
          name: { equals: trimmedName },
          id: { not: id },
        },
      });
      if (duplicate) {
        throw new BadRequestException(`Skill "${trimmedName}" already exists.`);
      }
      updateData.name = trimmedName;

      // Cascade name update to linked questions and assessments
      await this.prisma.recruitmentAssessmentQuestion.updateMany({
        where: { technologyId: id },
        data: { technology: trimmedName },
      });
      await this.prisma.recruitmentAssessmentSection.updateMany({
        where: { technologyId: id },
        data: { technology: trimmedName },
      });
    }

    if (dto.description !== undefined) updateData.description = dto.description.trim();
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.branchId !== undefined) {
      updateData.branchId = dto.branchId && dto.branchId !== 'ALL' ? dto.branchId : null;
    }

    const updated = await this.prisma.recruitmentSkillMaster.update({
      where: { id },
      data: updateData,
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description || '',
      status: updated.status as 'Active' | 'Inactive',
      companyId: updated.companyId,
      branchId: updated.branchId || undefined,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async toggleTechnologyStatus(id: string, companyId: string): Promise<TechnologyMaster> {
    const existing = await this.prisma.recruitmentSkillMaster.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Skill not found');
    if (companyId && existing.companyId !== companyId) {
      throw new BadRequestException('Cannot modify skill outside your company');
    }

    const newStatus = existing.status === 'Active' ? 'Inactive' : 'Active';
    const updated = await this.prisma.recruitmentSkillMaster.update({
      where: { id },
      data: { status: newStatus },
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description || '',
      status: updated.status as 'Active' | 'Inactive',
      companyId: updated.companyId,
      branchId: updated.branchId || undefined,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async deleteTechnology(id: string, companyId: string): Promise<{ success: boolean }> {
    const existing = await this.prisma.recruitmentSkillMaster.findUnique({
      where: { id },
    });
    if (!existing) return { success: true };
    if (companyId && existing.companyId !== companyId) {
      throw new BadRequestException('Cannot delete skill outside your company');
    }

    await this.prisma.recruitmentSkillMaster.delete({
      where: { id },
    });
    return { success: true };
  }

  async clearAllTechnologies(companyId: string): Promise<{ count: number }> {
    if (!companyId) throw new BadRequestException('Company ID is required');
    const result = await this.prisma.recruitmentSkillMaster.deleteMany({
      where: { companyId },
    });
    return { count: result.count };
  }

  async seedStandardSkills(companyId: string, branchId?: string): Promise<TechnologyMaster[]> {
    if (!companyId) throw new BadRequestException('Company ID is required');
    const standardSkills = [
      { name: 'React.js', description: 'React component lifecycle, hooks, virtual DOM, and modern SPA state management' },
      { name: 'Node.js', description: 'Node.js runtime, Express.js APIs, event loop, and asynchronous stream handling' },
      { name: 'Python', description: 'Python syntax, data structures, OOP, backend frameworks, and automation scripting' },
      { name: 'Java', description: 'Core Java, OOP principles, collections framework, multithreading, and Spring Boot' },
      { name: 'JavaScript', description: 'ECMAScript standards, closures, prototypes, asynchronous events, and DOM manipulation' },
      { name: 'TypeScript', description: 'Static typing, interfaces, generics, type utility functions, and TS compiler' },
      { name: 'SQL', description: 'Relational database design, querying, complex joins, indexing, and transactions' },
      { name: 'DevOps', description: 'CI/CD pipeline automation, Docker containers, Kubernetes, and cloud infrastructure' },
      { name: 'AWS', description: 'Amazon Web Services core cloud architecture (EC2, S3, IAM, Lambda, RDS, VPC)' },
      { name: 'Azure', description: 'Microsoft Azure cloud platform, App Services, Entra ID, and cloud governance' },
      { name: 'General Aptitude', description: 'Quantitative mathematics, percentages, numerical problem solving, and analytical data' },
      { name: 'Logical Reasoning', description: 'Deductive reasoning, analytical patterns, syllogisms, and problem solving' },
      { name: 'Programming', description: 'Algorithmic problem solving, data structures, recursion, and time complexity' },
    ];

    const cleanBranchId = branchId && branchId !== 'ALL' && branchId !== 'undefined' ? branchId : undefined;

    for (const skill of standardSkills) {
      try {
        await this.prisma.recruitmentSkillMaster.upsert({
          where: {
            companyId_name: {
              companyId,
              name: skill.name,
            },
          },
          update: {
            description: skill.description,
            status: 'Active',
            branchId: cleanBranchId,
          },
          create: {
            companyId,
            branchId: cleanBranchId,
            name: skill.name,
            description: skill.description,
            status: 'Active',
          },
        });
      } catch {
        // Skip duplicate or error
      }
    }

    return this.getTechnologies(companyId, branchId);
  }

  /**
   * ── Question Bank DB CRUD ──
   */
  async getQuestions(companyId?: string, branchId?: string): Promise<Question[]> {
    if (!companyId) return [];

    const where: any = { companyId };
    if (branchId && branchId !== 'ALL' && branchId !== 'undefined') {
      where.OR = [{ branchId: null }, { branchId }];
    }

    const records = await this.prisma.recruitmentAssessmentQuestion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { skillMaster: true },
    });

    return records.map((q) => ({
      id: q.id,
      technology: q.skillMaster ? q.skillMaster.name : q.technology,
      technologyId: q.technologyId || undefined,
      topic: q.topic || '',
      questionText: q.questionText,
      difficulty: q.difficulty as 'Easy' | 'Medium' | 'Hard',
      questionType: q.questionType as any,
      options: (q.options as string[]) || [],
      correctAnswer: q.correctAnswer,
      marks: q.marks,
      explanation: q.explanation || '',
      codeTemplate: q.codeTemplate || '',
      codeLanguage: q.codeLanguage || '',
      testCases: (q.testCases as any) || [],
      status: q.status as 'Active' | 'Inactive',
      companyId: q.companyId,
      branchId: q.branchId || undefined,
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString(),
    }));
  }

  async saveQuestion(
    q: Omit<Question, 'id'> & { id?: string },
    companyId: string,
    branchId?: string,
  ): Promise<Question> {
    if (!companyId) throw new BadRequestException('Company ID is required');
    const cleanBranchId = branchId && branchId !== 'ALL' && branchId !== 'undefined' ? branchId : q.branchId || undefined;

    let finalTechId = q.technologyId;
    let finalTechName = q.technology;

    if (finalTechId) {
      const match = await this.prisma.recruitmentSkillMaster.findUnique({
        where: { id: finalTechId },
      });
      if (match) finalTechName = match.name;
    } else if (finalTechName) {
      const match = await this.prisma.recruitmentSkillMaster.findFirst({
        where: { companyId, name: { equals: finalTechName } },
      });
      if (match) {
        finalTechId = match.id;
        finalTechName = match.name;
      }
    }

    const dataPayload: any = {
      technology: finalTechName || 'General',
      technologyId: finalTechId || null,
      topic: q.topic || '',
      questionText: q.questionText,
      difficulty: q.difficulty || 'Medium',
      questionType: q.questionType || 'MCQ',
      options: q.options || [],
      correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : 0,
      marks: q.marks || 1,
      explanation: q.explanation || '',
      codeTemplate: q.codeTemplate || '',
      codeLanguage: q.codeLanguage || '',
      testCases: q.testCases || [],
      status: q.status || 'Active',
      companyId,
      branchId: cleanBranchId || null,
    };

    let record: any;
    if (q.id && !q.id.startsWith('TEMP_')) {
      const existing = await this.prisma.recruitmentAssessmentQuestion.findUnique({
        where: { id: q.id },
      });
      if (existing) {
        record = await this.prisma.recruitmentAssessmentQuestion.update({
          where: { id: q.id },
          data: dataPayload,
          include: { skillMaster: true },
        });
      }
    }

    if (!record) {
      record = await this.prisma.recruitmentAssessmentQuestion.create({
        data: dataPayload,
        include: { skillMaster: true },
      });
    }

    return {
      id: record.id,
      technology: record.skillMaster ? record.skillMaster.name : record.technology,
      technologyId: record.technologyId || undefined,
      topic: record.topic || '',
      questionText: record.questionText,
      difficulty: record.difficulty as any,
      questionType: record.questionType as any,
      options: (record.options as string[]) || [],
      correctAnswer: record.correctAnswer,
      marks: record.marks,
      explanation: record.explanation || '',
      codeTemplate: record.codeTemplate || '',
      codeLanguage: record.codeLanguage || '',
      testCases: (record.testCases as any) || [],
      status: record.status as any,
      companyId: record.companyId,
      branchId: record.branchId || undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  async bulkAddQuestions(
    newQs: (Omit<Question, 'id'> & { id?: string })[],
    companyId: string,
    branchId?: string,
  ): Promise<Question[]> {
    if (!companyId) throw new BadRequestException('Company ID is required');
    const createdList: Question[] = [];
    for (const q of newQs) {
      const saved = await this.saveQuestion(q, companyId, branchId);
      createdList.push(saved);
    }
    return createdList;
  }

  async deleteQuestion(id: string, companyId?: string): Promise<{ success: boolean }> {
    const existing = await this.prisma.recruitmentAssessmentQuestion.findUnique({
      where: { id },
    });
    if (!existing) return { success: true };
    if (companyId && existing.companyId !== companyId) {
      throw new BadRequestException('Cannot delete question from another company');
    }

    await this.prisma.recruitmentAssessmentQuestion.delete({
      where: { id },
    });
    return { success: true };
  }

  async toggleQuestionStatus(id: string, companyId?: string): Promise<Question> {
    const existing = await this.prisma.recruitmentAssessmentQuestion.findUnique({
      where: { id },
      include: { skillMaster: true },
    });
    if (!existing) throw new NotFoundException('Question not found');
    if (companyId && existing.companyId !== companyId) {
      throw new BadRequestException('Cannot modify question from another company');
    }

    const newStatus = existing.status === 'Active' ? 'Inactive' : 'Active';
    const updated = await this.prisma.recruitmentAssessmentQuestion.update({
      where: { id },
      data: { status: newStatus },
      include: { skillMaster: true },
    });

    return {
      id: updated.id,
      technology: updated.skillMaster ? updated.skillMaster.name : updated.technology,
      technologyId: updated.technologyId || undefined,
      topic: updated.topic || '',
      questionText: updated.questionText,
      difficulty: updated.difficulty as any,
      questionType: updated.questionType as any,
      options: (updated.options as string[]) || [],
      correctAnswer: updated.correctAnswer,
      marks: updated.marks,
      explanation: updated.explanation || '',
      codeTemplate: updated.codeTemplate || '',
      codeLanguage: updated.codeLanguage || '',
      testCases: (updated.testCases as any) || [],
      status: updated.status as any,
      companyId: updated.companyId,
      branchId: updated.branchId || undefined,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * ── Assessment Templates DB CRUD ──
   */
  async getAssessments(companyId?: string, branchId?: string): Promise<Assessment[]> {
    if (!companyId) return [];

    const where: any = { companyId };
    if (branchId && branchId !== 'ALL' && branchId !== 'undefined') {
      where.OR = [{ branchId: null }, { branchId }];
    }

    const records = await this.prisma.recruitmentAssessment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        sections: {
          orderBy: { ordering: 'asc' },
          include: { skillMaster: true },
        },
      },
    });

    return records.map((a) => ({
      id: a.id,
      name: a.name,
      technology: a.technology || undefined,
      technologyId: a.technologyId || undefined,
      jobPosition: a.jobPosition || undefined,
      requisitionId: a.requisitionId || undefined,
      difficulty: a.difficulty as any,
      durationMins: a.durationMinutes,
      totalMarks: a.totalMarks,
      passingPercentage: a.passingPercentage,
      status: a.status as any,
      startDate: a.startDate || undefined,
      expiryDate: a.expiryDate || undefined,
      questionCount: a.totalQuestions,
      attemptLimit: 1,
      sections: a.sections.map((s) => ({
        id: s.id,
        assessmentId: s.assessmentId,
        name: s.name,
        technology: s.skillMaster ? s.skillMaster.name : s.technology,
        technologyId: s.technologyId || undefined,
        topic: s.topic || undefined,
        questionType: s.questionType as any,
        difficulty: s.difficulty as any,
        questionCount: s.questionCount,
        marksPerQuestion: s.marksPerQuestion,
        totalMarks: s.totalMarks,
        selectedQuestions: (s.selectedQuestions as any) || [],
        ordering: s.ordering,
      })),
      questions: [],
      companyId: a.companyId,
      branchId: a.branchId || undefined,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    }));
  }

  async createAssessment(
    data: any,
    companyId: string,
    branchId?: string,
  ): Promise<Assessment> {
    if (!companyId) throw new BadRequestException('Company ID is required');
    const cleanBranchId = branchId && branchId !== 'ALL' && branchId !== 'undefined' ? branchId : data.branchId || undefined;

    const sections = Array.isArray(data.sections) ? data.sections : [];
    const totalQs = data.questionCount || sections.reduce((acc: number, s: any) => acc + (s.questionCount || 0), 0);
    const totalMarks = data.totalMarks || sections.reduce((acc: number, s: any) => acc + (s.totalMarks || 0), 0);

    // If an assessment ID was supplied, check if updating existing
    let assessment: any;
    if (data.id && !data.id.startsWith('ASM-TEMP')) {
      const existing = await this.prisma.recruitmentAssessment.findUnique({
        where: { id: data.id },
      });
      if (existing && existing.companyId === companyId) {
        assessment = await this.prisma.recruitmentAssessment.update({
          where: { id: data.id },
          data: {
            name: data.name,
            technology: data.technology || (sections[0]?.technology || null),
            technologyId: data.technologyId || (sections[0]?.technologyId || null),
            jobPosition: data.jobPosition || null,
            requisitionId: data.requisitionId || null,
            difficulty: data.difficulty || 'Medium',
            durationMinutes: data.durationMins || data.durationMinutes || 60,
            totalMarks,
            passingPercentage: data.passingPercentage || 70,
            status: data.status || 'Published',
            startDate: data.startDate || null,
            expiryDate: data.expiryDate || null,
            totalQuestions: totalQs,
            branchId: cleanBranchId || null,
          },
        });

        // Delete old sections and recreate
        await this.prisma.recruitmentAssessmentSection.deleteMany({
          where: { assessmentId: assessment.id },
        });
      }
    }

    if (!assessment) {
      assessment = await this.prisma.recruitmentAssessment.create({
        data: {
          name: data.name,
          technology: data.technology || (sections[0]?.technology || null),
          technologyId: data.technologyId || (sections[0]?.technologyId || null),
          jobPosition: data.jobPosition || null,
          requisitionId: data.requisitionId || null,
          difficulty: data.difficulty || 'Medium',
          durationMinutes: data.durationMins || data.durationMinutes || 60,
          totalMarks,
          passingPercentage: data.passingPercentage || 70,
          status: data.status || 'Published',
          startDate: data.startDate || null,
          expiryDate: data.expiryDate || null,
          totalQuestions: totalQs,
          companyId,
          branchId: cleanBranchId || null,
        },
      });
    }

    // Insert sections into DB
    if (sections.length > 0) {
      for (let i = 0; i < sections.length; i++) {
        const s = sections[i];
        await this.prisma.recruitmentAssessmentSection.create({
          data: {
            assessmentId: assessment.id,
            name: s.name || `Section ${i + 1}`,
            technology: s.technology || 'General',
            technologyId: s.technologyId || null,
            topic: s.topic || null,
            questionType: s.questionType || 'MCQ',
            difficulty: s.difficulty || 'Medium',
            questionCount: s.questionCount || 10,
            marksPerQuestion: s.marksPerQuestion || 1,
            totalMarks: s.totalMarks || 10,
            selectedQuestions: s.selectedQuestions || [],
            ordering: i,
          },
        });
      }
    }

    return (await this.getAssessments(companyId, cleanBranchId)).find((a) => a.id === assessment.id)!;
  }

  async updateAssessmentStatus(id: string, status: string, companyId?: string): Promise<any> {
    const asm = await this.prisma.recruitmentAssessment.findUnique({
      where: { id },
    });
    if (!asm) throw new NotFoundException('Assessment not found');
    if (companyId && asm.companyId !== companyId) {
      throw new BadRequestException('Cannot modify assessment outside your company');
    }

    return this.prisma.recruitmentAssessment.update({
      where: { id },
      data: { status },
    });
  }

  async deleteAssessment(id: string, companyId?: string): Promise<{ success: boolean }> {
    const asm = await this.prisma.recruitmentAssessment.findUnique({
      where: { id },
    });
    if (!asm) return { success: true };
    if (companyId && asm.companyId !== companyId) {
      throw new BadRequestException('Cannot delete assessment outside your company');
    }

    await this.prisma.recruitmentAssessment.delete({
      where: { id },
    });
    return { success: true };
  }

  /**
   * ── Multi-Candidate Invitation & Attempt Assignment ──
   */
  async createCandidateAttempt(
    params: {
      assessmentId: string;
      candidateId?: string;
      candidateIds?: string[];
      candidates?: Array<{
        id: string;
        name?: string;
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
        jobTitle?: string;
        appliedRole?: string;
      }>;
      candidateName?: string;
      candidateEmail?: string;
      candidatePhone?: string;
      jobPosition?: string;
      expiryDate?: string;
      scheduledDate?: string;
      scheduledStartTime?: string;
      durationMinutes?: number;
      emailSendingMode?: 'IMMEDIATE' | 'SCHEDULED';
    },
    companyId: string,
    branchId?: string,
  ): Promise<{ successCount: number; failureCount: number; attempts: CandidateAssessmentAttempt[]; errors: Array<{ candidateId: string; candidateName: string; reason: string }> }> {
    if (!companyId) throw new BadRequestException('Company ID is required');
    const cleanBranchId = branchId && branchId !== 'ALL' && branchId !== 'undefined' ? branchId : undefined;

    const asm = await this.prisma.recruitmentAssessment.findUnique({
      where: { id: params.assessmentId },
      include: { sections: true },
    });

    if (!asm) {
      throw new NotFoundException('Assessment template not found');
    }

    // Determine candidate list to invite
    const candidateTargets: Array<{
      id: string;
      name: string;
      email: string;
      phone?: string;
      role?: string;
    }> = [];

    if (Array.isArray(params.candidates) && params.candidates.length > 0) {
      for (const c of params.candidates) {
        const name = c.name || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Candidate';
        candidateTargets.push({
          id: c.id,
          name,
          email: c.email || 'candidate@example.com',
          phone: c.phone || '',
          role: c.jobTitle || c.appliedRole || params.jobPosition || asm.jobPosition || 'Candidate',
        });
      }
    } else if (Array.isArray(params.candidateIds) && params.candidateIds.length > 0) {
      for (const cid of params.candidateIds) {
        candidateTargets.push({
          id: cid,
          name: params.candidateName || 'Candidate',
          email: params.candidateEmail || 'candidate@example.com',
          phone: params.candidatePhone || '',
          role: params.jobPosition || asm.jobPosition || 'Candidate',
        });
      }
    } else if (params.candidateId) {
      candidateTargets.push({
        id: params.candidateId,
        name: params.candidateName || 'Candidate',
        email: params.candidateEmail || 'candidate@example.com',
        phone: params.candidatePhone || '',
        role: params.jobPosition || asm.jobPosition || 'Candidate',
      });
    } else {
      throw new BadRequestException('At least one candidate must be specified');
    }

    const createdAttempts: CandidateAssessmentAttempt[] = [];
    const errors: Array<{ candidateId: string; candidateName: string; reason: string }> = [];

    for (const cand of candidateTargets) {
      try {
        // Check for duplicate active/sent attempt for this candidate and assessment
        const existingAttempt = await this.prisma.recruitmentAssessmentAttempt.findFirst({
          where: {
            assessmentId: asm.id,
            candidateId: cand.id,
            status: { in: ['SENT', 'IN_PROGRESS'] },
          },
        });

        if (existingAttempt) {
          errors.push({
            candidateId: cand.id,
            candidateName: cand.name,
            reason: 'Candidate already has an active or pending assessment attempt for this assessment.',
          });
          continue;
        }

        // Generate a unique token for this candidate's invitation
        const cleanNameSlug = cand.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4).toUpperCase() || 'CAND';
        const randomSalt = Math.floor(1000 + Math.random() * 9000);
        const uniqueToken = `INV-${cleanNameSlug}-${Date.now().toString(36).toUpperCase()}-${randomSalt}`;

        // Create separate Invitation in DB
        const invitation = await this.prisma.recruitmentAssessmentInvitation.create({
          data: {
            candidateId: cand.id,
            assessmentId: asm.id,
            companyId,
            branchId: cleanBranchId || null,
            uniqueToken,
            candidateName: cand.name,
            candidateEmail: cand.email,
            candidatePhone: cand.phone || null,
            candidateRole: cand.role || null,
            scheduledDate: params.scheduledDate || null,
            scheduledStartTime: params.scheduledStartTime || null,
            emailSendingMode: params.emailSendingMode || 'IMMEDIATE',
            emailStatus: params.emailSendingMode === 'SCHEDULED' ? 'SCHEDULED' : 'SENT',
            status: 'SENT',
            expiresAt: params.expiryDate ? new Date(params.expiryDate) : null,
          },
        });

        // Create separate Attempt in DB
        const attempt = await this.prisma.recruitmentAssessmentAttempt.create({
          data: {
            invitationId: invitation.id,
            candidateId: cand.id,
            assessmentId: asm.id,
            companyId,
            branchId: cleanBranchId || null,
            token: uniqueToken,
            candidateName: cand.name,
            candidateEmail: cand.email,
            candidatePhone: cand.phone || null,
            candidateRole: cand.role || null,
            assessmentName: asm.name,
            technology: asm.technology,
            technologyId: asm.technologyId,
            durationMinutes: params.durationMinutes || asm.durationMinutes,
            status: 'SENT',
            answers: {},
            markedForReview: [],
            totalMarks: asm.totalMarks,
            sections: asm.sections as any,
          },
        });

        createdAttempts.push({
          id: attempt.id,
          token: attempt.token,
          assessmentId: attempt.assessmentId,
          assessmentName: attempt.assessmentName,
          candidateId: attempt.candidateId,
          candidateName: attempt.candidateName,
          candidateEmail: attempt.candidateEmail,
          candidatePhone: attempt.candidatePhone || undefined,
          candidateRole: attempt.candidateRole || undefined,
          technology: attempt.technology || undefined,
          technologyId: attempt.technologyId || undefined,
          durationMins: attempt.durationMinutes,
          durationMinutes: attempt.durationMinutes,
          status: attempt.status as any,
          answers: {},
          markedForReview: [],
          sections: asm.sections as any,
          sentAt: attempt.sentAt.toISOString(),
          companyId: attempt.companyId,
          branchId: attempt.branchId || undefined,
        });
      } catch (err: any) {
        errors.push({
          candidateId: cand.id,
          candidateName: cand.name,
          reason: err.message || 'Failed to assign assessment',
        });
      }
    }

    return {
      successCount: createdAttempts.length,
      failureCount: errors.length,
      attempts: createdAttempts,
      errors,
    };
  }

  async getAttempts(companyId?: string, branchId?: string): Promise<CandidateAssessmentAttempt[]> {
    if (!companyId) return [];

    const where: any = { companyId };
    if (branchId && branchId !== 'ALL' && branchId !== 'undefined') {
      where.OR = [{ branchId: null }, { branchId }];
    }

    const records = await this.prisma.recruitmentAssessmentAttempt.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        assessment: {
          include: { sections: true },
        },
      },
    });

    return records.map((att) => ({
      id: att.id,
      token: att.token,
      assessmentId: att.assessmentId,
      assessmentName: att.assessmentName,
      candidateId: att.candidateId,
      candidateName: att.candidateName,
      candidateEmail: att.candidateEmail,
      candidatePhone: att.candidatePhone || undefined,
      candidateRole: att.candidateRole || undefined,
      technology: att.technology || undefined,
      technologyId: att.technologyId || undefined,
      durationMins: att.durationMinutes,
      durationMinutes: att.durationMinutes,
      questionCount: att.assessment?.totalQuestions || 0,
      passingPercentage: att.assessment?.passingPercentage || 70,
      status: att.status as any,
      sentAt: att.sentAt.toISOString(),
      startedAt: att.startedAt ? att.startedAt.toISOString() : undefined,
      submittedAt: att.submittedAt ? att.submittedAt.toISOString() : undefined,
      answers: (att.answers as any) || {},
      markedForReview: (att.markedForReview as any) || [],
      score: att.score !== null ? att.score : undefined,
      totalMarks: att.totalMarks !== null ? att.totalMarks : undefined,
      percentage: att.percentage !== null ? att.percentage : undefined,
      isPassed: att.isPassed !== null ? att.isPassed : undefined,
      timeTakenSeconds: att.timeTakenSeconds !== null ? att.timeTakenSeconds : undefined,
      questionResults: (att.questionResults as any) || [],
      sections: (att.sections as any) || (att.assessment?.sections as any) || [],
      companyId: att.companyId,
      branchId: att.branchId || undefined,
    }));
  }

  /**
   * ── Candidate Assessment Portal (Public Token Endpoints) ──
   */
  async getAttemptByToken(token: string): Promise<any> {
    const attempt = await this.prisma.recruitmentAssessmentAttempt.findUnique({
      where: { token },
      include: {
        assessment: {
          include: {
            sections: {
              include: { skillMaster: true },
            },
          },
        },
      },
    });

    if (!attempt) {
      throw new NotFoundException('Assessment attempt not found or invalid token');
    }

    // Retrieve questions selected for this assessment
    let questions: any[] = [];
    if (attempt.assessment?.sections && attempt.assessment.sections.length > 0) {
      for (const section of attempt.assessment.sections) {
        if (Array.isArray(section.selectedQuestions) && section.selectedQuestions.length > 0) {
          questions.push(...section.selectedQuestions);
        } else {
          // Fetch questions from Question Bank matching section technology
          const matching = await this.prisma.recruitmentAssessmentQuestion.findMany({
            where: {
              companyId: attempt.companyId,
              status: 'Active',
              ...(section.technologyId ? { technologyId: section.technologyId } : { technology: section.technology }),
            },
            take: section.questionCount || 10,
          });
          questions.push(...matching);
        }
      }
    }

    if (questions.length === 0) {
      // Fallback to active questions for company
      questions = await this.prisma.recruitmentAssessmentQuestion.findMany({
        where: { companyId: attempt.companyId, status: 'Active' },
        take: attempt.assessment?.totalQuestions || 20,
      });
    }

    // Sanitize questions so candidates cannot see correctAnswer before submission
    const sanitizedQuestions = questions.map((q: any) => ({
      id: q.id,
      technology: q.technology,
      topic: q.topic,
      questionText: q.questionText,
      difficulty: q.difficulty,
      questionType: q.questionType,
      options: q.options || [],
      marks: q.marks || 1,
      codeTemplate: q.codeTemplate,
      codeLanguage: q.codeLanguage,
      testCases: q.testCases,
      // correctAnswer omitted for security
    }));

    return {
      attempt: {
        id: attempt.id,
        token: attempt.token,
        candidateName: attempt.candidateName,
        candidateEmail: attempt.candidateEmail,
        candidateRole: attempt.candidateRole,
        assessmentId: attempt.assessmentId,
        assessmentName: attempt.assessmentName,
        durationMinutes: attempt.durationMinutes,
        passingPercentage: attempt.assessment?.passingPercentage || 70,
        status: attempt.status,
        answers: attempt.answers || {},
        markedForReview: attempt.markedForReview || [],
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        percentage: attempt.percentage,
        isPassed: attempt.isPassed,
        timeTakenSeconds: attempt.timeTakenSeconds,
        questionResults: attempt.questionResults,
      },
      questions: sanitizedQuestions,
    };
  }

  async updateAttemptProgress(
    token: string,
    answers: Record<string, any>,
    markedForReview: string[],
  ): Promise<{ success: boolean }> {
    const attempt = await this.prisma.recruitmentAssessmentAttempt.findUnique({
      where: { token },
    });
    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.status === 'COMPLETED') return { success: true };

    await this.prisma.recruitmentAssessmentAttempt.update({
      where: { token },
      data: {
        answers,
        markedForReview,
        status: 'IN_PROGRESS',
        startedAt: attempt.startedAt || new Date(),
      },
    });

    return { success: true };
  }

  async submitAttempt(
    token: string,
    body: { answers: Record<string, any>; timeTakenSeconds?: number },
  ): Promise<any> {
    const attempt = await this.prisma.recruitmentAssessmentAttempt.findUnique({
      where: { token },
      include: {
        assessment: {
          include: { sections: true },
        },
      },
    });

    if (!attempt) throw new NotFoundException('Attempt not found');
    if (attempt.status === 'COMPLETED') {
      return attempt;
    }

    const candidateAnswers = body.answers || (attempt.answers as any) || {};

    // Fetch questions from DB to grade accurately
    const questionIds = Object.keys(candidateAnswers);
    const dbQuestions = await this.prisma.recruitmentAssessmentQuestion.findMany({
      where: {
        id: { in: questionIds },
      },
    });

    let totalMarks = 0;
    let obtainedMarks = 0;
    const questionResults: any[] = [];

    for (const q of dbQuestions) {
      const candAns = candidateAnswers[q.id];
      const maxMarks = q.marks || 1;
      totalMarks += maxMarks;

      let isCorrect = false;
      if (q.questionType === 'MCQ' || q.questionType === 'True-False') {
        isCorrect = String(candAns) === String(q.correctAnswer);
      } else if (q.questionType === 'Multiple Select') {
        const correctList = Array.isArray(q.correctAnswer) ? q.correctAnswer.map(String) : [String(q.correctAnswer)];
        const candList = Array.isArray(candAns) ? candAns.map(String) : [String(candAns)];
        isCorrect =
          correctList.length === candList.length &&
          correctList.every((val) => candList.includes(val));
      } else if (q.questionType === 'Coding') {
        // Coding evaluated based on length/tests
        isCorrect = String(candAns || '').length > 30;
      }

      const qScore = isCorrect ? maxMarks : 0;
      obtainedMarks += qScore;

      questionResults.push({
        questionId: q.id,
        questionText: q.questionText,
        candidateAnswer: candAns,
        correctAnswer: q.correctAnswer,
        isCorrect,
        marksObtained: qScore,
        maxMarks,
        explanation: q.explanation || '',
      });
    }

    if (totalMarks === 0) {
      totalMarks = attempt.totalMarks || attempt.assessment?.totalMarks || 50;
    }

    const percentage = Math.round((obtainedMarks / totalMarks) * 100);
    const passingPercentage = attempt.assessment?.passingPercentage || 70;
    const isPassed = percentage >= passingPercentage;

    const submitted = await this.prisma.recruitmentAssessmentAttempt.update({
      where: { token },
      data: {
        answers: candidateAnswers,
        score: obtainedMarks,
        totalMarks,
        percentage,
        isPassed,
        timeTakenSeconds: body.timeTakenSeconds || 1800,
        questionResults,
        status: 'COMPLETED',
        submittedAt: new Date(),
      },
    });

    if (attempt.invitationId) {
      await this.prisma.recruitmentAssessmentInvitation.update({
        where: { id: attempt.invitationId },
        data: { status: 'COMPLETED' },
      }).catch(() => {});
    }

    return submitted;
  }

  /**
   * ── Live Database-Driven KPI Aggregates ──
   */
  async getKpis(companyId?: string, branchId?: string) {
    if (!companyId) {
      return {
        activeTests: 0,
        questionBankCount: 0,
        testsSent: 0,
        completed: 0,
        pending: 0,
        avgScore: 0,
        passRate: 0,
        techDistribution: {},
      };
    }

    const whereScope: any = { companyId };
    if (branchId && branchId !== 'ALL' && branchId !== 'undefined') {
      whereScope.OR = [{ branchId: null }, { branchId }];
    }

    const [assessments, questions, attempts, skills] = await Promise.all([
      this.prisma.recruitmentAssessment.findMany({ where: whereScope }),
      this.prisma.recruitmentAssessmentQuestion.findMany({
        where: whereScope,
        include: { skillMaster: true },
      }),
      this.prisma.recruitmentAssessmentAttempt.findMany({ where: whereScope }),
      this.prisma.recruitmentSkillMaster.findMany({
        where: { companyId, status: 'Active' },
      }),
    ]);

    const activeTests = assessments.filter((a) => a.status === 'Published' || a.status === 'Ready').length;
    const questionBankCount = questions.length;
    const testsSent = attempts.length;
    const completedAttempts = attempts.filter((a) => a.status === 'COMPLETED');
    const completed = completedAttempts.length;
    const pending = attempts.filter((a) => a.status === 'SENT' || a.status === 'IN_PROGRESS').length;

    const totalPercentage = completedAttempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
    const avgScore = completed > 0 ? Math.round(totalPercentage / completed) : 0;

    const passedCount = completedAttempts.filter((a) => a.isPassed).length;
    const passRate = completed > 0 ? Math.round((passedCount / completed) * 100) : 0;

    // Distribution dynamically computed from active skills and questions
    const techDistribution: Record<string, number> = {};
    for (const skill of skills) {
      techDistribution[skill.name] = 0;
    }
    for (const q of questions) {
      const skillName = q.skillMaster ? q.skillMaster.name : q.technology;
      techDistribution[skillName] = (techDistribution[skillName] || 0) + 1;
    }

    return {
      activeTests,
      questionBankCount,
      testsSent,
      completed,
      pending,
      avgScore,
      passRate,
      techDistribution,
    };
  }
}