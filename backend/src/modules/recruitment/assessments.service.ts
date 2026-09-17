import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { getUploadsRootDir } from '../../common/utils/upload-path.util';

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
  topic: string;
  questionText: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionType: 'MCQ' | 'Multiple Select' | 'True-False' | 'Coding';
  options: string[];
  correctAnswer: any;
  marks: number;
  explanation: string;
  codeTemplate?: string;
  codeLanguage?: string;
  testCases?: { input: string; expectedOutput: string }[];
  status: 'Active' | 'Inactive';
  companyId?: string;
  branchId?: string;
}

export interface AssessmentSection {
  id: string;
  name: string;
  technology: string;
  technologyId?: string;
  topic?: string;
  questionType: 'MCQ' | 'Multiple Select' | 'True-False' | 'Coding';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionCount: number;
  marksPerQuestion: number;
  totalMarks: number;
  selectedQuestions?: Question[];
}

export interface Assessment {
  id: string;
  name: string;
  technology: string;
  technologyId?: string;
  jobPosition: string;
  requisitionId?: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  questionCount: number;
  durationMins: number;
  passingPercentage: number;
  totalMarks: number;
  attemptLimit: number;
  startDate: string;
  expiryDate: string;
  sections?: AssessmentSection[];
  questions: Question[];
  status: 'Draft' | 'Ready' | 'Published' | 'Expired' | 'Archived';
  companyId: string;
  branchId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CandidateAssessmentAttempt {
  token: string;
  assessmentId: string;
  assessmentName: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  jobPosition: string;
  technology: string;
  durationMins: number;
  questionCount: number;
  passingPercentage: number;
  expiryDate: string;
  scheduledDate?: string;
  scheduledStartTime?: string;
  durationMinutes?: number;
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
export class AssessmentsService implements OnModuleInit {
  private assessments: Assessment[] = [];
  private questions: Question[] = [];
  private attempts: CandidateAssessmentAttempt[] = [];
  private technologies: TechnologyMaster[] = [];
  private initializedCompanies: string[] = [];

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.loadFromDisk();
  }

  private getStorageFilePath(): string {
    const dir = join(getUploadsRootDir(), 'assessments_data');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    return join(dir, 'assessments_store.json');
  }

  private loadFromDisk() {
    try {
      const file = this.getStorageFilePath();
      if (existsSync(file)) {
        const raw = readFileSync(file, 'utf-8');
        const data = JSON.parse(raw);
        this.assessments = Array.isArray(data.assessments) ? data.assessments : [];
        this.questions = Array.isArray(data.questions) ? data.questions : [];
        this.attempts = Array.isArray(data.attempts) ? data.attempts : [];
        this.technologies = Array.isArray(data.technologies) ? data.technologies : [];
        this.initializedCompanies = Array.isArray(data.initializedCompanies) ? data.initializedCompanies : [];

        // Any company that previously had technologies is already initialized
        for (const t of this.technologies) {
          if (t.companyId && !this.initializedCompanies.includes(t.companyId)) {
            this.initializedCompanies.push(t.companyId);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to load recruitment assessments store from disk:', e);
    }
  }

  private persistToDisk() {
    try {
      const file = this.getStorageFilePath();
      const payload = {
        assessments: this.assessments,
        questions: this.questions,
        attempts: this.attempts,
        technologies: this.technologies,
        initializedCompanies: this.initializedCompanies,
      };
      writeFileSync(file, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Failed to save recruitment assessments store to disk:', e);
    }
  }

  /**
   * ── Technology / Skill Master CRUD ──
   */
  async getTechnologies(companyId?: string, branchId?: string, activeOnly?: boolean): Promise<TechnologyMaster[]> {
    if (!companyId) return [];
    this.loadFromDisk();

    return this.technologies.filter((t) => {
      if (t.companyId !== companyId) return false;
      if (activeOnly && t.status !== 'Active') return false;
      if (branchId && branchId !== 'ALL' && branchId !== 'undefined') {
        return !t.branchId || t.branchId === branchId;
      }
      return true;
    });
  }

  async createTechnology(
    dto: { name: string; category?: string; description?: string; status?: 'Active' | 'Inactive'; branchId?: string },
    companyId: string,
    branchId?: string,
  ): Promise<TechnologyMaster> {
    if (!companyId) throw new BadRequestException('Company ID is required');
    if (!dto.name || !dto.name.trim()) throw new BadRequestException('Technology name is required');

    if (!this.initializedCompanies.includes(companyId)) {
      this.initializedCompanies.push(companyId);
    }

    const trimmedName = dto.name.trim();

    // Prevent duplicate name (case-insensitive) within company
    const duplicate = this.technologies.find(
      (t) => t.companyId === companyId && t.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (duplicate) {
      throw new BadRequestException(`Technology or Skill "${trimmedName}" already exists in this company.`);
    }

    const cleanBranchId = branchId && branchId !== 'ALL' && branchId !== 'undefined' ? branchId : dto.branchId || undefined;
    const now = new Date().toISOString();
    const newTech: TechnologyMaster = {
      id: `TECH-${Math.floor(1000 + Math.random() * 9000)}`,
      name: trimmedName,
      category: dto.category?.trim() || 'General',
      description: dto.description?.trim() || '',
      status: dto.status || 'Active',
      companyId,
      branchId: cleanBranchId,
      createdAt: now,
      updatedAt: now,
    };

    this.technologies.unshift(newTech);
    this.persistToDisk();
    return newTech;
  }

  async updateTechnology(
    id: string,
    dto: { name?: string; category?: string; description?: string; status?: 'Active' | 'Inactive'; branchId?: string },
    companyId: string,
  ): Promise<TechnologyMaster> {
    const tech = this.technologies.find((t) => t.id === id);
    if (!tech) throw new NotFoundException('Technology not found');
    if (companyId && tech.companyId !== companyId) {
      throw new BadRequestException('Cannot modify technology outside your company');
    }

    if (dto.name && dto.name.trim()) {
      const trimmedName = dto.name.trim();
      const duplicate = this.technologies.find(
        (t) =>
          t.id !== id &&
          t.companyId === tech.companyId &&
          t.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );
      if (duplicate) {
        throw new BadRequestException(`Technology or Skill "${trimmedName}" already exists in this company.`);
      }
      const oldName = tech.name;
      tech.name = trimmedName;

      // Cascade updated technology name to all questions linked by ID or previous name
      this.questions.forEach((q) => {
        if (q.companyId === tech.companyId && (q.technologyId === id || q.technology === oldName)) {
          q.technologyId = id;
          q.technology = trimmedName;
        }
      });

      // Cascade updated technology name to all assessments and sections
      this.assessments.forEach((a) => {
        if (a.companyId === tech.companyId) {
          if (a.technologyId === id || a.technology === oldName) {
            a.technologyId = id;
            a.technology = trimmedName;
          }
          if (a.sections) {
            a.sections.forEach((sec) => {
              if (sec.technologyId === id || sec.technology === oldName) {
                sec.technologyId = id;
                sec.technology = trimmedName;
              }
            });
          }
        }
      });
    }

    if (dto.category !== undefined) tech.category = dto.category.trim();
    if (dto.description !== undefined) tech.description = dto.description.trim();
    if (dto.status !== undefined) tech.status = dto.status;
    if (dto.branchId !== undefined) tech.branchId = dto.branchId && dto.branchId !== 'ALL' ? dto.branchId : undefined;
    tech.updatedAt = new Date().toISOString();

    this.persistToDisk();
    return tech;
  }

  async toggleTechnologyStatus(id: string, companyId: string): Promise<TechnologyMaster> {
    const tech = this.technologies.find((t) => t.id === id);
    if (!tech) throw new NotFoundException('Technology not found');
    if (companyId && tech.companyId !== companyId) {
      throw new BadRequestException('Cannot modify technology outside your company');
    }

    tech.status = tech.status === 'Active' ? 'Inactive' : 'Active';
    tech.updatedAt = new Date().toISOString();
    this.persistToDisk();
    return tech;
  }

  async deleteTechnology(id: string, companyId: string): Promise<{ success: boolean }> {
    this.loadFromDisk();
    const idx = this.technologies.findIndex((t) => t.id === id);
    if (idx === -1) {
      return { success: true };
    }
    if (companyId && this.technologies[idx].companyId !== companyId) {
      throw new BadRequestException('Cannot delete technology outside your company');
    }

    this.technologies.splice(idx, 1);
    this.persistToDisk();
    return { success: true };
  }

  async clearAllTechnologies(companyId: string): Promise<{ count: number }> {
    if (!companyId) throw new BadRequestException('Company ID is required');
    this.loadFromDisk();
    const initialLen = this.technologies.length;
    this.technologies = this.technologies.filter((t) => t.companyId !== companyId);
    const removedCount = initialLen - this.technologies.length;
    this.persistToDisk();
    return { count: removedCount };
  }

  /**
   * Filter assessments strictly by company and branch
   */
  async getAssessments(companyId?: string, branchId?: string): Promise<Assessment[]> {
    if (!companyId) return [];

    return this.assessments.filter((a) => {
      if (a.companyId !== companyId) return false;
      if (branchId && branchId !== 'ALL' && branchId !== 'undefined') {
        return a.branchId === branchId;
      }
      return true;
    });
  }

  /**
   * Create an assessment strictly scoped to user's company and branch
   */
  async createAssessment(
    data: Omit<Assessment, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
    companyId: string,
    branchId?: string,
  ): Promise<Assessment> {
    if (!companyId) {
      throw new BadRequestException('Company ID is required to create an assessment');
    }

    const cleanBranchId = branchId && branchId !== 'ALL' && branchId !== 'undefined' ? branchId : undefined;
    const newId = data.id || `ASM-${Math.floor(800 + Math.random() * 199)}`;

    const newAssessment: Assessment = {
      ...data,
      id: newId,
      companyId,
      branchId: cleanBranchId,
      status: data.status || 'Published',
      questions: data.questions || [],
      totalMarks: data.totalMarks || 50,
      questionCount: data.questionCount || 45,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const idx = this.assessments.findIndex((a) => a.id === newId);
    if (idx >= 0) {
      this.assessments[idx] = newAssessment;
    } else {
      this.assessments.unshift(newAssessment);
    }

    this.persistToDisk();
    return newAssessment;
  }

  async updateAssessmentStatus(id: string, status: Assessment['status'], companyId?: string): Promise<Assessment> {
    const asm = this.assessments.find((a) => a.id === id);
    if (!asm) throw new NotFoundException('Assessment not found');
    if (companyId && asm.companyId !== companyId) {
      throw new BadRequestException('Cannot modify an assessment outside your company');
    }

    asm.status = status;
    asm.updatedAt = new Date().toISOString();
    this.persistToDisk();
    return asm;
  }

  async deleteAssessment(id: string, companyId?: string): Promise<{ success: boolean }> {
    const idx = this.assessments.findIndex((a) => a.id === id);
    if (idx === -1) throw new NotFoundException('Assessment not found');
    if (companyId && this.assessments[idx].companyId !== companyId) {
      throw new BadRequestException('Cannot delete an assessment outside your company');
    }

    this.assessments.splice(idx, 1);
    this.persistToDisk();
    return { success: true };
  }

  /**
   * Question Bank Scoping
   */
  async getQuestions(companyId?: string, branchId?: string): Promise<Question[]> {
    if (!companyId) return [];

    return this.questions.filter((q) => {
      if (q.companyId !== companyId) return false;
      if (branchId && branchId !== 'ALL' && branchId !== 'undefined') {
        return q.branchId === branchId;
      }
      return true;
    });
  }

  async saveQuestion(
    q: Omit<Question, 'id'> & { id?: string },
    companyId: string,
    branchId?: string,
  ): Promise<Question> {
    if (!companyId) throw new BadRequestException('Company ID required');
    const cleanBranchId = branchId && branchId !== 'ALL' && branchId !== 'undefined' ? branchId : undefined;
    const newId = q.id || `QST-${Math.floor(100 + Math.random() * 900)}`;

    let finalTechId = q.technologyId;
    let finalTechName = q.technology;
    if (finalTechId) {
      const match = this.technologies.find((t) => t.companyId === companyId && t.id === finalTechId);
      if (match) {
        finalTechName = match.name;
      }
    } else if (finalTechName) {
      const match = this.technologies.find(
        (t) => t.companyId === companyId && t.name.toLowerCase() === finalTechName.toLowerCase()
      );
      if (match) {
        finalTechId = match.id;
        finalTechName = match.name;
      }
    }

    const fullQuestion: Question = {
      ...q,
      id: newId,
      technology: finalTechName || 'General',
      technologyId: finalTechId,
      companyId,
      branchId: cleanBranchId,
      status: q.status || 'Active',
      options: q.options || [],
      marks: q.marks || 1,
    } as Question;

    const idx = this.questions.findIndex((item) => item.id === newId);
    if (idx >= 0) {
      this.questions[idx] = fullQuestion;
    } else {
      this.questions.unshift(fullQuestion);
    }

    this.persistToDisk();
    return fullQuestion;
  }

  async bulkAddQuestions(
    newQs: (Omit<Question, 'id'> & { id?: string })[],
    companyId: string,
    branchId?: string,
  ): Promise<Question[]> {
    if (!companyId) throw new BadRequestException('Company ID required');
    const cleanBranchId = branchId && branchId !== 'ALL' && branchId !== 'undefined' ? branchId : undefined;

    const createdList: Question[] = newQs.map((q, idx) => {
      let finalTechId = q.technologyId;
      let finalTechName = q.technology;
      if (finalTechId) {
        const match = this.technologies.find((t) => t.companyId === companyId && t.id === finalTechId);
        if (match) finalTechName = match.name;
      } else if (finalTechName) {
        const match = this.technologies.find(
          (t) => t.companyId === companyId && t.name.toLowerCase() === finalTechName.toLowerCase()
        );
        if (match) {
          finalTechId = match.id;
          finalTechName = match.name;
        }
      }

      return {
        ...q,
        id: q.id || `QST-${Math.floor(200 + Math.random() * 800 + idx)}`,
        technology: finalTechName || 'General',
        technologyId: finalTechId,
        companyId,
        branchId: cleanBranchId,
        options: q.options || [],
        status: q.status || 'Active',
        marks: q.marks || 1,
        explanation: q.explanation || 'Bulk imported question.',
      } as Question;
    });

    this.questions.unshift(...createdList);
    this.persistToDisk();
    return createdList;
  }

  async deleteQuestion(id: string, companyId?: string): Promise<{ success: boolean }> {
    const idx = this.questions.findIndex((q) => q.id === id);
    if (idx === -1) throw new NotFoundException('Question not found');
    if (companyId && this.questions[idx].companyId && this.questions[idx].companyId !== companyId) {
      throw new BadRequestException('Cannot delete question from another company');
    }

    this.questions.splice(idx, 1);
    this.persistToDisk();
    return { success: true };
  }

  async toggleQuestionStatus(id: string, companyId?: string): Promise<Question> {
    const q = this.questions.find((item) => item.id === id);
    if (!q) throw new NotFoundException('Question not found');
    if (companyId && q.companyId && q.companyId !== companyId) {
      throw new BadRequestException('Cannot modify question from another company');
    }

    q.status = q.status === 'Active' ? 'Inactive' : 'Active';
    this.persistToDisk();
    return q;
  }

  /**
   * Candidate Attempts & Invitations Scoping
   */
  async getAttempts(companyId?: string, branchId?: string): Promise<CandidateAssessmentAttempt[]> {
    if (!companyId) return [];

    return this.attempts.filter((att) => {
      if (att.companyId !== companyId) return false;
      if (branchId && branchId !== 'ALL' && branchId !== 'undefined') {
        return att.branchId === branchId;
      }
      return true;
    });
  }

  async createCandidateAttempt(
    params: {
      assessmentId: string;
      candidateId: string;
      candidateName: string;
      candidateEmail: string;
      jobPosition?: string;
      expiryDate?: string;
      scheduledDate?: string;
      scheduledStartTime?: string;
      durationMinutes?: number;
      emailSendingMode?: 'IMMEDIATE' | 'SCHEDULED';
    },
    companyId: string,
    branchId?: string,
  ): Promise<CandidateAssessmentAttempt> {
    if (!companyId) throw new BadRequestException('Company ID required');
    const cleanBranchId = branchId && branchId !== 'ALL' && branchId !== 'undefined' ? branchId : undefined;

    const asm = this.assessments.find((a) => a.id === params.assessmentId && a.companyId === companyId);

    const randomToken = `TOKEN-${params.candidateName.replace(/\s+/g, '').substring(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const newAttempt: CandidateAssessmentAttempt = {
      token: randomToken,
      assessmentId: asm ? asm.id : params.assessmentId,
      assessmentName: asm ? asm.name : 'Technical Assessment',
      candidateId: params.candidateId,
      candidateName: params.candidateName,
      candidateEmail: params.candidateEmail,
      jobPosition: params.jobPosition || (asm ? asm.jobPosition : 'Software Engineer'),
      technology: asm ? asm.technology : 'General',
      durationMins: params.durationMinutes || (asm ? asm.durationMins : 60),
      questionCount: asm ? (asm.questionCount || asm.questions?.length || 45) : 45,
      passingPercentage: asm ? asm.passingPercentage : 70,
      expiryDate: params.expiryDate || (asm ? asm.expiryDate : '2026-10-30'),
      scheduledDate: params.scheduledDate || '2026-08-30',
      scheduledStartTime: params.scheduledStartTime || '11:00',
      durationMinutes: params.durationMinutes || (asm ? asm.durationMins : 60),
      emailSendingMode: params.emailSendingMode || 'IMMEDIATE',
      emailStatus: params.emailSendingMode === 'SCHEDULED' ? 'SCHEDULED' : 'SENT',
      assessmentStatus: 'SCHEDULED',
      status: 'SENT',
      sentAt: new Date().toISOString(),
      answers: {},
      markedForReview: [],
      sections: asm ? asm.sections : [],
      companyId,
      branchId: cleanBranchId,
    };

    this.attempts.unshift(newAttempt);
    this.persistToDisk();
    return newAttempt;
  }

  async getAttemptByToken(token: string): Promise<CandidateAssessmentAttempt | null> {
    return this.attempts.find((a) => a.token === token) || null;
  }

  /**
   * Live KPI Metrics calculation strictly per company and branch
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

    const companyAssessments = await this.getAssessments(companyId, branchId);
    const companyQuestions = await this.getQuestions(companyId, branchId);
    const companyAttempts = await this.getAttempts(companyId, branchId);

    const activeTests = companyAssessments.filter((a) => a.status === 'Published' || a.status === 'Ready').length;
    const questionBankCount = companyQuestions.length;
    const testsSent = companyAttempts.length;
    const completed = companyAttempts.filter((a) => a.status === 'COMPLETED').length;
    const pending = companyAttempts.filter((a) => a.status === 'SENT' || a.status === 'IN_PROGRESS').length;

    const completedAttempts = companyAttempts.filter((a) => a.status === 'COMPLETED' && a.percentage !== undefined);
    const totalScore = completedAttempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0);
    const avgScore = completedAttempts.length > 0 ? Math.round(totalScore / completedAttempts.length) : 0;

    const passedCount = completedAttempts.filter((a) => a.isPassed).length;
    const passRate = completedAttempts.length > 0 ? Math.round((passedCount / completedAttempts.length) * 100) : 0;

    const techDistribution: Record<string, number> = {};
    companyQuestions.forEach((q) => {
      techDistribution[q.technology] = (techDistribution[q.technology] || 0) + 1;
    });

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
 