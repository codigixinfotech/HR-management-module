import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateComplianceSetupDto, UpdateComplianceSetupDto } from './dto/compliance-setup.dto';

// In-memory fallback store
const inMemorySetups: Map<string, any[]> = new Map();

@Injectable()
export class ComplianceSetupService {
  constructor(private readonly prisma: PrismaService) {}

  private getDefaultConfig(companyId: string) {
    return {
      id: `setup_${Date.now()}`,
      companyId,
      entityId: companyId,
      state: 'Maharashtra',
      establishmentType: 'Commercial Establishment',
      financialYear: '2026-2027',
      effectiveFrom: new Date('2026-04-01T00:00:00.000Z'),
      version: 'COMPLIANCE-2026-V1',
      status: 'Active',

      pfApplicable: true,
      esicApplicable: true,
      ptApplicable: true,
      tdsApplicable: true,
      labourComplianceApplicable: true,

      payrollComplianceFrequency: 'Monthly',
      complianceCalendarEnabled: true,
      dueDateNotificationsEnabled: true,
      complianceValidationEnabled: true,
      requireComplianceBeforePayroll: true,

      createdBy: 'Admin User',
      updatedBy: 'Admin User',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async getSetup(companyId?: string) {
    const targetCompanyId = companyId || 'default-company';

    try {
      if ((this.prisma as any).complianceSetup) {
        const found = await (this.prisma as any).complianceSetup.findFirst({
          where: { companyId: targetCompanyId, status: 'Active' },
          orderBy: { createdAt: 'desc' },
        });

        if (found) return found;

        // Create default record in DB if company exists
        const defaultConfig = this.getDefaultConfig(targetCompanyId);
        const { id, ...data } = defaultConfig;

        // Check if company exists in DB to prevent foreign key errors
        const companyExists = await this.prisma.company.findUnique({
          where: { id: targetCompanyId },
        });

        if (companyExists) {
          const created = await (this.prisma as any).complianceSetup.create({
            data: {
              ...data,
              companyId: targetCompanyId,
            },
          });
          return created;
        } else {
          return defaultConfig;
        }
      }
    } catch (err) {
      console.warn('Prisma complianceSetup get error, falling back to memory store:', err?.message || err);
    }

    // In-memory fallback
    const list = inMemorySetups.get(targetCompanyId) || [];
    let active = list.find((item) => item.status === 'Active');
    if (!active) {
      active = this.getDefaultConfig(targetCompanyId);
      list.push(active);
      inMemorySetups.set(targetCompanyId, list);
    }
    return active;
  }

  async createSetup(dto: CreateComplianceSetupDto) {
    const companyId = dto.companyId || 'default-company';
    const effectiveFrom = dto.effectiveFrom ? new Date(dto.effectiveFrom) : new Date('2026-04-01');

    try {
      if ((this.prisma as any).complianceSetup) {
        const companyExists = await this.prisma.company.findUnique({
          where: { id: companyId },
        });

        if (companyExists) {
          // Count existing versions for versioning
          const historyCount = await (this.prisma as any).complianceSetup.count({
            where: { companyId },
          });
          const versionNum = historyCount + 1;
          const versionStr = dto.version || `COMPLIANCE-2026-V${versionNum}`;

          // If status is Active, archive previous active versions
          if (dto.status !== 'Draft') {
            await (this.prisma as any).complianceSetup.updateMany({
              where: { companyId, status: 'Active' },
              data: { status: 'Archived' },
            });
          }

          const created = await (this.prisma as any).complianceSetup.create({
            data: {
              companyId,
              entityId: dto.entityId || companyId,
              state: dto.state || 'Maharashtra',
              establishmentType: dto.establishmentType || 'Commercial Establishment',
              financialYear: dto.financialYear || '2026-2027',
              effectiveFrom,
              version: versionStr,
              status: dto.status || 'Active',

              pfApplicable: dto.pfApplicable ?? true,
              esicApplicable: dto.esicApplicable ?? true,
              ptApplicable: dto.ptApplicable ?? true,
              tdsApplicable: dto.tdsApplicable ?? true,
              labourComplianceApplicable: dto.labourComplianceApplicable ?? true,

              payrollComplianceFrequency: dto.payrollComplianceFrequency || 'Monthly',
              complianceCalendarEnabled: dto.complianceCalendarEnabled ?? true,
              dueDateNotificationsEnabled: dto.dueDateNotificationsEnabled ?? true,
              complianceValidationEnabled: dto.complianceValidationEnabled ?? true,
              requireComplianceBeforePayroll: dto.requireComplianceBeforePayroll ?? true,

              createdBy: dto.createdBy || 'Admin User',
              updatedBy: dto.updatedBy || 'Admin User',
            },
          });
          return created;
        }
      }
    } catch (err) {
      console.warn('Prisma complianceSetup create error, falling back to memory store:', err?.message || err);
    }

    // In-memory fallback
    const list = inMemorySetups.get(companyId) || [];
    const versionNum = list.length + 1;
    const versionStr = dto.version || `COMPLIANCE-2026-V${versionNum}`;

    if (dto.status !== 'Draft') {
      list.forEach((item) => {
        if (item.status === 'Active') item.status = 'Archived';
      });
    }

    const newItem = {
      id: `setup_${Date.now()}`,
      companyId,
      entityId: dto.entityId || companyId,
      state: dto.state || 'Maharashtra',
      establishmentType: dto.establishmentType || 'Commercial Establishment',
      financialYear: dto.financialYear || '2026-2027',
      effectiveFrom,
      version: versionStr,
      status: dto.status || 'Active',

      pfApplicable: dto.pfApplicable ?? true,
      esicApplicable: dto.esicApplicable ?? true,
      ptApplicable: dto.ptApplicable ?? true,
      tdsApplicable: dto.tdsApplicable ?? true,
      labourComplianceApplicable: dto.labourComplianceApplicable ?? true,

      payrollComplianceFrequency: dto.payrollComplianceFrequency || 'Monthly',
      complianceCalendarEnabled: dto.complianceCalendarEnabled ?? true,
      dueDateNotificationsEnabled: dto.dueDateNotificationsEnabled ?? true,
      complianceValidationEnabled: dto.complianceValidationEnabled ?? true,
      requireComplianceBeforePayroll: dto.requireComplianceBeforePayroll ?? true,

      createdBy: dto.createdBy || 'Admin User',
      updatedBy: dto.updatedBy || 'Admin User',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    list.unshift(newItem);
    inMemorySetups.set(companyId, list);
    return newItem;
  }

  async updateSetup(id: string, dto: UpdateComplianceSetupDto) {
    try {
      if ((this.prisma as any).complianceSetup) {
        const existing = await (this.prisma as any).complianceSetup.findUnique({
          where: { id },
        });
        if (existing) {
          const updated = await (this.prisma as any).complianceSetup.update({
            where: { id },
            data: {
              ...(dto.state ? { state: dto.state } : {}),
              ...(dto.establishmentType ? { establishmentType: dto.establishmentType } : {}),
              ...(dto.financialYear ? { financialYear: dto.financialYear } : {}),
              ...(dto.effectiveFrom ? { effectiveFrom: new Date(dto.effectiveFrom) } : {}),
              ...(dto.status ? { status: dto.status } : {}),

              ...(dto.pfApplicable !== undefined ? { pfApplicable: dto.pfApplicable } : {}),
              ...(dto.esicApplicable !== undefined ? { esicApplicable: dto.esicApplicable } : {}),
              ...(dto.ptApplicable !== undefined ? { ptApplicable: dto.ptApplicable } : {}),
              ...(dto.tdsApplicable !== undefined ? { tdsApplicable: dto.tdsApplicable } : {}),
              ...(dto.labourComplianceApplicable !== undefined
                ? { labourComplianceApplicable: dto.labourComplianceApplicable }
                : {}),

              ...(dto.payrollComplianceFrequency ? { payrollComplianceFrequency: dto.payrollComplianceFrequency } : {}),
              ...(dto.complianceCalendarEnabled !== undefined
                ? { complianceCalendarEnabled: dto.complianceCalendarEnabled }
                : {}),
              ...(dto.dueDateNotificationsEnabled !== undefined
                ? { dueDateNotificationsEnabled: dto.dueDateNotificationsEnabled }
                : {}),
              ...(dto.complianceValidationEnabled !== undefined
                ? { complianceValidationEnabled: dto.complianceValidationEnabled }
                : {}),
              ...(dto.requireComplianceBeforePayroll !== undefined
                ? { requireComplianceBeforePayroll: dto.requireComplianceBeforePayroll }
                : {}),

              updatedBy: dto.updatedBy || 'Admin User',
            },
          });
          return updated;
        }
      }
    } catch (err) {
      console.warn('Prisma complianceSetup update error, fallback to memory:', err?.message || err);
    }

    // Memory update
    const companyId = dto.companyId || 'default-company';
    const list = inMemorySetups.get(companyId) || [];
    const index = list.findIndex((item) => item.id === id);
    if (index !== -1) {
      const existing = list[index];
      const updated = {
        ...existing,
        ...dto,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : existing.effectiveFrom,
        updatedAt: new Date(),
      };
      list[index] = updated;
      inMemorySetups.set(companyId, list);
      return updated;
    }

    throw new NotFoundException('Compliance setup record not found');
  }

  async getHistory(companyId?: string) {
    const targetCompanyId = companyId || 'default-company';
    try {
      if ((this.prisma as any).complianceSetup) {
        const history = await (this.prisma as any).complianceSetup.findMany({
          where: { companyId: targetCompanyId },
          orderBy: { createdAt: 'desc' },
        });
        if (history && history.length > 0) return history;
      }
    } catch (err) {
      console.warn('Prisma complianceSetup history error, fallback to memory:', err?.message || err);
    }

    const list = inMemorySetups.get(targetCompanyId) || [];
    if (list.length === 0) {
      const defaultConfig = this.getDefaultConfig(targetCompanyId);
      list.push(defaultConfig);
      inMemorySetups.set(targetCompanyId, list);
    }
    return list;
  }
}
