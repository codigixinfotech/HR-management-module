import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateManpowerRequisitionDto, UpdateManpowerRequisitionDto, UpdateMrStatusDto } from './dto/manpower-requisition.dto';
import { ManpowerPlansService } from './manpower-plans.service';

@Injectable()
export class ManpowerRequisitionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly manpowerPlansService: ManpowerPlansService,
  ) {}

  async generateNextMrNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.prisma.manpowerRequisition.count();
    let seqNum = count + 1;
    let candidate = `MR-${year}-${String(seqNum).padStart(3, '0')}`;
    while (await this.prisma.manpowerRequisition.findUnique({ where: { mrNumber: candidate } })) {
      seqNum++;
      candidate = `MR-${year}-${String(seqNum).padStart(3, '0')}`;
    }
    return candidate;
  }

  async list(companyId?: string, status?: string) {
    return this.prisma.manpowerRequisition.findMany({
      where: {
        isActive: true,
        ...(companyId ? { OR: [{ companyId }, { companyId: null }] } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        department: true,
        manpowerPlan: true,
        company: true,
        branch: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const mr = await this.prisma.manpowerRequisition.findUnique({
      where: { id },
      include: {
        department: true,
        manpowerPlan: true,
      },
    });

    if (!mr || !mr.isActive) {
      throw new NotFoundException('Manpower Requisition not found');
    }

    return mr;
  }

  async create(dto: CreateManpowerRequisitionDto) {
    let mrNumber = dto.mrNumber;
    if (!mrNumber || (await this.prisma.manpowerRequisition.findUnique({ where: { mrNumber } }))) {
      mrNumber = await this.generateNextMrNumber();
    }

    return this.prisma.$transaction(async (tx) => {
      let finalNumOpenings = dto.numOpenings || 1;

      // Check if linked to ManpowerPlan
      if (dto.manpowerPlanId) {
        const plan = await tx.manpowerPlan.findUnique({ where: { id: dto.manpowerPlanId } });
        if (plan) {
          const activeCount = await this.manpowerPlansService.countActiveStaff(
            plan.departmentName,
            plan.role,
            plan.companyId || undefined,
            plan.departmentId || undefined,
            plan.designationId || undefined,
            plan.branchId || undefined,
          );

          // Get actual active non-rejected requisitions linked to this plan
          const existingMrs = await tx.manpowerRequisition.findMany({
            where: {
              manpowerPlanId: plan.id,
              isActive: true,
              status: { not: 'REJECTED' },
            },
            select: { numOpenings: true },
          });
          const currentRaisedHires = existingMrs.reduce((acc, r) => acc + (r.numOpenings || 1), 0);

          const currentPlannedHires = Math.max(0, plan.budgeted - activeCount);
          const availableOpenings = Math.max(0, currentPlannedHires - currentRaisedHires);

          if (availableOpenings <= 0) {
            throw new BadRequestException('No available planned hires remaining for this manpower plan.');
          }

          // Automatically clamp requested openings to actual available openings
          finalNumOpenings = Math.max(1, Math.min(dto.numOpenings || 1, availableOpenings));

          // Update raised hires and status on plan inside this transaction
          const newRaisedHires = currentRaisedHires + finalNumOpenings;
          await tx.manpowerPlan.update({
            where: { id: plan.id },
            data: {
              mrRaisedHires: newRaisedHires,
              status: newRaisedHires >= currentPlannedHires ? 'CAP-REACHED' : 'UNDER-STAFFED',
            },
          });
        }
      }

      return tx.manpowerRequisition.create({
        data: {
          mrNumber,
          manpowerPlanId: dto.manpowerPlanId || null,
          companyId: dto.companyId || null,
          branchId: dto.branchId || null,
          departmentId: dto.departmentId || null,
          departmentName: dto.departmentName,
          costCenter: dto.costCenter,
          designationId: dto.designationId || null,
          role: dto.role,
          numOpenings: finalNumOpenings,
          joiningDate: new Date(dto.joiningDate),
          employmentType: dto.employmentType || 'FULL_TIME',
          priority: dto.priority || 'NORMAL',
          minSalary: dto.minSalary || null,
          maxSalary: dto.maxSalary || null,
          qualification: dto.qualification,
          experience: dto.experience,
          requiredSkills: dto.requiredSkills || null,
          workLocation: dto.workLocation,
          reportingManagerId: dto.reportingManagerId || null,
          requestorName: dto.requestorName || 'HR Admin',
          reason: dto.reason,
          comments: dto.comments || null,
          status: dto.status || 'PENDING_APPROVAL',
        },
      });
    });
  }

  async updateStatus(id: string, dto: UpdateMrStatusDto) {
    const mr = await this.findOne(id);
    const newStatus = dto.status.toUpperCase();

    return this.prisma.$transaction(async (tx) => {
      const updatedMr = await tx.manpowerRequisition.update({
        where: { id },
        data: {
          status: newStatus,
          rejectionReason: dto.rejectionReason || null,
          ...(newStatus === 'APPROVED'
            ? { approvedBy: 'HR Manager', approvedAt: new Date() }
            : {}),
        },
      });

      // Recalculate plan's mrRaisedHires if status changes
      if (mr.manpowerPlanId) {
        const remainingMrs = await tx.manpowerRequisition.findMany({
          where: {
            manpowerPlanId: mr.manpowerPlanId,
            isActive: true,
            status: { not: 'REJECTED' },
          },
          select: { numOpenings: true },
        });
        const realRaised = remainingMrs.reduce((acc, r) => acc + (r.numOpenings || 1), 0);
        const plan = await tx.manpowerPlan.findUnique({ where: { id: mr.manpowerPlanId } });
        if (plan) {
          const activeCount = await this.manpowerPlansService.countActiveStaff(
            plan.departmentName,
            plan.role,
            plan.companyId || undefined,
            plan.departmentId || undefined,
            plan.designationId || undefined,
            plan.branchId || undefined,
          );
          const currentPlannedHires = Math.max(0, plan.budgeted - activeCount);
          await tx.manpowerPlan.update({
            where: { id: plan.id },
            data: {
              mrRaisedHires: realRaised,
              status: realRaised >= currentPlannedHires ? 'CAP-REACHED' : 'UNDER-STAFFED',
            },
          });
        }
      }

      return updatedMr;
    });
  }

  async update(id: string, dto: UpdateManpowerRequisitionDto) {
    await this.findOne(id);
    return this.prisma.manpowerRequisition.update({
      where: { id },
      data: {
        ...(dto.departmentName ? { departmentName: dto.departmentName } : {}),
        ...(dto.costCenter ? { costCenter: dto.costCenter } : {}),
        ...(dto.role ? { role: dto.role } : {}),
        ...(dto.numOpenings ? { numOpenings: dto.numOpenings } : {}),
        ...(dto.joiningDate ? { joiningDate: new Date(dto.joiningDate) } : {}),
        ...(dto.employmentType ? { employmentType: dto.employmentType } : {}),
        ...(dto.priority ? { priority: dto.priority } : {}),
        ...(dto.minSalary !== undefined ? { minSalary: dto.minSalary } : {}),
        ...(dto.maxSalary !== undefined ? { maxSalary: dto.maxSalary } : {}),
        ...(dto.qualification ? { qualification: dto.qualification } : {}),
        ...(dto.experience ? { experience: dto.experience } : {}),
        ...(dto.requiredSkills ? { requiredSkills: dto.requiredSkills } : {}),
        ...(dto.workLocation ? { workLocation: dto.workLocation } : {}),
        ...(dto.reportingManagerId ? { reportingManagerId: dto.reportingManagerId } : {}),
        ...(dto.reason ? { reason: dto.reason } : {}),
        ...(dto.comments ? { comments: dto.comments } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
    });
  }

  async remove(id: string) {
    const mr = await this.findOne(id);
    return this.prisma.$transaction(async (tx) => {
      await tx.manpowerRequisition.update({
        where: { id: mr.id },
        data: { isActive: false },
      });

      if (mr.manpowerPlanId) {
        const remainingMrs = await tx.manpowerRequisition.findMany({
          where: {
            manpowerPlanId: mr.manpowerPlanId,
            isActive: true,
            status: { not: 'REJECTED' },
          },
          select: { numOpenings: true },
        });
        const realRaised = remainingMrs.reduce((acc, r) => acc + (r.numOpenings || 1), 0);
        const plan = await tx.manpowerPlan.findUnique({ where: { id: mr.manpowerPlanId } });
        if (plan) {
          const activeCount = await this.manpowerPlansService.countActiveStaff(
            plan.departmentName,
            plan.role,
            plan.companyId || undefined,
            plan.departmentId || undefined,
            plan.designationId || undefined,
            plan.branchId || undefined,
          );
          const currentPlannedHires = Math.max(0, plan.budgeted - activeCount);
          await tx.manpowerPlan.update({
            where: { id: plan.id },
            data: {
              mrRaisedHires: realRaised,
              status: realRaised >= currentPlannedHires ? 'CAP-REACHED' : 'UNDER-STAFFED',
            },
          });
        }
      }

      return { success: true };
    });
  }
}
