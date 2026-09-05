import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { ERP_25_MODULE_CATALOG } from '../organization/module-catalog.constants';

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  private readonly include = {
    permissions: { include: { permission: true } },
    users: {
      include: {
        user: {
          select: {
            id: true,
            email: true,
            employee: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeCode: true,
              },
            },
          },
        },
      },
    },
  };

  async onModuleInit() {
    await this.seedPermissionsAndSystemRoles();
  }

  async seedPermissionsAndSystemRoles() {
    const actions = [
      'view',
      'create',
      'edit',
      'delete',
      'approve',
      'reject',
      'assign',
      'import',
      'export',
      'manage',
    ] as const;

    // 1. Seed 10 granular permissions per module for all 25 ERP Modules
    for (const mod of ERP_25_MODULE_CATALOG) {
      for (const action of actions) {
        const code = `${mod.key.replace(/-/g, '_')}.${action}`;
        await this.prisma.permission.upsert({
          where: { code },
          update: { module: mod.key, action },
          create: {
            module: mod.key,
            action,
            code,
            description: `${action.charAt(0).toUpperCase() + action.slice(1)} access for ${mod.name}`,
          },
        });
      }
    }

    const allPerms = await this.prisma.permission.findMany();

    const getPermIds = (moduleKeys: string[], actionsToInclude: string[] = ['view', 'create', 'edit', 'delete', 'approve', 'reject', 'assign', 'import', 'export', 'manage']) => {
      return allPerms
        .filter((p) => moduleKeys.includes(p.module) && actionsToInclude.includes(p.action))
        .map((p) => p.id);
    };

    // Standard system roles configuration
    const systemRoleConfigs: {
      name: string;
      description: string;
      dataScope: string;
      loginAccess: { web: boolean; mobile: boolean; ess: boolean; admin: boolean; reports: boolean };
      getModuleKeys: () => { keys: string[]; actions?: string[] };
    }[] = [
      {
        name: 'SUPER_ADMIN',
        description: 'Super Administrator with unrestricted global access to all tenants and system settings',
        dataScope: 'COMPANY',
        loginAccess: { web: true, mobile: true, ess: true, admin: true, reports: true },
        getModuleKeys: () => ({ keys: ERP_25_MODULE_CATALOG.map((m) => m.key) }),
      },
      {
        name: 'COMPANY_ADMIN',
        description: 'Full administrative access to company settings, organizational structure, and HR operations',
        dataScope: 'COMPANY',
        loginAccess: { web: true, mobile: true, ess: true, admin: true, reports: true },
        getModuleKeys: () => ({ keys: ERP_25_MODULE_CATALOG.map((m) => m.key) }),
      },
      {
        name: 'HR_ADMIN',
        description: 'Full management of personnel records, recruitment, attendance, leave, and compliance',
        dataScope: 'COMPANY',
        loginAccess: { web: true, mobile: true, ess: true, admin: true, reports: true },
        getModuleKeys: () => ({
          keys: [
            'organization',
            'recruitment',
            'employees',
            'workforce',
            'attendance-leave',
            'performance',
            'learning',
            'compensation-benefits',
            'employee-experience',
            'asset-management',
            'ehs',
            'reports-analytics',
            'administration',
          ],
        }),
      },
      {
        name: 'HR_MANAGER',
        description: 'Managerial control over employee management, leave approvals, recruitment, and performance reviews',
        dataScope: 'COMPANY',
        loginAccess: { web: true, mobile: true, ess: true, admin: false, reports: true },
        getModuleKeys: () => ({
          keys: ['employees', 'attendance-leave', 'recruitment', 'performance', 'workforce', 'reports-analytics'],
        }),
      },
      {
        name: 'HR_EXECUTIVE',
        description: 'Operational HR role handling day-to-day attendance tracking, leave requests, and employee profiles',
        dataScope: 'DEPARTMENT',
        loginAccess: { web: true, mobile: true, ess: true, admin: false, reports: true },
        getModuleKeys: () => ({
          keys: ['employees', 'attendance-leave', 'recruitment'],
          actions: ['view', 'create', 'edit', 'approve', 'reject'],
        }),
      },
      {
        name: 'FINANCE_MANAGER',
        description: 'Financial management role overseeing payroll processing, salary structures, and expense reimbursements',
        dataScope: 'COMPANY',
        loginAccess: { web: true, mobile: true, ess: false, admin: false, reports: true },
        getModuleKeys: () => ({
          keys: ['payroll', 'compensation-benefits', 'travel-expense', 'reports-analytics'],
        }),
      },
      {
        name: 'IT_ADMIN',
        description: 'IT administration role managing company hardware assets, smart devices, and user access settings',
        dataScope: 'COMPANY',
        loginAccess: { web: true, mobile: true, ess: false, admin: true, reports: true },
        getModuleKeys: () => ({
          keys: ['asset-management', 'iot-devices', 'administration'],
        }),
      },
      {
        name: 'DEPARTMENT_MANAGER',
        description: 'Departmental supervisor overseeing team attendance, shift scheduling, performance, and approvals',
        dataScope: 'DEPARTMENT',
        loginAccess: { web: true, mobile: true, ess: true, admin: false, reports: true },
        getModuleKeys: () => ({
          keys: ['employees', 'workforce', 'attendance-leave', 'performance'],
          actions: ['view', 'create', 'edit', 'approve', 'reject', 'assign'],
        }),
      },
      {
        name: 'EMPLOYEE',
        description: 'Standard self-service employee account for viewing payslips, marking attendance, and applying for leaves',
        dataScope: 'OWN',
        loginAccess: { web: true, mobile: true, ess: true, admin: false, reports: false },
        getModuleKeys: () => ({
          keys: ['attendance-leave', 'performance', 'learning', 'employee-experience'],
          actions: ['view', 'create'],
        }),
      },
    ];

    for (const sysRole of systemRoleConfigs) {
      const existing = await this.prisma.role.findFirst({
        where: { name: sysRole.name, isSystem: true },
        include: { permissions: true },
      });

      const { keys, actions: targetActions } = sysRole.getModuleKeys();
      const permIds = getPermIds(keys, targetActions || ['view', 'create', 'edit', 'delete', 'approve', 'reject', 'assign', 'import', 'export', 'manage']);

      if (!existing) {
        await this.prisma.role.create({
          data: {
            name: sysRole.name,
            type: 'SYSTEM_ROLE',
            description: sysRole.description,
            isSystem: true,
            dataScope: sysRole.dataScope,
            loginAccess: sysRole.loginAccess,
            permissions: {
              create: permIds.map((permissionId) => ({ permissionId })),
            },
          },
        });
      } else if (existing.permissions.length === 0) {
        // Populate system role permissions if empty
        await this.prisma.role.update({
          where: { id: existing.id },
          data: {
            type: 'SYSTEM_ROLE',
            description: sysRole.description,
            dataScope: sysRole.dataScope,
            loginAccess: sysRole.loginAccess,
            permissions: {
              create: permIds.map((permissionId) => ({ permissionId })),
            },
          },
        });
      }
    }

    // 2. Seed Industry Templates (Global, non-system, template roles)
    const industryTemplates = [
      {
        name: 'Plant Manager',
        description: 'Manufacturing industry template for plant-wide operational leadership, safety audits, and workforce attendance',
        dataScope: 'PLANT',
        loginAccess: { web: true, mobile: true, ess: true, admin: false, reports: true },
        modules: ['employees', 'workforce', 'attendance-leave', 'ehs', 'reports-analytics'],
      },
      {
        name: 'Production Supervisor',
        description: 'Factory floor supervisor template for shift scheduling, attendance verification, and overtime approvals',
        dataScope: 'TEAM',
        loginAccess: { web: true, mobile: true, ess: true, admin: false, reports: false },
        modules: ['workforce', 'attendance-leave', 'ehs'],
      },
      {
        name: 'Engineering Team Lead',
        description: 'IT & Software template for managing developer tasks, project allocations, and performance evaluations',
        dataScope: 'TEAM',
        loginAccess: { web: true, mobile: true, ess: true, admin: false, reports: true },
        modules: ['employees', 'performance', 'learning'],
      },
      {
        name: 'Store Manager',
        description: 'Retail store manager template for store employee rostering, attendance, and local asset allocation',
        dataScope: 'LOCATION',
        loginAccess: { web: true, mobile: true, ess: true, admin: false, reports: true },
        modules: ['employees', 'workforce', 'attendance-leave', 'asset-management'],
      },
    ];

    for (const template of industryTemplates) {
      const existing = await this.prisma.role.findFirst({
        where: { name: template.name, type: 'INDUSTRY_TEMPLATE' },
      });
      if (!existing) {
        const permIds = getPermIds(template.modules);
        await this.prisma.role.create({
          data: {
            name: template.name,
            type: 'INDUSTRY_TEMPLATE',
            description: template.description,
            isSystem: false,
            dataScope: template.dataScope,
            loginAccess: template.loginAccess,
            permissions: {
              create: permIds.map((permissionId) => ({ permissionId })),
            },
          },
        });
      }
    }

    // 3. Rename any seed custom role that reused the name "HR_ADMIN" to avoid confusion
    const duplicateCustomHrAdmin = await this.prisma.role.findFirst({
      where: { name: 'HR_ADMIN', isSystem: false },
    });
    if (duplicateCustomHrAdmin) {
      await this.prisma.role.update({
        where: { id: duplicateCustomHrAdmin.id },
        data: { name: 'Custom HR Operations Executive' },
      });
    }
  }

  async list(companyId?: string) {
    await this.seedPermissionsAndSystemRoles();

    // Multi-company isolation rule:
    // If companyId is provided, return:
    // 1) All System Roles (isSystem: true)
    // 2) All Industry Templates (type: 'INDUSTRY_TEMPLATE')
    // 3) Custom Roles belonging ONLY to this company (companyId == companyId)
    const whereCondition = companyId
      ? {
          OR: [
            { isSystem: true },
            { type: 'SYSTEM_ROLE' },
            { type: 'INDUSTRY_TEMPLATE' },
            { companyId },
            { companyId: null },
          ],
        }
      : {};

    return this.prisma.role.findMany({
      where: whereCondition,
      include: this.include,
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });
  }

  async findById(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: this.include,
    });
    if (!role) throw new NotFoundException('Role not found');
    return role;
  }

  async create(dto: CreateRoleDto) {
    const existing = await this.prisma.role.findFirst({
      where: { name: dto.name, companyId: dto.companyId ?? null },
    });
    if (existing) {
      throw new ConflictException(
        'A role with this name already exists for this company scope',
      );
    }

    return this.prisma.role.create({
      data: {
        name: dto.name,
        type: dto.type ?? 'CUSTOM_ROLE',
        description: dto.description,
        companyId: dto.companyId,
        dataScope: dto.dataScope ?? 'DEPARTMENT',
        loginAccess: dto.loginAccess ?? {
          web: true,
          mobile: true,
          ess: true,
          admin: false,
          reports: true,
        },
        permissions: dto.permissionIds
          ? {
              create: dto.permissionIds.map((permissionId) => ({
                permissionId,
              })),
            }
          : undefined,
      },
      include: this.include,
    });
  }

  async duplicate(id: string) {
    const sourceRole = await this.findById(id);
    const newName = `${sourceRole.name} (Copy)`;

    const existing = await this.prisma.role.findFirst({
      where: { name: newName, companyId: sourceRole.companyId },
    });
    const finalName = existing ? `${sourceRole.name} (Copy ${Date.now().toString().slice(-4)})` : newName;

    return this.prisma.role.create({
      data: {
        name: finalName,
        type: 'CUSTOM_ROLE',
        description: sourceRole.description ? `Cloned from ${sourceRole.name}: ${sourceRole.description}` : `Cloned from ${sourceRole.name}`,
        companyId: sourceRole.companyId,
        isSystem: false,
        dataScope: sourceRole.dataScope ?? 'DEPARTMENT',
        loginAccess: sourceRole.loginAccess ?? {
          web: true,
          mobile: true,
          ess: true,
          admin: false,
          reports: true,
        },
        permissions: {
          create: sourceRole.permissions.map((p) => ({
            permissionId: p.permissionId,
          })),
        },
      },
      include: this.include,
    });
  }

  async assignUsers(roleId: string, userIds: string[]) {
    const role = await this.findById(roleId);
    if (!role) throw new NotFoundException('Role not found');

    // Wipe existing assignments for this role
    await this.prisma.userRole.deleteMany({
      where: { roleId },
    });

    // Create new assignments
    if (userIds.length > 0) {
      await this.prisma.userRole.createMany({
        data: userIds.map((userId) => ({
          roleId,
          userId,
        })),
      });
    }

    return this.findById(roleId);
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.findById(id);

    if (dto.permissionIds) {
      await this.prisma.rolePermission.deleteMany({ where: { roleId: id } });
    }

    return this.prisma.role.update({
      where: { id },
      data: {
        name: role.isSystem ? role.name : dto.name,
        type: role.isSystem ? role.type : dto.type,
        description: dto.description ?? role.description,
        dataScope: dto.dataScope ?? role.dataScope,
        loginAccess: (dto.loginAccess as any) ?? (role.loginAccess as any),
        permissions: dto.permissionIds
          ? {
              create: dto.permissionIds.map((permissionId) => ({
                permissionId,
              })),
            }
          : undefined,
      },
      include: this.include,
    });
  }

  async remove(id: string) {
    const role = await this.findById(id);
    if (role.isSystem) {
      throw new BadRequestException('System built-in roles cannot be deleted');
    }
    await this.prisma.role.delete({ where: { id } });
    return { success: true };
  }

  listPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
  }
}
