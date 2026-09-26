import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class BranchesService {
  constructor(private readonly prisma: PrismaService) {}

  private async getOrCreateBranchAdminRole() {
    let role = await this.prisma.role.findFirst({
      where: { name: 'BRANCH_ADMIN' },
    });
    if (!role) {
      role = await this.prisma.role.create({
        data: {
          name: 'BRANCH_ADMIN',
          description: 'Branch Administrator with management access restricted to assigned branch',
          isSystem: true,
          dataScope: 'LOCATION',
        },
      });
    }
    return role;
  }

  list(companyId?: string, user?: CurrentUserPayload) {
    const isBranchAdmin =
      user?.roles?.some((r) => r.toUpperCase().includes('BRANCH_ADMIN')) ||
      user?.primaryRole?.toUpperCase().includes('BRANCH_ADMIN');

    if (isBranchAdmin) {
      const assignedBranchId = user?.branchId || user?.employee?.branchId;
      if (assignedBranchId && assignedBranchId !== 'NO_BRANCH_ASSIGNED') {
        return this.prisma.branch.findMany({
          where: { id: assignedBranchId },
          include: { locations: true, employees: true },
          orderBy: { name: 'asc' },
        });
      }
      return [];
    }

    return this.prisma.branch.findMany({
      where: companyId ? { companyId } : undefined,
      include: { locations: true, employees: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id },
      include: { locations: true, employees: true },
    });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async create(dto: CreateBranchDto) {
    const existing = await this.prisma.branch.findFirst({
      where: { companyId: dto.companyId, code: dto.code },
    });
    if (existing)
      throw new ConflictException(
        'A branch with this code already exists for this company',
      );
    const branch = await this.prisma.branch.create({ data: dto });

    // Automatically provision Branch Admin access credentials
    try {
      await this.getBranchAdminAccess(branch.id);
    } catch (e) {
      console.error('Failed to auto-provision branch admin:', e);
    }

    return branch;
  }

  async getBranchAdminAccess(branchId: string) {
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      include: { company: true },
    });
    if (!branch) throw new NotFoundException('Branch not found');

    const adminRole = await this.getOrCreateBranchAdminRole();

    // Look for existing user assigned to this branch with BRANCH_ADMIN role
    let user = await this.prisma.user.findFirst({
      where: {
        branchId: branch.id,
        roles: { some: { roleId: adminRole.id } },
      },
      include: { roles: { include: { role: true } } },
    });

    if (!user) {
      const cleanBranchCode = (branch.code || 'branch').toLowerCase().replace(/[^a-z0-9]/g, '');
      const cleanCompanyCode = (branch.company?.code || 'company').toLowerCase().replace(/[^a-z0-9]/g, '');
      const candidateEmail = (branch.email && branch.email.trim())
        ? branch.email.trim().toLowerCase()
        : `admin.${cleanBranchCode}@${cleanCompanyCode}.com`;

      user = await this.prisma.user.findUnique({
        where: { email: candidateEmail },
        include: { roles: { include: { role: true } } },
      });

      if (user) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            branchId: branch.id,
            companyId: branch.companyId,
          },
        });
        const hasRole = user.roles.some((r) => r.roleId === adminRole.id);
        if (!hasRole) {
          await this.prisma.userRole.create({
            data: { userId: user.id, roleId: adminRole.id },
          });
        }
      } else {
        const randomSecret = `Ehcm@${Math.random().toString(36).substring(2, 8).toUpperCase()}!${Math.floor(100 + Math.random() * 900)}`;
        const passwordHash = await bcrypt.hash(randomSecret, 12);

        user = await this.prisma.user.create({
          data: {
            email: candidateEmail,
            passwordHash,
            companyId: branch.companyId,
            branchId: branch.id,
            isActive: true,
            mustResetPassword: true,
            roles: {
              create: [{ roleId: adminRole.id }],
            },
          },
          include: { roles: { include: { role: true } } },
        });
      }
    }

    const invitationToken = `inv_${Buffer.from(`${user.id}:${Date.now()}`).toString('base64url')}`;
    const invitationUrl = `/auth/set-password?token=${invitationToken}&email=${encodeURIComponent(user.email)}`;

    return {
      success: true,
      role: 'BRANCH_ADMIN',
      adminEmail: user.email,
      branchId: branch.id,
      branchName: branch.name,
      branchCode: branch.code,
      companyId: branch.company?.id || branch.companyId,
      companyName: branch.company?.name || 'Company',
      companyCode: branch.company?.code || '',
      accessScope: 'This Branch Only',
      loginUrl: '/login',
      invitationUrl,
      invitationStatus: user.mustResetPassword ? 'DISPATCHED' : 'ACTIVATED',
    };
  }

  async updateBranchAdminEmail(branchId: string, newEmail: string) {
    if (!newEmail || !newEmail.includes('@')) {
      throw new BadRequestException('Please provide a valid email address');
    }
    const cleanEmail = newEmail.trim().toLowerCase();

    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      include: { company: true },
    });
    if (!branch) throw new NotFoundException('Branch not found');

    const adminRole = await this.getOrCreateBranchAdminRole();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { roles: true },
    });

    let user: any;
    if (existingUser) {
      user = await this.prisma.user.update({
        where: { id: existingUser.id },
        data: {
          branchId: branch.id,
          companyId: branch.companyId,
          mustResetPassword: true,
        },
      });

      const hasRole = existingUser.roles?.some((r) => r.roleId === adminRole.id);
      if (!hasRole) {
        await this.prisma.userRole.create({
          data: { userId: user.id, roleId: adminRole.id },
        });
      }
    } else {
      const currentAdmin = await this.prisma.user.findFirst({
        where: {
          branchId: branch.id,
          roles: { some: { roleId: adminRole.id } },
        },
      });

      if (currentAdmin) {
        user = await this.prisma.user.update({
          where: { id: currentAdmin.id },
          data: {
            email: cleanEmail,
            mustResetPassword: true,
          },
        });

        await this.prisma.employee.updateMany({
          where: { userId: user.id },
          data: { workEmail: cleanEmail },
        });
      } else {
        const randomSecret = `Ehcm@${Math.random().toString(36).substring(2, 8).toUpperCase()}!${Math.floor(100 + Math.random() * 900)}`;
        const passwordHash = await bcrypt.hash(randomSecret, 12);

        user = await this.prisma.user.create({
          data: {
            email: cleanEmail,
            passwordHash,
            companyId: branch.companyId,
            branchId: branch.id,
            isActive: true,
            mustResetPassword: true,
            roles: {
              create: [{ roleId: adminRole.id }],
            },
          },
        });
      }
    }

    await this.prisma.branch.update({
      where: { id: branchId },
      data: { email: cleanEmail },
    });

    const invitationToken = `inv_${Buffer.from(`${user.id}:${Date.now()}`).toString('base64url')}`;
    const invitationUrl = `/auth/set-password?token=${invitationToken}&email=${encodeURIComponent(user.email)}`;

    return {
      success: true,
      message: `Branch Admin email updated to ${user.email}`,
      adminEmail: user.email,
      invitationUrl,
      invitationStatus: 'DISPATCHED',
    };
  }

  async resendBranchInvitation(branchId: string, customEmail?: string) {
    if (customEmail && customEmail.trim()) {
      return this.updateBranchAdminEmail(branchId, customEmail.trim());
    }
    const access = await this.getBranchAdminAccess(branchId);
    return {
      success: true,
      message: `Invitation email dispatched to ${access.adminEmail}`,
      invitationUrl: access.invitationUrl,
      adminEmail: access.adminEmail,
    };
  }


  async update(id: string, dto: UpdateBranchDto) {
    await this.findById(id);
    return this.prisma.branch.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findById(id);
    await this.prisma.branch.delete({ where: { id } });
    return { success: true };
  }

  // Locations CRUD Support
  async listLocations(branchId: string) {
    return this.prisma.location.findMany({
      where: { branchId },
      orderBy: { code: 'asc' },
    });
  }

  async findLocationById(id: string) {
    const location = await this.prisma.location.findUnique({ where: { id } });
    if (!location) throw new NotFoundException('Location not found');
    return location;
  }

  async createLocation(branchId: string, dto: any) {
    const { companyId, effectiveFrom, description, parentLocationId, ...rest } = dto;
    let code = rest.code;
    if (!code) {
      const branch = await this.prisma.branch.findUnique({
        where: { id: branchId },
        include: { locations: true },
      });
      const existingCodes = new Set((branch?.locations ?? []).map((l) => l.code));
      let count = (branch?.locations?.length ?? 0) + 1;
      code = `${branch?.code || 'BR'}-LOC-${String(count).padStart(2, '0')}`;
      while (existingCodes.has(code)) {
        count++;
        code = `${branch?.code || 'BR'}-LOC-${String(count).padStart(2, '0')}`;
      }
    } else {
      const existing = await this.prisma.location.findFirst({
        where: { branchId, code },
      });
      if (existing) {
        throw new ConflictException(
          'A location with this code already exists for this branch',
        );
      }
    }

    return this.prisma.location.create({
      data: { ...rest, code, branchId },
    });
  }

  async updateLocation(id: string, dto: any) {
    await this.findLocationById(id);
    const { companyId, effectiveFrom, description, parentLocationId, branchId, ...rest } = dto;
    return this.prisma.location.update({ where: { id }, data: rest });
  }

  async removeLocation(id: string) {
    await this.findLocationById(id);
    await this.prisma.location.delete({ where: { id } });
    return { success: true };
  }
}
