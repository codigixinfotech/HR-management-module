"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const prisma_service_1 = require("../../common/prisma/prisma.service");
const DEMO_ACCOUNTS_METADATA = [
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
    { email: 'hr.manager@ehcm.local', password: 'Hr@123', role: 'HR_MANAGER' },
    { email: 'hr.executive@ehcm.local', password: 'HrExec@123', role: 'HR_EXECUTIVE' },
    { email: 'manager@ehcm.local', password: 'Manager@123', role: 'DEPARTMENT_MANAGER' },
    { email: 'finance@ehcm.local', password: 'Finance@123', role: 'FINANCE_MANAGER' },
    { email: 'it.admin@ehcm.local', password: 'ITAdmin@123', role: 'IT_ADMIN' },
    { email: 'employee@ehcm.local', password: 'Employee@123', role: 'EMPLOYEE' },
];
let AuthService = class AuthService {
    prisma;
    jwt;
    config;
    constructor(prisma, jwt, config) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
    }
    async onModuleInit() {
        try {
            await this.seedDemoRolesAndUsers();
        }
        catch (e) {
            console.error('Failed to auto-seed demo accounts:', e);
        }
    }
    async seedDemoRolesAndUsers() {
        const systemRoles = [
            { name: 'SUPER_ADMIN', description: 'Super Administrator with unrestricted ERP access' },
            { name: 'HR_MANAGER', description: 'HR Manager with complete HR & People operations management' },
            { name: 'HR_EXECUTIVE', description: 'HR Executive managing day-to-day HR records & onboarding' },
            { name: 'DEPARTMENT_MANAGER', description: 'Department Lead managing team rosters & promotions' },
            { name: 'FINANCE_MANAGER', description: 'Finance Lead managing payroll & F&F settlements' },
            { name: 'IT_ADMIN', description: 'IT Administrator managing assets & hardware clearances' },
            { name: 'EMPLOYEE', description: 'Standard Employee with Self-Service access' },
        ];
        const roleMap = new Map();
        for (const r of systemRoles) {
            const existing = await this.prisma.role.findFirst({ where: { name: r.name } });
            if (existing) {
                roleMap.set(r.name, existing.id);
            }
            else {
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
                const empCode = `DEMO-${u.role.substring(0, 4)}-${Math.floor(100 + Math.random() * 900)}`;
                await this.prisma.employee.create({
                    data: {
                        companyId: company.id,
                        userId: newUser.id,
                        employeeCode: empCode,
                        firstName: u.role.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' '),
                        lastName: 'Demo',
                        workEmail: u.email,
                        dateOfJoining: new Date(),
                        status: 'ACTIVE',
                    },
                });
            }
            else {
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
    getDemoAccounts() {
        return DEMO_ACCOUNTS_METADATA;
    }
    async login(email, password) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });
        return this.issueTokens(user.id, user.email);
    }
    async refresh(refreshToken) {
        let payload;
        try {
            payload = this.jwt.verify(refreshToken, {
                secret: this.config.get('JWT_REFRESH_SECRET'),
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        const tokenHash = this.hashToken(refreshToken);
        const stored = await this.prisma.refreshToken.findFirst({
            where: { userId: payload.sub, tokenHash, revoked: false },
        });
        if (!stored || stored.expiresAt < new Date()) {
            throw new common_1.UnauthorizedException('Refresh token no longer valid');
        }
        await this.prisma.refreshToken.update({
            where: { id: stored.id },
            data: { revoked: true },
        });
        return this.issueTokens(payload.sub, payload.email);
    }
    async logout(userId, refreshToken) {
        const tokenHash = this.hashToken(refreshToken);
        await this.prisma.refreshToken.updateMany({
            where: { userId, tokenHash, revoked: false },
            data: { revoked: true },
        });
        return { success: true };
    }
    async issueTokens(userId, email) {
        const accessToken = this.jwt.sign({ sub: userId, email }, {
            secret: this.config.get('JWT_ACCESS_SECRET'),
            expiresIn: this.config.get('JWT_ACCESS_EXPIRES_IN', '15m'),
        });
        const refreshToken = this.jwt.sign({ sub: userId, email }, {
            secret: this.config.get('JWT_REFRESH_SECRET'),
            expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '7d'),
        });
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
    hashToken(token) {
        return crypto.createHash('sha256').update(token).digest('hex');
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map