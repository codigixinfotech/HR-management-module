import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AssetStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAssetMaintenanceDto, CompleteAssetMaintenanceDto } from './dto/asset-maintenance.dto';
import { isUserBranchAdmin } from '../../common/utils/tenant-context.util';
import type { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class AssetMaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  list(assetId?: string, companyId?: string, branchId?: string) {
    let branchWhere: any = undefined;
    if (branchId === 'HEAD_OFFICE' || branchId === 'NONE') {
      branchWhere = { branchId: null };
    } else if (branchId && branchId !== 'ALL' && branchId !== 'ALL_BRANCHES') {
      branchWhere = { branchId };
    }

    return this.prisma.assetMaintenanceRecord.findMany({
      where: {
        ...(assetId ? { assetId } : {}),
        ...(companyId || branchWhere
          ? {
              asset: {
                ...(companyId && companyId !== 'ALL' ? { companyId } : {}),
                ...branchWhere,
              },
            }
          : {}),
      },
      include: {
        asset: {
          select: {
            id: true,
            assetTag: true,
            name: true,
            category: true,
            serialNumber: true,
            companyId: true,
            branchId: true,
            company: { select: { id: true, name: true } },
            branch: { select: { id: true, name: true } },
            department: { select: { id: true, name: true } },
            currentEmployee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
          },
        },
        recoveryEmployee: {
          select: { id: true, firstName: true, lastName: true, employeeCode: true },
        },
        recoveryRecord: true,
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async create(dto: CreateAssetMaintenanceDto, user?: CurrentUserPayload) {
    const asset = await this.prisma.asset.findUnique({
      where: { id: dto.assetId },
      include: { currentEmployee: true },
    });
    if (!asset) throw new NotFoundException('Asset not found');

    if (user && isUserBranchAdmin(user)) {
      const assignedBranchId = user.branchId || user.employee?.branchId;
      if (asset.branchId !== assignedBranchId) {
        throw new NotFoundException('Asset not found');
      }
    }

    const woCount = await this.prisma.assetMaintenanceRecord.count();
    const workOrderNumber = `WO-2026-${String(woCount + 1001).padStart(6, '0')}`;

    const isRecovery = dto.costResponsibility === 'EMPLOYEE_RECOVERY';
    let recoveryEmpId = dto.recoveryEmployeeId || asset.currentEmployeeId;

    if (isRecovery && !recoveryEmpId) {
      const activeAlloc = await this.prisma.assetAllocation.findFirst({
        where: { assetId: asset.id, returnedAt: null },
        orderBy: { allocatedAt: 'desc' },
      });
      recoveryEmpId = activeAlloc?.employeeId || null;
    }

    const totalRecovery = dto.recoveryAmount !== undefined && dto.recoveryAmount !== null
      ? Number(dto.recoveryAmount)
      : (dto.cost ? Number(dto.cost) : 0);

    const installments = dto.numberOfInstallments && Number(dto.numberOfInstallments) > 0
      ? Number(dto.numberOfInstallments)
      : 1;

    const monthlyDeduction = dto.monthlyDeduction !== undefined && dto.monthlyDeduction !== null
      ? Number(dto.monthlyDeduction)
      : (installments > 0 ? Number((totalRecovery / installments).toFixed(2)) : totalRecovery);

    const record = await this.prisma.$transaction(async (tx) => {
      const maintenanceRecord = await (tx as any).assetMaintenanceRecord.create({
        data: {
          assetId: dto.assetId,
          workOrderNumber,
          issue: dto.issue,
          priority: dto.priority || 'MEDIUM',
          maintenanceType: dto.maintenanceType || 'Repair',
          vendor: dto.vendor || null,
          warrantyClaim: dto.warrantyClaim ?? false,
          startDate: new Date(dto.startDate),
          cost: dto.cost ? Number(dto.cost) : null,
          notes: dto.notes || null,
          qcStatus: 'PENDING',
          costResponsibility: isRecovery ? 'EMPLOYEE_RECOVERY' : 'COMPANY_EXPENSE',
          recoveryEmployeeId: isRecovery ? recoveryEmpId : null,
          recoveryAmount: isRecovery ? totalRecovery : null,
          deductionMethod: isRecovery ? (dto.deductionMethod || 'FULL_DEDUCTION') : null,
          numberOfInstallments: isRecovery ? installments : null,
          monthlyDeduction: isRecovery ? monthlyDeduction : null,
          payrollStartMonth: isRecovery ? (dto.payrollStartMonth || null) : null,
          recoveryStatus: isRecovery ? 'APPROVED' : null,
        },
        include: {
          asset: true,
          recoveryEmployee: true,
        },
      });

      // If Employee Recovery, automatically create approved recovery record for Payroll
      if (isRecovery && recoveryEmpId) {
        const recCount = await (tx as any).assetRecoveryRecord.count();
        const recoveryNumber = `REC-2026-${String(recCount + 1001).padStart(6, '0')}`;

        await (tx as any).assetRecoveryRecord.create({
          data: {
            recoveryNumber,
            companyId: asset.companyId,
            branchId: asset.branchId,
            employeeId: recoveryEmpId,
            assetId: asset.id,
            maintenanceRecordId: maintenanceRecord.id,
            totalAmount: totalRecovery,
            deductionMethod: dto.deductionMethod || 'FULL_DEDUCTION',
            numberOfInstallments: installments,
            monthlyDeduction,
            remainingAmount: totalRecovery,
            payrollStartMonth: dto.payrollStartMonth || 'Current Month',
            status: 'APPROVED',
            notes: `Work Order ${workOrderNumber} employee recovery: ${dto.issue}`,
          },
        });
      }

      await tx.asset.update({
        where: { id: dto.assetId },
        data: { status: AssetStatus.UNDER_MAINTENANCE },
      });

      return maintenanceRecord;
    });

    return record;
  }

  async listRecoveries(companyId?: string, branchId?: string, employeeId?: string) {
    const where: any = {};
    if (companyId && companyId !== 'ALL') where.companyId = companyId;
    if (branchId && branchId !== 'ALL' && branchId !== 'ALL_BRANCHES') where.branchId = branchId;
    if (employeeId) where.employeeId = employeeId;

    return (this.prisma as any).assetRecoveryRecord.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
        asset: { select: { id: true, assetTag: true, name: true, category: true } },
        maintenanceRecord: { select: { id: true, workOrderNumber: true, issue: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async complete(id: string, dto?: CompleteAssetMaintenanceDto, user?: CurrentUserPayload) {
    const record = await this.prisma.assetMaintenanceRecord.findUnique({
      where: { id },
      include: { asset: true },
    });
    if (!record) throw new NotFoundException('Maintenance record not found');

    if (user && isUserBranchAdmin(user)) {
      const assignedBranchId = user.branchId || user.employee?.branchId;
      if (record.asset.branchId !== assignedBranchId) {
        throw new NotFoundException('Maintenance record not found');
      }
    }

    const completionDate = dto?.completionDate ? new Date(dto.completionDate) : new Date();
    const finalCondition = dto?.finalCondition || 'GOOD';
    const actualCost = dto?.actualCost !== undefined && dto.actualCost !== null ? Number(dto.actualCost) : record.cost;
    const vendor = dto?.vendor || record.vendor;
    const notes = dto?.repairNotes || record.notes;
    const qcStatus = dto?.qcStatus || 'PASS';

    // Find active allocation and linked maintenance request
    const activeAlloc = await this.prisma.assetAllocation.findFirst({
      where: { assetId: record.assetId, returnedAt: null },
      orderBy: { allocatedAt: 'desc' },
    });

    const linkedReq = await (this.prisma as any).assetMaintenanceRequest.findFirst({
      where: {
        OR: [
          { workOrderId: record.id },
          { assetId: record.assetId, status: { in: ['IN_REPAIR', 'IN_INSPECTION', 'PENDING'] } },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });

    const targetEmployeeId = record.asset.currentEmployeeId || activeAlloc?.employeeId || linkedReq?.requestedByEmployeeId;

    // Default destination: if asset had an employee, return to employee custody, else return to stock
    const returnDest = dto?.returnDestination || (targetEmployeeId ? 'EMPLOYEE' : 'STOCK');

    let newAssetStatus: AssetStatus;
    if (qcStatus === 'PASS') {
      newAssetStatus = (returnDest === 'EMPLOYEE' && targetEmployeeId) ? AssetStatus.ALLOCATED : AssetStatus.IN_STOCK;
    } else {
      newAssetStatus = AssetStatus.UNDER_MAINTENANCE;
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedRec = await tx.assetMaintenanceRecord.update({
        where: { id },
        data: {
          endDate: qcStatus === 'PASS' ? completionDate : null,
          cost: actualCost,
          vendor,
          finalCondition,
          workPerformed: dto?.workPerformed || null,
          partsUsed: dto?.partsUsed || null,
          qcStatus,
          notes,
        },
      });

      await tx.asset.update({
        where: { id: record.assetId },
        data: {
          status: newAssetStatus,
          condition: finalCondition,
          ...(newAssetStatus === AssetStatus.ALLOCATED && targetEmployeeId
            ? { currentEmployeeId: targetEmployeeId }
            : (returnDest === 'STOCK' ? { currentEmployeeId: null } : {})),
        },
      });

      // If returning to stock, close any unreturned allocation
      if (returnDest === 'STOCK' && activeAlloc) {
        await tx.assetAllocation.update({
          where: { id: activeAlloc.id },
          data: {
            returnedAt: completionDate,
            conditionOnReturn: finalCondition,
            returnReason: 'MAINTENANCE_COMPLETED_RETURNED_TO_STOCK',
          },
        });
      }

      // If QC passed and there's a linked maintenance request, mark it COMPLETED
      if (qcStatus === 'PASS' && linkedReq) {
        await (tx as any).assetMaintenanceRequest.update({
          where: { id: linkedReq.id },
          data: {
            status: 'COMPLETED',
            adminRemarks: linkedReq.adminRemarks || 'Maintenance and Quality Check completed successfully. Asset returned to employee custody.',
          },
        });
      }

      return updatedRec;
    });

    return updated;
  }
}

