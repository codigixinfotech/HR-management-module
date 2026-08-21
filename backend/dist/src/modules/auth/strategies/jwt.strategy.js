"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtStrategy = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const passport_1 = require("@nestjs/passport");
const passport_jwt_1 = require("passport-jwt");
const prisma_service_1 = require("../../../common/prisma/prisma.service");
let JwtStrategy = class JwtStrategy extends (0, passport_1.PassportStrategy)(passport_jwt_1.Strategy) {
    prisma;
    constructor(config, prisma) {
        super({
            jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.get('JWT_ACCESS_SECRET'),
        });
        this.prisma = prisma;
    }
    async validate(payload) {
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
            throw new common_1.UnauthorizedException('Account is inactive or no longer exists');
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
            }
            else {
                const company = await this.prisma.company.findFirst();
                const empCode = `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
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
        const isSuperAdmin = user.roles.some((ur) => ur.role.name === 'SUPER_ADMIN' && ur.role.isSystem);
        const rolesList = user.roles.map((ur) => ur.role.name);
        const isHrOrAdmin = isSuperAdmin || rolesList.some((r) => r.includes('HR') || r.includes('ADMIN'));
        let permissions = isSuperAdmin
            ? ['*']
            : Array.from(new Set(user.roles.flatMap((ur) => ur.role.permissions
                ? ur.role.permissions.map((rp) => rp.permission.code)
                : [])));
        if (!permissions.includes('*')) {
            permissions = Array.from(new Set([
                ...permissions,
                'employees.read',
                'asset_management.read',
                'attendance.read',
                'tasks.read',
                'leave.read',
                ...(isHrOrAdmin
                    ? ['recruitment.read', 'recruitment.write', 'recruitment.manage', 'employees.write']
                    : []),
            ]));
        }
        let primaryRole = 'Employee';
        if (isSuperAdmin) {
            primaryRole = 'Super Admin';
        }
        else if (rolesList.includes('IT_ADMIN')) {
            primaryRole = 'IT Admin';
        }
        else if (rolesList.includes('HR_MANAGER')) {
            primaryRole = 'HR Manager';
        }
        else if (rolesList.includes('HR_EXECUTIVE')) {
            primaryRole = 'HR Executive';
        }
        else if (rolesList.includes('DEPARTMENT_MANAGER')) {
            primaryRole = 'Department Manager';
        }
        else if (rolesList.includes('FINANCE_MANAGER')) {
            primaryRole = 'Finance Manager';
        }
        else if (user.roles.length > 0 && user.roles[0].role?.name) {
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
};
exports.JwtStrategy = JwtStrategy;
exports.JwtStrategy = JwtStrategy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], JwtStrategy);
//# sourceMappingURL=jwt.strategy.js.map