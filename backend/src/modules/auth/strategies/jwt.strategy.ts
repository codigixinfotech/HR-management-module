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

    let employeeRecord = user.employee;
    if (!employeeRecord) {
      const matchedEmp = await this.prisma.employee.findFirst({
        where: { OR: [{ userId: user.id }, { workEmail: user.email }] },
        include: { department: true, designation: true },
      });
      if (matchedEmp) {
        if (!matchedEmp.userId) {
          await this.prisma.employee.update({
            where: { id: matchedEmp.id },
            data: { userId: user.id },
          });
        }
        employeeRecord = matchedEmp;
      } else {
        const company = await this.prisma.company.findFirst();
        let empCode = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
        let exists = await this.prisma.employee.findFirst({ where: { employeeCode: empCode } });
        while (exists) {
          empCode = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
          exists = await this.prisma.employee.findFirst({ where: { employeeCode: empCode } });
        }
        const nameParts = user.email.split('@')[0].split('.');
        const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : 'Employee';
        const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : 'User';

        employeeRecord = await this.prisma.employee.create({
          data: {
            companyId: company?.id || 'default-company',
            userId: user.id,
            employeeCode: empCode,
            firstName,
            lastName,
            workEmail: user.email,
            status: 'ACTIVE',
            dateOfJoining: new Date(),
          },
          include: { department: true, designation: true },
        });
      }
    }

    const isSuperAdmin = user.roles.some(
      (ur) => ur.role.name === 'SUPER_ADMIN' && ur.role.isSystem,
    );
    const rolesList = user.roles.map((ur) => ur.role.name);
    const isHrOrAdmin = isSuperAdmin || rolesList.some((r) => r.includes('HR') || r.includes('ADMIN'));

    const permissions = isSuperAdmin
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

    const fullName = employeeRecord
      ? `${employeeRecord.firstName} ${employeeRecord.lastName}`.trim()
      : user.email.split('@')[0];

    return {
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      mustResetPassword: user.mustResetPassword,
      permissions,
      roles: rolesList,
      primaryRole,
      employee: employeeRecord
        ? {
            id: employeeRecord.id,
            employeeCode: employeeRecord.employeeCode,
            firstName: employeeRecord.firstName,
            lastName: employeeRecord.lastName,
            fullName,
            departmentId: employeeRecord.departmentId,
            departmentName: employeeRecord.department?.name || null,
            designationId: employeeRecord.designationId,
            designationTitle: employeeRecord.designation?.title || null,
          }
        : null,
    };
  }
}
