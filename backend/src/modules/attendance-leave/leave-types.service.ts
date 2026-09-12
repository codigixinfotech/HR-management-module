import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateLeaveTypeDto, UpdateLeaveTypeDto } from './dto/leave-type.dto';

@Injectable()
export class LeaveTypesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(companyId?: string) {
    let types: any[] = await this.prisma.leaveType.findMany({
      where: companyId ? { companyId } : undefined,
      orderBy: { name: 'asc' },
    });

    if (companyId && types.length === 0) {
      await this.seedDefaultKekaLeaveTypes(companyId);
      types = await this.prisma.leaveType.findMany({
        where: { companyId },
        orderBy: { name: 'asc' },
      });
    }

    return types.map((t) => {
      let parsedConfig: any = null;
      try {
        if (typeof t.policyConfig === 'string') {
          parsedConfig = JSON.parse(t.policyConfig);
        } else if (t.policyConfig) {
          parsedConfig = t.policyConfig;
        }
      } catch {}

      return {
        ...t,
        category: parsedConfig?.category || this.inferCategory(t.code),
        policyConfig: parsedConfig || this.getDefaultPolicyConfig(t.code, t.name, t.annualQuota, t.isPaid, t.carryForward),
      };
    });
  }

  async findById(id: string) {
    const leaveType: any = await this.prisma.leaveType.findUnique({ where: { id } });
    if (!leaveType) throw new NotFoundException('Leave type not found');

    let parsedConfig: any = null;
    try {
      if (typeof leaveType.policyConfig === 'string') {
        parsedConfig = JSON.parse(leaveType.policyConfig);
      } else if (leaveType.policyConfig) {
        parsedConfig = leaveType.policyConfig;
      }
    } catch {}

    return {
      ...leaveType,
      category: parsedConfig?.category || this.inferCategory(leaveType.code),
      policyConfig: parsedConfig || this.getDefaultPolicyConfig(leaveType.code, leaveType.name, leaveType.annualQuota, leaveType.isPaid, leaveType.carryForward),
    };
  }

  async create(dto: CreateLeaveTypeDto) {
    const existing = await this.prisma.leaveType.findFirst({
      where: { companyId: dto.companyId, code: dto.code },
    });
    if (existing)
      throw new ConflictException(
        'A leave type with this code already exists for this company',
      );

    const policyConfigJson = dto.policyConfig ? JSON.stringify(dto.policyConfig) : JSON.stringify(
      this.getDefaultPolicyConfig(dto.code, dto.name, dto.annualQuota ?? 0, dto.isPaid ?? true, dto.carryForward ?? false)
    );

    const created = await this.prisma.leaveType.create({
      data: {
        companyId: dto.companyId,
        code: dto.code,
        name: dto.name,
        isPaid: dto.isPaid ?? true,
        annualQuota: dto.annualQuota ?? 0,
        carryForward: dto.carryForward ?? false,
        isActive: dto.isActive ?? true,
      },
    });

    if (policyConfigJson) {
      await this.prisma.$executeRawUnsafe(
        `UPDATE leave_types SET policyConfig = ? WHERE id = ?`,
        policyConfigJson,
        created.id
      );
    }

    return this.findById(created.id);
  }

  async update(id: string, dto: UpdateLeaveTypeDto) {
    await this.findById(id);

    const updateData: any = {
      ...(dto.name ? { name: dto.name } : {}),
      ...(dto.code ? { code: dto.code } : {}),
      ...(dto.annualQuota !== undefined ? { annualQuota: dto.annualQuota } : {}),
      ...(dto.isPaid !== undefined ? { isPaid: dto.isPaid } : {}),
      ...(dto.carryForward !== undefined ? { carryForward: dto.carryForward } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
    };

    if (Object.keys(updateData).length > 0) {
      await this.prisma.leaveType.update({ where: { id }, data: updateData });
    }

    if (dto.policyConfig) {
      const configStr = typeof dto.policyConfig === 'string' ? dto.policyConfig : JSON.stringify(dto.policyConfig);
      await this.prisma.$executeRawUnsafe(
        `UPDATE leave_types SET policyConfig = ? WHERE id = ?`,
        configStr,
        id
      );
    }

    return this.findById(id);
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.leaveType.delete({ where: { id } });
    return { success: true };
  }

  private inferCategory(code: string): string {
    switch (code.toUpperCase()) {
      case 'CL':
      case 'SL':
      case 'EL':
        return 'Regular';
      case 'ML':
        return 'Medical';
      case 'LOP':
        return 'Unpaid';
      case 'CO':
        return 'Comp Off';
      case 'MAT':
      case 'PAT':
        return 'Statutory';
      default:
        return 'Regular';
    }
  }

  getDefaultPolicyConfig(code: string, name: string, quota: number, isPaid: boolean, carryForward: boolean) {
    const category = this.inferCategory(code);
    return {
      category,
      accrual: {
        method: code === 'CL' ? 'Monthly' : code === 'EL' ? 'Quarterly' : code === 'LOP' ? 'No Accrual' : 'Annual',
        rate: code === 'CL' ? 1.0 : code === 'EL' ? 3.75 : code === 'LOP' ? 0 : quota,
        prorateNewJoiner: true,
        prorateExit: true,
      },
      carryForward: {
        allowed: carryForward,
        maxDays: carryForward ? (code === 'EL' ? 15 : 5) : 0,
        expiryMonths: carryForward ? (code === 'EL' ? 0 : 3) : 0,
        encashmentAllowed: code === 'EL',
      },
      applicationRules: {
        allowFullDay: true,
        allowHalfDay: code !== 'MAT' && code !== 'PAT',
        allowQuarterDay: false,
        priorNoticeDays: code === 'EL' ? 7 : code === 'CL' ? 1 : 0,
        backdatedDays: code === 'SL' ? 3 : 0,
        commentRequired: true,
        attachmentRequired: code === 'ML' || code === 'MAT',
        maxConsecutiveDays: code === 'CL' ? 3 : code === 'SL' ? 5 : 15,
      },
      sandwichPolicy: {
        weeklyOffCountAsLeave: code === 'CL' || code === 'EL',
        holidayCountAsLeave: code === 'CL' || code === 'EL',
      },
      combinationRules: {
        allowedCodes: code === 'CL' ? ['EL', 'SL'] : code === 'SL' ? ['CL', 'EL', 'ML'] : ['CL', 'SL'],
        disallowedCodes: ['LOP', 'CO'],
      },
      approvalChain: {
        levels: [
          { order: 1, role: 'Reporting Manager', required: true, autoApproveDays: 3 },
          ...(code === 'EL' ? [{ order: 2, role: 'Department Head', required: true, autoApproveDays: 3 }] : []),
          { order: code === 'EL' ? 3 : 2, role: 'HR Manager', required: true, autoApproveDays: 2 },
        ],
      },
    };
  }

  async seedDefaultKekaLeaveTypes(companyId: string) {
    const defaultTypes = [
      {
        code: 'CL',
        name: 'Casual Leave',
        category: 'Regular',
        annualQuota: 12,
        isPaid: true,
        carryForward: true,
      },
      {
        code: 'SL',
        name: 'Sick Leave',
        category: 'Regular',
        annualQuota: 10,
        isPaid: true,
        carryForward: false,
      },
      {
        code: 'EL',
        name: 'Earned Leave',
        category: 'Regular',
        annualQuota: 15,
        isPaid: true,
        carryForward: true,
      },
      {
        code: 'ML',
        name: 'Medical Leave',
        category: 'Medical',
        annualQuota: 12,
        isPaid: true,
        carryForward: false,
      },
      {
        code: 'LOP',
        name: 'Loss of Pay',
        category: 'Unpaid',
        annualQuota: 0,
        isPaid: false,
        carryForward: false,
      },
      {
        code: 'CO',
        name: 'Compensatory Off',
        category: 'Comp Off',
        annualQuota: 0,
        isPaid: true,
        carryForward: false,
      },
      {
        code: 'MAT',
        name: 'Maternity Leave',
        category: 'Statutory',
        annualQuota: 180,
        isPaid: true,
        carryForward: false,
      },
      {
        code: 'PAT',
        name: 'Paternity Leave',
        category: 'Statutory',
        annualQuota: 15,
        isPaid: true,
        carryForward: false,
      },
    ];

    for (const item of defaultTypes) {
      try {
        const id = `lt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const cfgJson = JSON.stringify(
          this.getDefaultPolicyConfig(item.code, item.name, item.annualQuota, item.isPaid, item.carryForward)
        );

        await this.prisma.$executeRawUnsafe(
          `INSERT INTO leave_types (id, companyId, code, name, annualQuota, isPaid, carryForward, isActive, policyConfig, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, NOW(3), NOW(3))
           ON DUPLICATE KEY UPDATE name=VALUES(name), annualQuota=VALUES(annualQuota), isPaid=VALUES(isPaid), policyConfig=VALUES(policyConfig)`,
          id,
          companyId,
          item.code,
          item.name,
          item.annualQuota,
          item.isPaid ? 1 : 0,
          item.carryForward ? 1 : 0,
          cfgJson
        );
      } catch (err) {
        console.warn('Error seeding leave type:', item.code, err);
      }
    }
  }
}
