import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class TransfersService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const transfers: any[] = await this.prisma.$queryRawUnsafe(
      'SELECT * FROM employee_transfers ORDER BY createdAt DESC'
    );
    
    const enriched: any[] = [];
    for (const t of transfers) {
      const emp = await this.prisma.employee.findUnique({
        where: { id: t.employeeId },
        include: { department: true, designation: true, branch: true },
      });
      
      let prevDeptName = '';
      let targetDeptName = '';
      let prevDesgTitle = '';
      let targetDesgTitle = '';
      let prevBranchName = '';
      let targetBranchName = '';

      if (t.prevDepartmentId) {
        const d = await this.prisma.department.findUnique({ where: { id: t.prevDepartmentId } });
        prevDeptName = d?.name ?? '';
      }
      if (t.newDepartmentId) {
        const d = await this.prisma.department.findUnique({ where: { id: t.newDepartmentId } });
        targetDeptName = d?.name ?? '';
      }
      if (t.prevDesignationId) {
        const dg = await this.prisma.designation.findUnique({ where: { id: t.prevDesignationId } });
        prevDesgTitle = dg?.title ?? '';
      }
      if (t.newDesignationId) {
        const dg = await this.prisma.designation.findUnique({ where: { id: t.newDesignationId } });
        targetDesgTitle = dg?.title ?? '';
      }
      if (t.prevBranchId) {
        const b = await this.prisma.branch.findUnique({ where: { id: t.prevBranchId } });
        prevBranchName = b?.name ?? '';
      }
      if (t.newBranchId) {
        const b = await this.prisma.branch.findUnique({ where: { id: t.newBranchId } });
        targetBranchName = b?.name ?? '';
      }

      enriched.push({
        ...t,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown',
        employeeCode: emp?.employeeCode ?? '',
        prevDeptName,
        targetDeptName,
        prevDesgTitle,
        targetDesgTitle,
        prevBranchName,
        targetBranchName,
      });
    }

    return enriched;
  }

  async findById(id: string) {
    const results: any[] = await this.prisma.$queryRawUnsafe(
      'SELECT * FROM employee_transfers WHERE id = ?',
      id
    );
    if (results.length === 0) throw new NotFoundException('Transfer record not found');
    const t = results[0];

    const emp = await this.prisma.employee.findUnique({
      where: { id: t.employeeId },
      include: { department: true, designation: true, branch: true },
    });

    return {
      ...t,
      employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown',
      employeeCode: emp?.employeeCode ?? '',
    };
  }

  async create(dto: {
    employeeId: string;
    movementType: string;
    newDepartmentId?: string;
    newDesignationId?: string;
    newGradeId?: string;
    newBranchId?: string;
    newReportingManagerId?: string;
    effectiveDate: string;
    reason: string;
    remarks?: string;
  }) {
    const emp = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });
    if (!emp) throw new NotFoundException('Employee not found');

    const id = 'trf_' + Math.random().toString(36).substring(2, 11);
    const effDate = new Date(dto.effectiveDate);

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO employee_transfers (
        id, employeeId, movementType,
        prevDepartmentId, prevDesignationId, prevGradeId, prevBranchId, prevReportingManagerId,
        newDepartmentId, newDesignationId, newGradeId, newBranchId, newReportingManagerId,
        effectiveDate, reason, remarks, status, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', NOW(), NOW())`,
      id,
      dto.employeeId,
      dto.movementType,
      emp.departmentId ?? null,
      emp.designationId ?? null,
      emp.grade ?? null,
      emp.branchId ?? null,
      emp.reportingManagerId ?? null,
      dto.newDepartmentId ?? null,
      dto.newDesignationId ?? null,
      dto.newGradeId ?? null,
      dto.newBranchId ?? null,
      dto.newReportingManagerId ?? null,
      effDate,
      dto.reason,
      dto.remarks ?? null,
    );

    return this.findById(id);
  }

  async update(id: string, dto: any) {
    await this.findById(id);
    const effDate = dto.effectiveDate ? new Date(dto.effectiveDate) : undefined;

    if (effDate) {
      await this.prisma.$executeRawUnsafe(
        `UPDATE employee_transfers SET 
          newDepartmentId = ?, newDesignationId = ?, newGradeId = ?, newBranchId = ?, newReportingManagerId = ?,
          effectiveDate = ?, reason = ?, remarks = ?, updatedAt = NOW()
         WHERE id = ?`,
        dto.newDepartmentId ?? null,
        dto.newDesignationId ?? null,
        dto.newGradeId ?? null,
        dto.newBranchId ?? null,
        dto.newReportingManagerId ?? null,
        effDate,
        dto.reason ?? '',
        dto.remarks ?? null,
        id,
      );
    }
    return this.findById(id);
  }

  async approve(id: string, body: { comments?: string; approvedBy?: string }) {
    await this.findById(id);
    await this.prisma.$executeRawUnsafe(
      `UPDATE employee_transfers SET 
        status = 'APPROVED', approvedBy = ?, approvedDate = NOW(), approvalComments = ?, updatedAt = NOW()
       WHERE id = ?`,
      body.approvedBy ?? 'HR Manager',
      body.comments ?? null,
      id,
    );
    return this.findById(id);
  }

  async reject(id: string, body: { reason: string; comments?: string; approvedBy?: string }) {
    await this.findById(id);
    await this.prisma.$executeRawUnsafe(
      `UPDATE employee_transfers SET 
        status = 'REJECTED', approvedBy = ?, approvedDate = NOW(), rejectionReason = ?, approvalComments = ?, updatedAt = NOW()
       WHERE id = ?`,
      body.approvedBy ?? 'HR Manager',
      body.comments ?? null,
      body.reason,
      body.comments ?? null,
      id,
    );
    return this.findById(id);
  }

  async cancel(id: string) {
    await this.findById(id);
    await this.prisma.$executeRawUnsafe(
      `UPDATE employee_transfers SET status = 'CANCELLED', updatedAt = NOW() WHERE id = ?`,
      id,
    );
    return this.findById(id);
  }

  async makeEffective(id: string) {
    const t = await this.findById(id);
    if (t.status !== 'APPROVED') {
      throw new Error('Movement must be approved first');
    }

    const updatePayload: any = {};
    if (t.newDepartmentId) updatePayload.departmentId = t.newDepartmentId;
    if (t.newDesignationId) updatePayload.designationId = t.newDesignationId;
    if (t.newGradeId) {
      updatePayload.grade = t.newGradeId;
      updatePayload.level = t.newGradeId; // Derive level from grade
    }
    if (t.newBranchId) updatePayload.branchId = t.newBranchId;
    if (t.newReportingManagerId) updatePayload.reportingManagerId = t.newReportingManagerId;

    // Apply changes to Employee Master
    await this.prisma.employee.update({
      where: { id: t.employeeId },
      data: updatePayload,
    });

    // Create Career Timeline event
    await this.prisma.careerTimelineEvent.create({
      data: {
        employeeId: t.employeeId,
        date: new Date(),
        eventTitle: `Workforce Movement: ${t.movementType}`,
        details: `Approved movement executed. Type: ${t.movementType}. Reason: ${t.reason}`,
        eventType: t.movementType.includes('PROMOTION') ? 'PROMOTION' : 'TRANSFER',
      },
    });

    // Update Status
    await this.prisma.$executeRawUnsafe(
      `UPDATE employee_transfers SET status = 'EFFECTIVE', updatedAt = NOW() WHERE id = ?`,
      id,
    );

    return this.findById(id);
  }
}
