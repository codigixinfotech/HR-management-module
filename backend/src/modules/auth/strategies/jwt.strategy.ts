import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CurrentUserPayload } from '../../../common/decorators/current-user.decorator';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET')!,
    });
  }

  async validate(payload: JwtPayload): Promise<CurrentUserPayload> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        roles: {
          include: {
            role: {
              include: { permissions: { include: { permission: true } } },
            },
          },
        },
        employee: {
          include: {
            department: true,
            designation: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        'Account is inactive or no longer exists',
      );
    }

    const isSuperAdmin = user.roles.some(
      (ur) => ur.role.name === 'SUPER_ADMIN' && ur.role.isSystem,
    );
    const rolesList = user.roles.map((ur) => ur.role.name);
    const isHrOrAdmin = isSuperAdmin || rolesList.some((r) => r.includes('HR') || r.includes('ADMIN'));

    let permissions = isSuperAdmin
      ? ['*']
      : Array.from(
          new Set(
            user.roles.flatMap((ur) =>
              ur.role.permissions
                ? ur.role.permissions.map((rp) => rp.permission.code)
                : [],
            ),
          ),
        );

    if (isHrOrAdmin && !permissions.includes('*')) {
      permissions = Array.from(
        new Set([
          ...permissions,
          'recruitment.read',
          'recruitment.write',
          'recruitment.manage',
          'employees.read',
          'employees.write',
        ]),
      );
    }
    let primaryRole = 'Employee';
    if (isSuperAdmin) {
      primaryRole = 'Super Admin';
    } else if (rolesList.includes('IT_ADMIN')) {
      primaryRole = 'IT Admin';
    } else if (rolesList.includes('HR_MANAGER')) {
      primaryRole = 'HR Manager';
    } else if (rolesList.includes('HR_EXECUTIVE')) {
      primaryRole = 'HR Executive';
    } else if (rolesList.includes('DEPARTMENT_MANAGER')) {
      primaryRole = 'Department Manager';
    } else if (rolesList.includes('FINANCE_MANAGER')) {
      primaryRole = 'Finance Manager';
    } else if (user.roles.length > 0 && user.roles[0].role?.name) {
      primaryRole = user.roles[0].role.name
        .split('_')
        .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
        .join(' ');
    }

    const fullName = user.employee
      ? `${user.employee.firstName} ${user.employee.lastName}`.trim()
      : user.email.split('@')[0];

    return {
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      permissions,
      roles: rolesList,
      primaryRole,
      employee: user.employee
        ? {
            id: user.employee.id,
            employeeCode: user.employee.employeeCode,
            firstName: user.employee.firstName,
            lastName: user.employee.lastName,
            fullName,
            departmentId: user.employee.departmentId,
            departmentName: user.employee.department?.name || null,
            designationId: user.employee.designationId,
            designationTitle: user.employee.designation?.title || null,
          }
        : null,
    };
  }
}
