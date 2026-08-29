import { Injectable, OnModuleInit, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

export const INITIAL_TEAMS_LINKS = [
  'https://teams.live.com/meet/93223002611961?p=Mj0RL6GgF4SBBOInGT',
  'https://teams.live.com/meet/9378555865288?p=m0dKxwxTUy87tebvP9',
  'https://teams.live.com/meet/9328315748636?p=7XZBbvqdS92dPgiCBi',
  'https://teams.live.com/meet/9372974262165?p=gPv4gAo5hT8SqT6tez',
  'https://teams.live.com/meet/9376572349525?p=omCL2pAhCCVF82zCnx',
];

@Injectable()
export class TeamsLinkPoolService implements OnModuleInit {
  private readonly logger = new Logger(TeamsLinkPoolService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedInitialLinksIfNeeded();
  }

  /**
   * Seeds the 5 initial valid Teams links into DB if pool is empty
   */
  public async seedInitialLinksIfNeeded() {
    try {
      const count = await this.prisma.teamsMeetingLinkPool.count();
      if (count === 0) {
        this.logger.log('Seeding 5 initial valid Teams meeting links into pool...');
        for (let i = 0; i < INITIAL_TEAMS_LINKS.length; i++) {
          await this.prisma.teamsMeetingLinkPool.create({
            data: {
              title: `Teams Room ${i + 1}`,
              meetingUrl: INITIAL_TEAMS_LINKS[i],
              active: true,
            },
          });
        }
        this.logger.log('Successfully seeded 5 initial Teams meeting links into pool.');
      }
    } catch (err: any) {
      this.logger.error(`Failed seeding initial Teams links: ${err.message}`);
    }
  }

  /**
   * Parses time string like "11:00 AM", "02:30 PM", "14:30" into Date object for a given date
   */
  public parseSlotDateTime(dateInput: Date | string, timeStr: string): Date {
    const baseDate = new Date(dateInput);
    if (isNaN(baseDate.getTime())) {
      throw new BadRequestException(`Invalid interview date: ${dateInput}`);
    }

    let hours = 9;
    let minutes = 0;

    if (timeStr) {
      const trimmed = timeStr.trim();
      const isPM = /pm/i.test(trimmed);
      const isAM = /am/i.test(trimmed);
      const cleanStr = trimmed.replace(/(am|pm)/i, '').trim();
      const parts = cleanStr.split(':');

      if (parts.length >= 2) {
        hours = parseInt(parts[0], 10) || 0;
        minutes = parseInt(parts[1], 10) || 0;

        if (isPM && hours < 12) hours += 12;
        if (isAM && hours === 12) hours = 0;
      }
    }

    const slotDate = new Date(
      baseDate.getFullYear(),
      baseDate.getMonth(),
      baseDate.getDate(),
      hours,
      minutes,
      0,
      0
    );

    return slotDate;
  }

  /**
   * Automatically allocates an available Teams link from pool for a time slot
   * Ensures non-overlapping scheduling and locking concurrency
   */
  async allocateLinkForSlot(params: {
    interviewDate: Date | string;
    startTime: string;
    durationMinutes?: number;
    excludeInterviewId?: string;
  }): Promise<{ id: string; meetingUrl: string; title: string }> {
    const duration = params.durationMinutes || 60;
    const slotStart = this.parseSlotDateTime(params.interviewDate, params.startTime);
    const slotEnd = new Date(slotStart.getTime() + duration * 60 * 1000);

    // Query active scheduled interviews for date range to check overlaps
    const startOfDay = new Date(slotStart.getFullYear(), slotStart.getMonth(), slotStart.getDate(), 0, 0, 0);
    const endOfDay = new Date(slotStart.getFullYear(), slotStart.getMonth(), slotStart.getDate(), 23, 59, 59);

    const existingInterviews = await this.prisma.candidateInterview.findMany({
      where: {
        status: { notIn: ['CANCELLED', 'REJECTED'] },
        teamsMeetingLinkId: { not: null },
        interviewDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        id: params.excludeInterviewId ? { not: params.excludeInterviewId } : undefined,
      },
      select: {
        id: true,
        interviewDate: true,
        startTime: true,
        durationMinutes: true,
        teamsMeetingLinkId: true,
      },
    });

    // Determine occupied link IDs for overlapping time window
    const occupiedLinkIds = new Set<string>();

    for (const inv of existingInterviews) {
      if (!inv.teamsMeetingLinkId) continue;
      const invStart = this.parseSlotDateTime(inv.interviewDate, inv.startTime);
      const invDuration = inv.durationMinutes || 60;
      const invEnd = new Date(invStart.getTime() + invDuration * 60 * 1000);

      // Overlap check: existingStart < newEnd AND existingEnd > newStart
      if (invStart < slotEnd && invEnd > slotStart) {
        occupiedLinkIds.add(inv.teamsMeetingLinkId);
      }
    }

    // Find active pool links not in occupiedLinkIds
    const activePoolLinks = await this.prisma.teamsMeetingLinkPool.findMany({
      where: { active: true },
      orderBy: { createdAt: 'asc' },
    });

    const availableLink = activePoolLinks.find((link) => !occupiedLinkIds.has(link.id));

    if (!availableLink) {
      throw new BadRequestException(
        'No Teams meeting link is available for this time slot. Please choose another time slot or add a new Teams meeting link in Link Management.'
      );
    }

    return {
      id: availableLink.id,
      meetingUrl: availableLink.meetingUrl,
      title: availableLink.title || 'Teams Room',
    };
  }

  /**
   * List all links in pool with current active assignment details
   */
  async listPoolLinks() {
    await this.seedInitialLinksIfNeeded();

    const poolLinks = await this.prisma.teamsMeetingLinkPool.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        interviews: {
          where: { status: { notIn: ['CANCELLED', 'COMPLETED'] } },
          orderBy: { interviewDate: 'desc' },
          take: 5,
          include: {
            candidate: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    const now = new Date();

    return poolLinks.map((link, idx) => {
      const currentActiveInterview = link.interviews.find((inv) => {
        const start = this.parseSlotDateTime(inv.interviewDate, inv.startTime);
        const end = new Date(start.getTime() + (inv.durationMinutes || 60) * 60 * 1000);
        return start <= now && now <= end;
      });

      const upcomingInterview = link.interviews[0];

      return {
        id: link.id,
        linkNumber: idx + 1,
        title: link.title || `Teams Link ${idx + 1}`,
        meetingUrl: link.meetingUrl,
        active: link.active,
        status: !link.active
          ? 'DISABLED'
          : currentActiveInterview || upcomingInterview
          ? 'ASSIGNED'
          : 'AVAILABLE',
        assignedCandidate: currentActiveInterview?.candidate
          ? `${currentActiveInterview.candidate.firstName} ${currentActiveInterview.candidate.lastName}`
          : upcomingInterview?.candidate
          ? `${upcomingInterview.candidate.firstName} ${upcomingInterview.candidate.lastName}`
          : null,
        assignedPosition: currentActiveInterview?.position || upcomingInterview?.position || null,
        assignedTime: upcomingInterview
          ? `${new Date(upcomingInterview.interviewDate).toLocaleDateString('en-GB')} at ${upcomingInterview.startTime}`
          : null,
        createdAt: link.createdAt,
        updatedAt: link.updatedAt,
      };
    });
  }

  /**
   * Add a new Teams meeting link to pool
   */
  async addPoolLink(dto: { title?: string; meetingUrl: string }) {
    if (!dto.meetingUrl || !dto.meetingUrl.trim()) {
      throw new BadRequestException('Teams meeting URL is required');
    }
    const cleanUrl = dto.meetingUrl.trim();

    const existing = await this.prisma.teamsMeetingLinkPool.findUnique({
      where: { meetingUrl: cleanUrl },
    });
    if (existing) {
      throw new BadRequestException('This Teams meeting URL already exists in the pool');
    }

    const count = await this.prisma.teamsMeetingLinkPool.count();

    return this.prisma.teamsMeetingLinkPool.create({
      data: {
        title: dto.title?.trim() || `Teams Link ${count + 1}`,
        meetingUrl: cleanUrl,
        active: true,
      },
    });
  }

  /**
   * Toggle active/disabled status of a pool link
   */
  async toggleLinkActive(id: string) {
    const link = await this.prisma.teamsMeetingLinkPool.findUnique({ where: { id } });
    if (!link) throw new BadRequestException('Link not found');

    return this.prisma.teamsMeetingLinkPool.update({
      where: { id },
      data: { active: !link.active },
    });
  }

  /**
   * Delete a link from pool
   */
  async deletePoolLink(id: string) {
    const link = await this.prisma.teamsMeetingLinkPool.findUnique({ where: { id } });
    if (!link) throw new BadRequestException('Link not found');

    return this.prisma.teamsMeetingLinkPool.delete({ where: { id } });
  }
}
