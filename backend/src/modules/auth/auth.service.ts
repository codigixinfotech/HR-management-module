import {
  BadRequestException,
  ConflictException,
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface DemoAccountInfo {
  roleName: string;
  displayName: string;
  email: string;
  description: string;
  icon: string;
  badgeColor: string;
}

const DEMO_ACCOUNTS_METADATA: DemoAccountInfo[] = [
  {
    roleName: 'SUPER_ADMIN',
    displayName: 'Super Admin',
    email: 'admin@ehcm.local',
    description: 'Full ERP Control & System Administration',
    icon: '👑',
    badgeColor: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  },
  {
    roleName: 'HR_MANAGER',
    displayName: 'HR Manager',
    email: 'hr.manager@ehcm.local',
    description: 'HR Operations, Employee Master & Policy Library',
    icon: '👔',
    badgeColor: 'bg-primary/10 text-primary border-primary/20',
  },
  {
    roleName: 'HR_EXECUTIVE',
    displayName: 'HR Executive',
    email: 'hr.executive@ehcm.local',
    description: 'Day-to-day HR Operations & Employee Offboarding',
    icon: '💼',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  },
  {
    roleName: 'DEPARTMENT_MANAGER',
    displayName: 'Department Manager',
    email: 'manager@ehcm.local',
    description: 'Team Movements, Transfers & Performance Reviews',
    icon: '👨‍💼',
    badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  },
  {
    roleName: 'FINANCE_MANAGER',
    displayName: 'Finance Manager',
    email: 'finance@ehcm.local',
    description: 'Payroll Processing, F&F Settlements & Claims',
    icon: '💰',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  },
  {
    roleName: 'IT_ADMIN',
    displayName: 'IT Admin',
    email: 'it.admin@ehcm.local',
    description: 'Asset Inventory, IT Clearances & System Logs',
    icon: '💻',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  },
  {
    roleName: 'EMPLOYEE',
    displayName: 'Employee Self-Service',
    email: 'employee@ehcm.local',
    description: 'Personal Profile, Attendance & Document Portal',
    icon: '👤',
    badgeColor: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  },
];

const DEMO_USER_SEED = [
  { email: 'admin@ehcm.local', password: 'Admin@123', role: 'SUPER_ADMIN' },
  { email: 'motesanika@gmail.com', password: 'Sanika@123', role: 'EMPLOYEE' },
  { email: 'hr.manager@ehcm.local', password: 'Hr@123', role: 'HR_MANAGER' },
  { email: 'hr.executive@ehcm.local', password: 'HrExec@123', role: 'HR_EXECUTIVE' },
  { email: 'manager@ehcm.local', password: 'Manager@123', role: 'DEPARTMENT_MANAGER' },
  { email: 'finance@ehcm.local', password: 'Finance@123', role: 'FINANCE_MANAGER' },
  { email: 'it.admin@ehcm.local', password: 'ITAdmin@123', role: 'IT_ADMIN' },
  { email: 'employee@ehcm.local', password: 'Employee@123', role: 'EMPLOYEE' },
];

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      await this.seedDemoRolesAndUsers();
    } catch (e) {
      console.error('Failed to auto-seed demo accounts:', e);
    }
  }

  private async seedDemoRolesAndUsers() {
    // 1. Ensure system roles exist
    const systemRoles = [
      { name: 'SUPER_ADMIN', description: 'Super Administrator with unrestricted ERP access' },
      { name: 'HR_MANAGER', description: 'HR Manager with complete HR & People operations management' },
      { name: 'HR_EXECUTIVE', description: 'HR Executive managing day-to-day HR records & onboarding' },
      { name: 'DEPARTMENT_MANAGER', description: 'Department Lead managing team rosters & promotions' },
      { name: 'FINANCE_MANAGER', description: 'Finance Lead managing payroll & F&F settlements' },
      { name: 'IT_ADMIN', description: 'IT Administrator managing assets & hardware clearances' },
      { name: 'EMPLOYEE', description: 'Standard Employee with Self-Service access' },
    ];

    const roleMap = new Map<string, string>();
    for (const r of systemRoles) {
      const existing = await this.prisma.role.findFirst({ where: { name: r.name } });
      if (existing) {
        roleMap.set(r.name, existing.id);
      } else {
        const created = await this.prisma.role.create({
          data: {
            name: r.name,
            description: r.description,
            isSystem: true,
          },
        });
        roleMap.set(r.name, created.id);
      }
    }

    // 2. Ensure company exists
    let company = await this.prisma.company.findFirst();
    if (!company) {
      company = await this.prisma.company.create({
        data: {
          name: 'EHCM Enterprise Corp',
          code: 'EHCM-CORP',
          country: 'India',
          currency: 'INR',
        },
      });
    }

    // 3. Seed/update demo users
    for (const u of DEMO_USER_SEED) {
      const passwordHash = await bcrypt.hash(u.password, 12);
      const roleId = roleMap.get(u.role);

      const existingUser = await this.prisma.user.findUnique({
        where: { email: u.email },
      });

      if (!existingUser) {
        const newUser = await this.prisma.user.create({
          data: {
            email: u.email,
            passwordHash,
            companyId: company.id,
            isActive: true,
            roles: roleId ? { create: [{ roleId }] } : undefined,
          },
        });

        // Also create or link employee record
        const existingEmp = await this.prisma.employee.findFirst({
          where: { OR: [{ workEmail: u.email }, { userId: newUser.id }] },
        });

        if (existingEmp) {
          await this.prisma.employee.update({
            where: { id: existingEmp.id },
            data: { userId: newUser.id, workEmail: u.email },
          });
        } else {
          const empCode = u.email === 'motesanika@gmail.com' ? 'EMP-8265' : `DEMO-${u.role.substring(0, 4)}-${Math.floor(100 + Math.random() * 900)}`;
          const firstName = u.email === 'motesanika@gmail.com' ? 'Sanika' : u.role.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
          const lastName = u.email === 'motesanika@gmail.com' ? 'Mote' : 'Demo';

          await this.prisma.employee.create({
            data: {
              companyId: company.id,
              userId: newUser.id,
              employeeCode: empCode,
              firstName,
              lastName,
              workEmail: u.email,
              dateOfJoining: new Date(),
              status: 'ACTIVE',
            },
          });
        }
      } else {
        // Ensure password matches exact demo specification
        await this.prisma.user.update({
          where: { id: existingUser.id },
          data: { passwordHash, isActive: true },
        });

        if (roleId) {
          const hasRole = await this.prisma.userRole.findFirst({
            where: { userId: existingUser.id, roleId },
          });
          if (!hasRole) {
            await this.prisma.userRole.create({
              data: { userId: existingUser.id, roleId },
            });
          }
        }
      }
    }
  }

  getDemoAccounts(): DemoAccountInfo[] {
    return DEMO_ACCOUNTS_METADATA;
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    let company = await this.prisma.company.findFirst();
    if (!company) {
      company = await this.prisma.company.create({
        data: { name: 'EHCM Enterprise Corp', code: 'EHCM-CORP', country: 'India', currency: 'INR' },
      });
    }

    // Role lookup or fallback
    const roleName = dto.role || 'EMPLOYEE';
    let roleRecord = await this.prisma.role.findFirst({ where: { name: roleName } });
    if (!roleRecord) {
      roleRecord = await this.prisma.role.findFirst({ where: { name: 'EMPLOYEE' } });
    }

    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        companyId: company.id,
        isActive: true,
        roles: roleRecord ? { create: [{ roleId: roleRecord.id }] } : undefined,
      },
    });

    // Extract first & last name from full name
    const nameParts = (dto.fullName || 'New User').trim().split(' ');
    const firstName = nameParts[0] || 'New';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    let departmentId: string | null = null;
    if (dto.department) {
      const deptSearch = dto.department.trim();
      const matchedDept = await this.prisma.department.findFirst({
        where: {
          OR: [
            { name: { contains: deptSearch } },
            { code: { contains: deptSearch } },
            { name: { contains: deptSearch.split('&')[0].trim() } },
          ],
        },
      });
      if (matchedDept) {
        departmentId = matchedDept.id;
      }
    }

    const empCode = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    await this.prisma.employee.create({
      data: {
        companyId: company.id,
        userId: newUser.id,
        employeeCode: empCode,
        firstName,
        lastName,
        workEmail: dto.email,
        departmentId,
        dateOfJoining: new Date(),
        status: 'ACTIVE',
      },
    });

    return this.issueTokens(newUser.id, newUser.email);
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokens(user.id, user.email);
    return {
      ...tokens,
      mustResetPassword: Boolean(user.mustResetPassword),
    };
  }

  async changePassword(userId: string, dto: { newPassword: string }) {
    if (!dto.newPassword || dto.newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        mustResetPassword: false,
      },
    });
    return { success: true, message: 'Password updated successfully' };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; email: string };
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokenHash = this.hashToken(refreshToken);
    const stored = await this.prisma.refreshToken.findFirst({
      where: { userId: payload.sub, tokenHash, revoked: false },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token no longer valid');
    }

    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revoked: true },
    });

    return this.issueTokens(payload.sub, payload.email);
  }

  async logout(userId: string, refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { userId, tokenHash, revoked: false },
      data: { revoked: true },
    });
    return { success: true };
  }

  private async issueTokens(userId: string, email: string) {
    const accessToken = this.jwt.sign(
      { sub: userId, email },
      {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>(
          'JWT_ACCESS_EXPIRES_IN',
          '15m',
        ) as any,
      },
    );

    const refreshToken = this.jwt.sign(
      { sub: userId, email },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>(
          'JWT_REFRESH_EXPIRES_IN',
          '7d',
        ) as any,
      },
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
