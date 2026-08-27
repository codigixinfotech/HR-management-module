import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { TeamsInterviewService } from './teams/teams-interview.service';
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
  ) {}

  async generateNextInterviewCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.candidateInterview.count();
    const seq = String(count + 1).padStart(3, '0');
    return `INT-${year}-${seq}`;
  }

  async createInterview(dto: CreateInterviewDto) {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id: dto.candidateId },
      include: { jobOpening: true },
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${dto.candidateId} not found`);
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
      panelEmployees = await this.prisma.employee.findMany({
        take: dto.panelMemberIds.length || 1,
        include: {
          department: { select: { name: true } },
          designation: { select: { title: true } },
        },
      });
    }

    if (panelEmployees.length === 0) {
      throw new BadRequestException('At least one valid employee must exist in database to create interview panel.');
    }

    const interviewCode = await this.generateNextInterviewCode();
    const interviewDate = new Date(dto.interviewDate);
    const candEmail = (dto as any).candidateEmail || candidate.email;
    const format = dto.interviewFormat || 'Microsoft Teams';

    let teamsDetails: any = null;

    if (format === 'Microsoft Teams' || (dto as any).createTeamsMeeting !== false) {
      const positionName = dto.position || candidate.jobOpening?.title || 'Target Position';
      teamsDetails = await this.teamsInterviewService.createTeamsInterview({
        candidateName: `${candidate.firstName} ${candidate.lastName}`,
        candidateEmail: candEmail,
        position: positionName,
        interviewDate: dto.interviewDate,
        startTime: dto.startTime,
        durationMinutes: (dto as any).durationMinutes || 60,
        notes: dto.notes || undefined,
        attendees: panelEmployees.map((e) => ({
          name: `${e.firstName} ${e.lastName}`,
          email: (e as any).email || `${e.firstName.toLowerCase()}@codigixinfotech.com`,
        })),
      });
    }

    const meetingLink = teamsDetails?.teamsJoinUrl || dto.meetingLink || null;

    // Create CandidateInterview record
    const interview = await this.prisma.candidateInterview.create({
      data: {
        interviewCode,
        candidateId: dto.candidateId,
        candidateEmail: candEmail,
        jobOpeningId: dto.jobOpeningId || candidate.jobOpeningId || null,
        position: dto.position || candidate.jobOpening?.title || 'Target Position',
        requisitionCode: dto.requisitionCode || candidate.jobOpening?.requisitionCode || 'JR-2026-001',
        interviewDate,
        startTime: dto.startTime,
        endTime: dto.endTime || null,
        interviewFormat: format,
        meetingLink,
        notes: dto.notes || null,
        status: 'SCHEDULED',
        teamsMeetingId: teamsDetails?.teamsMeetingId || null,
        teamsJoinUrl: teamsDetails?.teamsJoinUrl || null,
        calendarEventId: teamsDetails?.calendarEventId || null,
        invitationStatus: teamsDetails?.invitationStatus || 'NOT_SENT',
        createdById: dto.createdById || null,
        createdByName: dto.createdByName || 'HR Administrator',
        panelMembers: {
          create: panelEmployees.map((emp) => {
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
        },
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
    await this.prisma.candidate.update({
      where: { id: dto.candidateId },
      data: { stage: 'INTERVIEW' },
    });

    // Automatically create system tasks for assigned panel members in Task Management
    const candName = `${candidate.firstName} ${candidate.lastName}`;
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
            description: `You are assigned as ${role} for ${candName} (${interview.position}). Date: ${new Date(dto.interviewDate).toLocaleDateString('en-GB')} at ${dto.startTime}. Format: ${dto.interviewFormat}. Link: ${dto.meetingLink || 'N/A'}. Code: ${interviewCode}.`,
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

    return interview;
  }

  async listInterviews(params?: {
    interviewerId?: string;
    candidateId?: string;
    status?: string;
    filterTab?: string;
    search?: string;
  }) {
    const whereClause: any = {};

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
      whereClause.OR = [
        { interviewCode: { contains: searchStr } },
        { position: { contains: searchStr } },
        { requisitionCode: { contains: searchStr } },
        { candidate: { firstName: { contains: searchStr } } },
        { candidate: { lastName: { contains: searchStr } } },
        { panelMembers: { some: { interviewerName: { contains: searchStr } } } },
      ];
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

  async getDashboardSummary() {
    const all = await this.prisma.candidateInterview.findMany({
      select: { status: true, interviewDate: true },
    });

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const total = all.length;
    const readyToSchedule = await this.prisma.candidate.count({
      where: { stage: { in: ['SHORTLISTED', 'INTERVIEW'] } },
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

  async getPanelReminders(interviewerId?: string) {
    const whereClause: any = {
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
    };

    if (interviewerId) {
      whereClause.panelMembers = {
        some: { interviewerId },
      };
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
   * Reschedules an existing interview and updates Microsoft Teams calendar event
   */
  async rescheduleInterview(id: string, dto: { interviewDate: string; startTime: string; durationMinutes?: number }) {
    const interview: any = await this.prisma.candidateInterview.findUnique({
      where: { id },
      include: { candidate: true },
    });

    if (!interview) {
      throw new NotFoundException(`Interview with ID ${id} not found`);
    }

    if (interview.calendarEventId) {
      await this.teamsInterviewService.updateTeamsInterview(interview.calendarEventId, {
        candidateName: `${interview.candidate?.firstName} ${interview.candidate?.lastName}`,
        candidateEmail: interview.candidateEmail || interview.candidate?.email || '',
        position: interview.position,
        interviewDate: dto.interviewDate,
        startTime: dto.startTime,
        durationMinutes: dto.durationMinutes || 60,
      });
    }

    return this.prisma.candidateInterview.update({
      where: { id },
      data: {
        interviewDate: new Date(dto.interviewDate),
        startTime: dto.startTime,
        status: 'RESCHEDULED',
        invitationStatus: 'RESCHEDULED',
      } as any,
    });
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
        invitationStatus: 'FAILED',
      } as any,
    });
  }
}
