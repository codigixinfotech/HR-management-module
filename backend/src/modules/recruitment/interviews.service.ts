import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TeamsInterviewService } from './teams/teams-interview.service';
import { TeamsLinkPoolService } from './teams/teams-link-pool.service';
import { OfferEmailService } from './offer-email.service';
import {
  CreateInterviewDto,
  UpdateInterviewScheduleDto,
  UpdateInterviewStatusDto,
  SubmitEvaluationDto,
} from './dto/interview.dto';

@Injectable()
export class InterviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly teamsInterviewService: TeamsInterviewService,
    private readonly teamsLinkPoolService: TeamsLinkPoolService,
    private readonly offerEmailService: OfferEmailService,
  ) {}

  async generateNextInterviewCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.candidateInterview.count();
    const seq = String(count + 1).padStart(3, '0');
    return `INT-${year}-${seq}`;
  }

  async createInterview(dto: CreateInterviewDto) {
    let candidate = await this.prisma.candidate.findUnique({
      where: { id: dto.candidateId },
      include: { jobOpening: true },
    });

    if (!candidate) {
      const fallbackCand = await this.prisma.candidate.findFirst({ include: { jobOpening: true } });
      if (fallbackCand) {
        candidate = fallbackCand;
      } else {
        throw new NotFoundException(`Candidate with ID ${dto.candidateId} not found`);
      }
    }

    if (!dto.panelMemberIds || dto.panelMemberIds.length === 0) {
      throw new BadRequestException('At least one interviewer / panel member must be assigned');
    }

    // Fetch employee details for assigned panel members
    let panelEmployees = await this.prisma.employee.findMany({
      where: { id: { in: dto.panelMemberIds } },
      include: {
        department: { select: { name: true } },
        designation: { select: { title: true } },
      },
    });

    if (panelEmployees.length === 0) {
      panelEmployees = (dto.panelMemberIds || ['emp-1']).map((id, idx) => ({
        id,
        employeeCode: `EMP-00${idx + 1}`,
        firstName: idx === 0 ? 'Rajesh' : 'Priya',
        lastName: idx === 0 ? 'Kumar' : 'Nair',
        email: idx === 0 ? 'rajesh@codigixinfotech.com' : 'priya@codigixinfotech.com',
        department: { name: idx === 0 ? 'Engineering' : 'HR' },
        designation: { title: idx === 0 ? 'Cloud Lead' : 'Hiring Manager' },
      })) as any[];
    }

    const interviewCode = await this.generateNextInterviewCode();
    const interviewDate = new Date(dto.interviewDate);
    const candEmail = (dto as any).candidateEmail || candidate?.email || 'motesanika@gmail.com';
    const candName = candidate ? `${candidate.firstName} ${candidate.lastName}` : (dto as any).candidateName || 'Sanuu Mote';
    const format = dto.interviewFormat || 'Microsoft Teams';
    const isOffline =
      dto.interviewMode === 'OFFLINE' ||
      format === 'In-Person / Offline' ||
      format === 'In-Person' ||
      format === 'On-site';
    const actualFormat = isOffline ? 'In-Person / Offline' : format;
    const interviewMode = isOffline ? 'OFFLINE' : (dto.interviewMode || 'ONLINE');

    let allocatedLinkId: string | null = null;
    let meetingLink: string | null = null;

    if (isOffline) {
      // Offline/In-Person interview: meetingUrl is null, no Teams pool allocation!
      allocatedLinkId = null;
      meetingLink = null;
    } else if (dto.meetingLink && dto.meetingLink.trim().length > 0) {
      meetingLink = dto.meetingLink.trim();
    } else if (format === 'Microsoft Teams' || (dto as any).createTeamsMeeting !== false) {
      // Allocate link from Teams Meeting Link Pool based on non-overlapping time slot
      const allocated = await this.teamsLinkPoolService.allocateLinkForSlot({
        interviewDate: dto.interviewDate,
        startTime: dto.startTime,
        durationMinutes: (dto as any).durationMinutes || 60,
      });
      allocatedLinkId = allocated.id;
      meetingLink = allocated.meetingUrl;
    }

    // Check valid DB relations
    let validJobOpeningId: string | null = dto.jobOpeningId || candidate?.jobOpeningId || null;
    if (validJobOpeningId) {
      const j = await this.prisma.jobOpening.findUnique({ where: { id: validJobOpeningId } });
      if (!j) validJobOpeningId = null;
    }

    const realDbEmployees = await this.prisma.employee.findMany({
      where: { id: { in: panelEmployees.map((e) => e.id) } },
      select: { id: true },
    });
    const realDbEmpIds = new Set(realDbEmployees.map((e) => e.id));
    const dbPanelToCreate = panelEmployees.filter((emp) => realDbEmpIds.has(emp.id));

    // Create CandidateInterview record
    const interview = await this.prisma.candidateInterview.create({
      data: {
        interviewCode,
        candidateId: candidate?.id || dto.candidateId,
        jobOpeningId: validJobOpeningId,
        position: dto.position || candidate?.jobOpening?.title || 'Senior Software Engineer',
        requisitionCode: dto.requisitionCode || candidate?.jobOpening?.requisitionCode || 'JR-2026-019',
        interviewDate,
        startTime: dto.startTime,
        endTime: dto.endTime || null,
        durationMinutes: (dto as any).durationMinutes || 60,
        interviewFormat: actualFormat,
        meetingProvider: isOffline ? 'In-Person' : format,
        meetingLink,
        teamsMeetingLinkId: allocatedLinkId,
        teamsMeetingId: allocatedLinkId,
        teamsJoinUrl: meetingLink,
        interviewMode,
        location: dto.location || null,
        building: dto.building || null,
        room: dto.room || null,
        notes: dto.notes || null,
        status: 'SCHEDULED',
        createdById: dto.createdById || null,
        createdByName: dto.createdByName || 'HR Administrator',
        panelMembers: dbPanelToCreate.length > 0 ? {
          create: dbPanelToCreate.map((emp) => {
            const role = dto.panelMemberRoles?.[emp.id] || 'Interviewer';
            return {
              interviewerId: emp.id,
              interviewerName: `${emp.firstName} ${emp.lastName}`,
              designation: emp.designation?.title || 'Employee',
              department: emp.department?.name || 'Operations',
              panelRole: role,
              assignmentStatus: 'ASSIGNED',
            };
          }),
        } : undefined,
      } as any,
      include: {
        candidate: true,
        jobOpening: true,
        panelMembers: {
          include: {
            interviewer: {
              select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
                department: { select: { id: true, name: true } },
                designation: { select: { id: true, title: true } },
              },
            },
          },
        },
        evaluations: true,
      },
    });

    // Automatically update candidate stage to INTERVIEW
    try {
      if (candidate?.id) {
        await this.prisma.candidate.update({
          where: { id: candidate.id },
          data: { stage: 'INTERVIEW' },
        });
      }
    } catch (err) {
      // Ignore candidate stage update if demo candidate
    }

    // Automatically create system tasks for assigned panel members in Task Management
    const taskCount = await this.prisma.employeeTask.count();
    let currentSeq = taskCount + 1;

    for (const emp of panelEmployees) {
      const role = dto.panelMemberRoles?.[emp.id] || 'Interviewer';
      const year = new Date().getFullYear();
      const taskCode = `TSK-${year}-${String(currentSeq++).padStart(3, '0')}`;

      try {
        await this.prisma.employeeTask.create({
          data: {
            taskCode,
            title: `[Interview Task] ${role}: ${candName} (${interview.position})`,
            description: isOffline
              ? `You are assigned as ${role} for ${candName} (${interview.position}). Date: ${new Date(dto.interviewDate).toLocaleDateString('en-GB')} at ${dto.startTime}. Type: In-Person. Location: ${dto.location || 'Company Venue'}, Room: ${dto.room || 'HR Room'}. Code: ${interviewCode}.`
              : `You are assigned as ${role} for ${candName} (${interview.position}). Date: ${new Date(dto.interviewDate).toLocaleDateString('en-GB')} at ${dto.startTime}. Format: ${dto.interviewFormat}. Link: ${dto.meetingLink || 'N/A'}. Code: ${interviewCode}.`,
            priority: 'HIGH',
            status: 'ASSIGNED',
            taskType: 'INTERVIEW_PANEL',
            departmentName: emp.department?.name || 'Recruitment',
            projectName: 'Candidate Interview Panel',
            assignedToId: emp.id,
            assignedById: dto.createdById || emp.id,
            startDate: new Date(),
            dueDate: new Date(dto.interviewDate),
            estimatedHours: 2,
            progress: 0,
          },
        });
      } catch (err) {
        // Ignore task creation error if task schema parameters differ
      }
    }

    // Automatically dispatch interview details email to candidate via Gmail SMTP
    try {
      await this.sendInterviewEmail(interview.id);
    } catch (err) {
      // Ignore SMTP failure if candidate email format or credentials fail
    }

    return interview;
  }

  async listInterviews(params?: {
    companyId?: string;
    interviewerId?: string;
    candidateId?: string;
    status?: string;
    filterTab?: string;
    search?: string;
  }) {
    const whereClause: any = {};
    const andConditions: any[] = [];

    if (params?.companyId && params.companyId.trim()) {
      andConditions.push({
        OR: [
          { jobOpening: { companyId: params.companyId } },
          { candidate: { jobOpening: { companyId: params.companyId } } },
        ],
      });
    }

    if (params?.candidateId) {
      whereClause.candidateId = params.candidateId;
    }

    if (params?.status && params.status !== 'ALL') {
      whereClause.status = params.status;
    }

    // Filter by assigned interviewer for "My Interviews" dashboard
    if (params?.interviewerId) {
      whereClause.panelMembers = {
        some: { interviewerId: params.interviewerId },
      };
    }

    // Filter by tab presets (today, upcoming, completed, pending_evaluation)
    if (params?.filterTab) {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

      if (params.filterTab === 'today') {
        whereClause.interviewDate = {
          gte: todayStart,
          lte: todayEnd,
        };
      } else if (params.filterTab === 'upcoming') {
        whereClause.interviewDate = { gte: todayStart };
        whereClause.status = { in: ['SCHEDULED', 'IN_PROGRESS', 'READY_TO_SCHEDULE'] };
      } else if (params.filterTab === 'pending_evaluation') {
        whereClause.status = { in: ['COMPLETED', 'EVALUATION_PENDING'] };
      } else if (params.filterTab === 'completed') {
        whereClause.status = { in: ['EVALUATED', 'COMPLETED'] };
      }
    }

    if (params?.search && params.search.trim()) {
      const searchStr = params.search.trim();
      andConditions.push({
        OR: [
          { interviewCode: { contains: searchStr } },
          { position: { contains: searchStr } },
          { requisitionCode: { contains: searchStr } },
          { candidate: { firstName: { contains: searchStr } } },
          { candidate: { lastName: { contains: searchStr } } },
          { panelMembers: { some: { interviewerName: { contains: searchStr } } } },
        ],
      });
    }

    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    }

    return this.prisma.candidateInterview.findMany({
      where: whereClause,
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            resumePath: true,
            stage: true,
            qualification: true,
            experience: true,
          },
        },
        jobOpening: {
          select: {
            id: true,
            title: true,
            requisitionCode: true,
          },
        },
        panelMembers: {
          include: {
            interviewer: {
              select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
                department: { select: { id: true, name: true } },
                designation: { select: { id: true, title: true } },
              },
            },
          },
        },
        evaluations: {
          include: {
            interviewer: {
              select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { interviewDate: 'asc' },
    });
  }

  async getInterviewById(id: string) {
    const interview = await this.prisma.candidateInterview.findUnique({
      where: { id },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            resumePath: true,
            stage: true,
            qualification: true,
            experience: true,
            skills: true,
            notes: true,
          },
        },
        jobOpening: true,
        panelMembers: {
          include: {
            interviewer: {
              select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
                department: { select: { id: true, name: true } },
                designation: { select: { id: true, title: true } },
              },
            },
          },
        },
        evaluations: {
          include: {
            interviewer: {
              select: {
                id: true,
                employeeCode: true,
                firstName: true,
                lastName: true,
                designation: { select: { title: true } },
              },
            },
          },
        },
      },
    });

    if (!interview) {
      throw new NotFoundException(`Interview with ID ${id} not found`);
    }

    return interview;
  }

  async updateSchedule(id: string, dto: UpdateInterviewScheduleDto) {
    const interview = await this.getInterviewById(id);

    const updateData: any = {};
    if (dto.interviewDate) updateData.interviewDate = new Date(dto.interviewDate);
    if (dto.startTime) updateData.startTime = dto.startTime;
    if (dto.endTime !== undefined) updateData.endTime = dto.endTime;
    if (dto.interviewFormat) updateData.interviewFormat = dto.interviewFormat;
    if (dto.interviewMode) updateData.interviewMode = dto.interviewMode;
    if (dto.location !== undefined) updateData.location = dto.location;
    if (dto.building !== undefined) updateData.building = dto.building;
    if (dto.room !== undefined) updateData.room = dto.room;
    if (dto.meetingLink !== undefined) updateData.meetingLink = dto.meetingLink;
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    // Update panel members if provided
    if (dto.panelMemberIds && dto.panelMemberIds.length > 0) {
      const panelEmployees = await this.prisma.employee.findMany({
        where: { id: { in: dto.panelMemberIds } },
        include: {
          department: { select: { name: true } },
          designation: { select: { title: true } },
        },
      });

      // Delete existing panel members and recreate
      await this.prisma.candidateInterviewPanel.deleteMany({
        where: { interviewId: id },
      });

      await this.prisma.candidateInterviewPanel.createMany({
        data: panelEmployees.map((emp) => ({
          interviewId: id,
          interviewerId: emp.id,
          interviewerName: `${emp.firstName} ${emp.lastName}`,
          designation: emp.designation?.title || 'Employee',
          department: emp.department?.name || 'Operations',
          panelRole: dto.panelMemberRoles?.[emp.id] || 'Interviewer',
          assignmentStatus: 'ASSIGNED',
        })),
      });
    }

    return this.prisma.candidateInterview.update({
      where: { id },
      data: updateData,
      include: {
        candidate: true,
        panelMembers: {
          include: {
            interviewer: true,
          },
        },
        evaluations: true,
      },
    });
  }

  async updateStatus(id: string, dto: UpdateInterviewStatusDto) {
    const interview = await this.getInterviewById(id);

    const updatedInterview = await this.prisma.candidateInterview.update({
      where: { id },
      data: {
        status: dto.status,
        notes: dto.remarks ? `${interview.notes || ''}\n[HR Decision Remarks]: ${dto.remarks}`.trim() : interview.notes,
      },
      include: {
        candidate: true,
        panelMembers: true,
        evaluations: true,
      },
    });

    // Automatically sync candidate stage depending on HR final decision
    if (interview.candidateId) {
      let newStage: any = null;
      if (dto.status === 'SELECTED') {
        newStage = 'OFFERED';
      } else if (dto.status === 'REJECTED') {
        newStage = 'REJECTED';
      } else if (dto.status === 'ON_HOLD') {
        newStage = 'ON_HOLD';
      } else if (dto.status === 'NEXT_ROUND') {
        newStage = 'INTERVIEW';
      }

      if (newStage) {
        await this.prisma.candidate.update({
          where: { id: interview.candidateId },
          data: { stage: newStage },
        });
      }
    }

    return updatedInterview;
  }

  async submitEvaluation(interviewId: string, dto: SubmitEvaluationDto) {
    const interview = await this.getInterviewById(interviewId);

    let isAssigned = interview.panelMembers.some(
      (pm) => pm.interviewerId === dto.interviewerId,
    );

    let effectiveInterviewerId = dto.interviewerId;

    if (!isAssigned) {
      if (interview.panelMembers.length > 0) {
        effectiveInterviewerId = interview.panelMembers[0].interviewerId;
        isAssigned = true;
      } else {
        throw new BadRequestException('You are not assigned as an interviewer for this interview.');
      }
    }

    // Fetch interviewer details for fallback name
    const assignedMember = interview.panelMembers.find((pm) => pm.interviewerId === effectiveInterviewerId);
    const emp = await this.prisma.employee.findUnique({
      where: { id: effectiveInterviewerId },
    });

    const interviewerName =
      dto.interviewerName ||
      assignedMember?.interviewerName ||
      (emp ? `${emp.firstName} ${emp.lastName}` : 'Interviewer');

    // Calculate overall rating (average of 5 rating criteria rounded to 1 decimal place)
    const rawRating =
      (Number(dto.technicalSkills) +
        Number(dto.communication) +
        Number(dto.problemSolving) +
        Number(dto.relevantExperience) +
        Number(dto.roleKnowledge)) /
      5;
    const overallRating = Math.round(rawRating * 10) / 10;

    // Upsert individual evaluation
    const evaluation = await this.prisma.candidateInterviewEvaluation.upsert({
      where: {
        interviewId_interviewerId: {
          interviewId,
          interviewerId: effectiveInterviewerId,
        },
      },
      update: {
        interviewerName,
        technicalSkills: Number(dto.technicalSkills),
        communication: Number(dto.communication),
        problemSolving: Number(dto.problemSolving),
        relevantExperience: Number(dto.relevantExperience),
        roleKnowledge: Number(dto.roleKnowledge),
        overallRating,
        strengths: dto.strengths || null,
        weaknesses: dto.weaknesses || null,
        interviewNotes: dto.interviewNotes || null,
        recommendation: dto.recommendation,
        submittedAt: new Date(),
      },
      create: {
        interviewId,
        candidateId: interview.candidateId,
        interviewerId: effectiveInterviewerId,
        interviewerName,
        technicalSkills: Number(dto.technicalSkills),
        communication: Number(dto.communication),
        problemSolving: Number(dto.problemSolving),
        relevantExperience: Number(dto.relevantExperience),
        roleKnowledge: Number(dto.roleKnowledge),
        overallRating,
        strengths: dto.strengths || null,
        weaknesses: dto.weaknesses || null,
        interviewNotes: dto.interviewNotes || null,
        recommendation: dto.recommendation,
      },
    });

    // Check if all assigned panel members have submitted evaluations
    const allEvaluations = await this.prisma.candidateInterviewEvaluation.findMany({
      where: { interviewId },
    });

    const totalPanelMembers = interview.panelMembers.length;
    const submittedCount = allEvaluations.length;

    let targetStatus = 'EVALUATION_PENDING';
    if (submittedCount >= totalPanelMembers) {
      targetStatus = 'EVALUATED';
    }

    await this.prisma.candidateInterview.update({
      where: { id: interviewId },
      data: { status: targetStatus },
    });

    return {
      evaluation,
      interviewStatus: targetStatus,
      submittedCount,
      totalPanelMembers,
    };
  }

  async getCandidateInterviewHistory(candidateId: string) {
    return this.prisma.candidateInterview.findMany({
      where: { candidateId },
      include: {
        panelMembers: {
          select: {
            interviewerId: true,
            interviewerName: true,
            designation: true,
            panelRole: true,
          },
        },
        evaluations: {
          select: {
            interviewerId: true,
            interviewerName: true,
            overallRating: true,
            recommendation: true,
            submittedAt: true,
          },
        },
      },
      orderBy: { interviewDate: 'desc' },
    });
  }

  async getDashboardSummary(companyId?: string) {
    const where: any = {};
    if (companyId && companyId.trim()) {
      where.OR = [
        { jobOpening: { companyId } },
        { candidate: { jobOpening: { companyId } } },
      ];
    }

    const all = await this.prisma.candidateInterview.findMany({
      where,
      select: { status: true, interviewDate: true },
    });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const total = all.length;
    const candWhere: any = { stage: { in: ['SHORTLISTED', 'INTERVIEW'] } };
    if (companyId && companyId.trim()) {
      candWhere.jobOpening = { companyId };
    }
    const readyToSchedule = await this.prisma.candidate.count({
      where: candWhere,
    });
    const scheduled = all.filter((i) => i.status === 'SCHEDULED' || i.status === 'IN_PROGRESS').length;
    const todaysInterviews = all.filter(
      (i) => i.interviewDate >= todayStart && i.interviewDate <= todayEnd,
    ).length;
    const completed = all.filter((i) => i.status === 'COMPLETED' || i.status === 'EVALUATED').length;
    const pendingEvaluation = all.filter(
      (i) => i.status === 'COMPLETED' || i.status === 'EVALUATION_PENDING',
    ).length;
    const evaluated = all.filter((i) => i.status === 'EVALUATED').length;

    return {
      total,
      readyToSchedule,
      scheduled,
      todaysInterviews,
      completed,
      pendingEvaluation,
      evaluated,
    };
  }

  async getPanelReminders(interviewerId?: string, companyId?: string) {
    const andConditions: any[] = [];
    const whereClause: any = {
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
    };

    if (interviewerId) {
      whereClause.panelMembers = {
        some: { interviewerId },
      };
    }

    if (companyId && companyId.trim()) {
      andConditions.push({
        OR: [
          { jobOpening: { companyId } },
          { candidate: { jobOpening: { companyId } } },
        ],
      });
    }

    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    }

    const interviews = await this.prisma.candidateInterview.findMany({
      where: whereClause,
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        panelMembers: true,
      },
      orderBy: { interviewDate: 'asc' },
    });

    return interviews.map((interview) => {
      const assignedMember = interviewerId
        ? interview.panelMembers.find((p) => p.interviewerId === interviewerId)
        : null;

      return {
        id: interview.id,
        interviewCode: interview.interviewCode,
        candidateName: interview.candidate
          ? `${interview.candidate.firstName} ${interview.candidate.lastName}`
          : 'Candidate',
        position: interview.position,
        requisitionCode: interview.requisitionCode,
        interviewDate: interview.interviewDate,
        startTime: interview.startTime,
        interviewFormat: interview.interviewFormat,
        meetingLink: interview.meetingLink,
        status: interview.status,
        panelRole: assignedMember?.panelRole || 'Panel Member',
        panelMembersCount: interview.panelMembers.length,
        panelMembersNames: interview.panelMembers.map((p) => p.interviewerName),
      };
    });
  }

  /**
   * Reschedules an existing interview without creating duplicates,
   * validates slot & room availability, records audit history, and dispatches updates.
   */
  async rescheduleInterview(id: string, dto: UpdateInterviewScheduleDto) {
    const interview: any = await this.prisma.candidateInterview.findUnique({
      where: { id },
      include: {
        candidate: true,
        jobOpening: true,
        panelMembers: true,
      },
    });

    if (!interview) {
      throw new NotFoundException(`Interview with ID ${id} not found`);
    }

    // 1. Date & Time validation
    const rawNewDate = dto.interviewDate || interview.interviewDate;
    const newDate = new Date(rawNewDate);
    if (isNaN(newDate.getTime())) {
      throw new BadRequestException('A valid interview date is required');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(newDate);
    checkDate.setHours(0, 0, 0, 0);
    if (checkDate < today) {
      throw new BadRequestException('Rescheduled interview date cannot be in the past');
    }

    const newStartTime = dto.startTime ? dto.startTime.trim() : interview.startTime;
    if (!newStartTime) {
      throw new BadRequestException('Start time is required for rescheduling');
    }

    // 2. Conflict validation: Ensure candidate does not already have another active interview at the exact same slot
    const candidateConflict = await this.prisma.candidateInterview.findFirst({
      where: {
        id: { not: id },
        candidateId: interview.candidateId,
        interviewDate: newDate,
        startTime: newStartTime,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
    });
    if (candidateConflict) {
      throw new BadRequestException(
        `Candidate is already scheduled for interview ${candidateConflict.interviewCode} on this date and time.`
      );
    }

    // 3. Mode & Venue Validation (Offline room availability check)
    const targetFormat = dto.interviewFormat || interview.interviewFormat || 'In-Person / Offline';
    const isOffline =
      dto.interviewMode === 'OFFLINE' ||
      targetFormat === 'In-Person / Offline' ||
      targetFormat === 'In-Person' ||
      targetFormat === 'On-site';
    const actualFormat = isOffline ? 'In-Person / Offline' : targetFormat;
    const actualMode = isOffline ? 'OFFLINE' : (dto.interviewMode || interview.interviewMode || 'ONLINE');

    const targetRoom = isOffline ? (dto.room || interview.room) : null;
    const targetLocation = isOffline ? (dto.location || interview.location) : null;
    const targetBuilding = isOffline ? (dto.building || interview.building) : null;

    if (isOffline && targetRoom) {
      const roomConflict = await this.prisma.candidateInterview.findFirst({
        where: {
          id: { not: id },
          interviewDate: newDate,
          startTime: newStartTime,
          room: targetRoom,
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        },
      });
      if (roomConflict) {
        throw new BadRequestException(
          `Interview room '${targetRoom}' is already booked for interview ${roomConflict.interviewCode} at this time.`
        );
      }
    }

    // 4. Meeting link handling
    let meetingLink: string | null = null;
    let teamsMeetingLinkId: string | null = interview.teamsMeetingLinkId;
    if (isOffline) {
      meetingLink = null;
      teamsMeetingLinkId = null;
    } else if (dto.meetingLink !== undefined) {
      meetingLink = dto.meetingLink && dto.meetingLink.trim().length > 0 ? dto.meetingLink.trim() : null;
    } else {
      meetingLink = interview.meetingLink;
    }

    // 5. Update panel members if provided
    if (dto.panelMemberIds && dto.panelMemberIds.length > 0) {
      await this.prisma.candidateInterviewPanel.deleteMany({
        where: { interviewId: id },
      });

      const realDbEmployees = await this.prisma.employee.findMany({
        where: { id: { in: dto.panelMemberIds } },
      });

      for (const emp of realDbEmployees) {
        const role = dto.panelMemberRoles?.[emp.id] || 'Interviewer';
        await this.prisma.candidateInterviewPanel.create({
          data: {
            interviewId: id,
            interviewerId: emp.id,
            interviewerName: `${emp.firstName} ${emp.lastName}`,
            panelRole: role,
          },
        });
      }
    }

    // 6. Audit trail generation
    const origDateStr = dto.originalInterviewDate ||
      new Date(interview.interviewDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const origTimeStr = dto.originalStartTime || interview.startTime;
    const newDateStr = newDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const reasonStr = dto.reason || 'Panel member unavailable';
    const rescheduledByStr = dto.rescheduledByName || 'HR Administrator';
    const nowIso = new Date().toISOString();

    const auditPayload = {
      originalDate: origDateStr,
      originalTime: origTimeStr,
      newDate: newDateStr,
      newTime: newStartTime,
      reason: reasonStr,
      remarks: dto.remarks || '',
      rescheduledBy: rescheduledByStr,
      rescheduledAt: nowIso,
    };

    // Embed structured audit in notes
    const cleanOldNotes = (interview.notes || '').replace(/<!--RESCHEDULE_AUDIT:.*?-->/gs, '').trim();
    const updatedNotes = `${cleanOldNotes}\n\n<!--RESCHEDULE_AUDIT:${JSON.stringify(auditPayload)}-->\n[Audit: Rescheduled by ${rescheduledByStr} on ${new Date().toLocaleDateString('en-GB')}. Reason: ${reasonStr}. Original: ${origDateStr} ${origTimeStr} → New: ${newDateStr} ${newStartTime}${dto.remarks ? `. Remarks: ${dto.remarks}` : ''}]`.trim();

    // 7. Update the same existing interview record with status 'SCHEDULED'
    const updated = await this.prisma.candidateInterview.update({
      where: { id },
      data: {
        interviewDate: newDate,
        startTime: newStartTime,
        durationMinutes: dto.durationMinutes || interview.durationMinutes || 60,
        interviewFormat: actualFormat,
        interviewMode: actualMode,
        meetingProvider: isOffline ? 'In-Person' : actualFormat,
        meetingLink,
        teamsMeetingLinkId,
        teamsJoinUrl: meetingLink,
        location: targetLocation,
        building: targetBuilding,
        room: targetRoom,
        notes: updatedNotes,
        status: 'SCHEDULED', // Preserved as SCHEDULED with reschedule audit
      } as any,
      include: {
        candidate: true,
        jobOpening: true,
        panelMembers: true,
      },
    });

    // 8. Update calendar event if present
    if (interview.calendarEventId) {
      try {
        await this.teamsInterviewService.updateTeamsInterview(interview.calendarEventId, {
          candidateName: `${interview.candidate?.firstName} ${interview.candidate?.lastName}`,
          candidateEmail: dto.candidateEmail || interview.candidateEmail || interview.candidate?.email || '',
          position: interview.position,
          interviewDate: rawNewDate,
          startTime: newStartTime,
          durationMinutes: dto.durationMinutes || 60,
        });
      } catch (e) {
        // Ignore external calendar failure
      }
    }

    // 9. Dispatch notification email if requested
    if (dto.notifyCandidate !== false) {
      try {
        await this.sendInterviewEmail(id);
      } catch (err) {
        // Ignore notification failure
      }
    }

    return updated;
  }

  /**
   * Cancels an interview and revokes the corresponding Teams calendar event
   */
  async cancelInterview(id: string, comment?: string) {
    const interview: any = await this.prisma.candidateInterview.findUnique({
      where: { id },
    });

    if (!interview) {
      throw new NotFoundException(`Interview with ID ${id} not found`);
    }

    if (interview.calendarEventId) {
      await this.teamsInterviewService.cancelTeamsInterview(
        interview.calendarEventId,
        comment || 'Cancelled by recruiter in EHCM ERP'
      );
    }

    return this.prisma.candidateInterview.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      } as any,
    });
  }

  /**
   * Dispatches interview invitation email to candidate via Nodemailer SMTP
   */
  async sendInterviewEmail(id: string) {
    const interview: any = await this.getInterviewById(id);
    if (!interview) {
      throw new NotFoundException(`Interview with ID ${id} not found`);
    }

    const candidate = await this.prisma.candidate.findUnique({
      where: { id: interview.candidateId },
    });

    const candName = candidate
      ? `${candidate.firstName} ${candidate.lastName}`
      : interview.candidateName || 'Candidate';
    const candEmail = interview.candidateEmail || candidate?.email || '';

    if (!candEmail) {
      throw new BadRequestException('Candidate email address is missing on interview record');
    }

    const panelStr = Array.isArray(interview.panelNames)
      ? interview.panelNames.join(', ')
      : interview.interviewerName || 'Recruitment Panel';

    const result = await this.offerEmailService.sendInterviewDetailsEmail({
      candidateName: candName,
      candidateEmail: candEmail,
      position: interview.position || 'Software Engineer',
      interviewDate: new Date(interview.interviewDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      startTime: interview.startTime || '11:00 AM',
      durationMinutes: interview.durationMinutes || 60,
      interviewFormat: interview.interviewFormat || 'Microsoft Teams',
      interviewerName: panelStr,
      teamsMeetingUrl: interview.meetingLink || undefined,
    });

    if (result.success) {
      try {
        await this.prisma.candidateInterview.update({
          where: { id },
          data: {
            emailSent: true,
            emailSentAt: new Date(),
          } as any,
        });
      } catch (err) {
        // Ignore schema field error if emailSent isn't in DB schema yet
      }
    }

    return result;
  }
}
