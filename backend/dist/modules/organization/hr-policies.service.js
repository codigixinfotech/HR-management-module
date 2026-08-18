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
exports.HrPoliciesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const CATEGORY_COLORS = {
    Conduct: 'bg-primary',
    POSH: 'bg-rose-500',
    Workplace: 'bg-violet-500',
    'IT Security': 'bg-emerald-500',
    Financial: 'bg-cyan-500',
};
let HrPoliciesService = class HrPoliciesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async onModuleInit() {
        try {
            const uploadDir = './uploads/hr-policies';
            const { existsSync, mkdirSync, writeFileSync } = await Promise.resolve().then(() => __importStar(require('fs')));
            if (!existsSync(uploadDir)) {
                mkdirSync(uploadDir, { recursive: true });
            }
            const count = await this.prisma.hrPolicy.count();
            if (count === 0) {
                await this.seedDefaultPolicies();
            }
            else {
                const policies = await this.prisma.hrPolicy.findMany();
                for (const p of policies) {
                    if (!p.documentUrl) {
                        const fileName = `${p.policyCode}.pdf`;
                        const filePath = `${uploadDir}/${fileName}`;
                        if (!existsSync(filePath)) {
                            writeFileSync(filePath, `%PDF-1.4\n1 0 obj\n<< /Title (${p.title}) /Creator (EHCM Enterprise Platform) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n`);
                        }
                        await this.prisma.hrPolicy.update({
                            where: { id: p.id },
                            data: { documentUrl: `/api/organization/hr-policies/download/${fileName}` },
                        });
                    }
                }
            }
        }
        catch (e) {
            console.error('Failed to auto-seed HR policies:', e);
        }
    }
    async seedDefaultPolicies() {
        const uploadDir = './uploads/hr-policies';
        const { existsSync, mkdirSync, writeFileSync } = await Promise.resolve().then(() => __importStar(require('fs')));
        if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
        }
        const defaultPolicies = [
            {
                policyCode: 'POL-01',
                title: 'Code of Corporate Conduct & Business Ethics',
                category: 'Conduct',
                version: 'v4.0',
                publishedAt: new Date('2026-01-01'),
                signedCount: 248,
                totalEmployees: 248,
                status: 'PUBLISHED',
                esignRequirement: true,
                fileSize: '1.4 MB PDF',
                documentUrl: '/api/organization/hr-policies/download/POL-01.pdf',
                color: 'bg-primary',
                description: 'Comprehensive code of business conduct and ethical guidelines for all corporate employees.',
            },
            {
                policyCode: 'POL-02',
                title: 'Prevention of Sexual Harassment (POSH) Policy',
                category: 'POSH',
                version: 'v3.1',
                publishedAt: new Date('2026-02-15'),
                signedCount: 248,
                totalEmployees: 248,
                status: 'PUBLISHED',
                esignRequirement: true,
                fileSize: '2.1 MB PDF',
                documentUrl: '/api/organization/hr-policies/download/POL-02.pdf',
                color: 'bg-rose-500',
                description: 'Mandatory workplace POSH guidelines and internal complaints committee framework.',
            },
            {
                policyCode: 'POL-03',
                title: 'Hybrid Work & Flexible Remote Policy',
                category: 'Workplace',
                version: 'v2.0',
                publishedAt: new Date('2026-03-10'),
                signedCount: 242,
                totalEmployees: 248,
                status: 'PUBLISHED',
                esignRequirement: true,
                fileSize: '950 KB PDF',
                documentUrl: '/api/organization/hr-policies/download/POL-03.pdf',
                color: 'bg-violet-500',
                description: 'Rules and expectations for hybrid working schedules and remote office security.',
            },
            {
                policyCode: 'POL-04',
                title: 'IT & Information Security ISO 27001 Protocol',
                category: 'IT Security',
                version: 'v5.0',
                publishedAt: new Date('2026-06-01'),
                signedCount: 248,
                totalEmployees: 248,
                status: 'PUBLISHED',
                esignRequirement: true,
                fileSize: '3.4 MB PDF',
                documentUrl: '/api/organization/hr-policies/download/POL-04.pdf',
                color: 'bg-emerald-500',
                description: 'Information security protocol aligned with ISO 27001 compliance standards.',
            },
            {
                policyCode: 'POL-05',
                title: 'Anti-Bribery & Whistleblower Protection Guidelines',
                category: 'Conduct',
                version: 'v1.2',
                publishedAt: new Date('2026-04-01'),
                signedCount: 236,
                totalEmployees: 248,
                status: 'PUBLISHED',
                esignRequirement: true,
                fileSize: '1.8 MB PDF',
                documentUrl: '/api/organization/hr-policies/download/POL-05.pdf',
                color: 'bg-amber-500',
                description: 'Zero-tolerance policy on anti-bribery and protection mechanisms for corporate whistleblowers.',
            },
            {
                policyCode: 'POL-06',
                title: 'Travel & Business Expense Reimbursement Policy',
                category: 'Financial',
                version: 'v2.4',
                publishedAt: new Date('2026-05-01'),
                signedCount: 220,
                totalEmployees: 248,
                status: 'PUBLISHED',
                esignRequirement: false,
                fileSize: '1.1 MB PDF',
                documentUrl: '/api/organization/hr-policies/download/POL-06.pdf',
                color: 'bg-cyan-500',
                description: 'Corporate travel guidelines, daily per-diem allowances, and reimbursement claims workflow.',
            },
        ];
        for (const p of defaultPolicies) {
            const filePath = `${uploadDir}/${p.policyCode}.pdf`;
            if (!existsSync(filePath)) {
                writeFileSync(filePath, `%PDF-1.4\n1 0 obj\n<< /Title (${p.title}) /Creator (EHCM Enterprise Platform) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n`);
            }
            await this.prisma.hrPolicy.create({ data: p });
        }
    }
    async findAll(search, category, status, companyId) {
        const where = {};
        if (companyId)
            where.companyId = companyId;
        if (status && status !== 'all') {
            where.status = status.toUpperCase();
        }
        else if (!status) {
            where.status = { in: ['PUBLISHED', 'DRAFT'] };
        }
        if (category && category.toLowerCase() !== 'all') {
            where.category = { contains: category };
        }
        if (search && search.trim()) {
            const q = search.trim();
            where.OR = [
                { title: { contains: q } },
                { policyCode: { contains: q } },
                { category: { contains: q } },
            ];
        }
        return this.prisma.hrPolicy.findMany({
            where,
            orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        });
    }
    async getKpis(companyId) {
        const where = {
            ...(companyId ? { companyId } : {}),
            status: 'PUBLISHED',
        };
        const publishedPolicies = await this.prisma.hrPolicy.findMany({ where });
        const publishedCount = publishedPolicies.length;
        let totalSigned = 0;
        let totalEmployees = 0;
        publishedPolicies.forEach((p) => {
            totalSigned += p.signedCount;
            totalEmployees += p.totalEmployees;
        });
        const overallRate = totalEmployees > 0 ? Math.round((totalSigned / totalEmployees) * 100) : 100;
        const pendingSignoffs = totalEmployees - totalSigned;
        return {
            publishedCount,
            overallRate,
            pendingSignoffs,
            auditHealth: overallRate >= 90 ? '100% Green' : overallRate >= 75 ? 'Amber Review' : 'Critical Action Needed',
            auditedStandard: 'v4.0 ISO 27001 Audited',
        };
    }
    async findOne(id) {
        const policy = await this.prisma.hrPolicy.findUnique({ where: { id } });
        if (!policy)
            throw new common_1.NotFoundException(`Policy ${id} not found`);
        const versionHistory = await this.prisma.hrPolicy.findMany({
            where: { policyCode: policy.policyCode },
            orderBy: { createdAt: 'desc' },
        });
        return {
            ...policy,
            versionHistory,
        };
    }
    async create(dto) {
        const existing = await this.prisma.hrPolicy.findFirst({
            where: { policyCode: dto.policyCode, status: { in: ['PUBLISHED', 'DRAFT'] } },
        });
        if (existing) {
            throw new common_1.ConflictException(`Policy code ${dto.policyCode} is already active.`);
        }
        const color = dto.color || CATEGORY_COLORS[dto.category || 'Conduct'] || 'bg-primary';
        return this.prisma.hrPolicy.create({
            data: {
                companyId: dto.companyId || null,
                policyCode: dto.policyCode,
                title: dto.title,
                category: dto.category || 'Conduct',
                description: dto.description || null,
                version: dto.version || 'v1.0',
                documentUrl: dto.documentUrl || null,
                fileSize: dto.fileSize || '1.5 MB PDF',
                color,
                esignRequirement: dto.esignRequirement ?? true,
                status: dto.status || 'PUBLISHED',
                totalEmployees: dto.totalEmployees || 248,
                signedCount: dto.signedCount || 0,
                createdBy: dto.createdBy || 'HR Admin',
            },
        });
    }
    async update(id, dto) {
        const existing = await this.prisma.hrPolicy.findUnique({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException(`Policy ${id} not found`);
        if (dto.policyCode && dto.policyCode !== existing.policyCode) {
            const dup = await this.prisma.hrPolicy.findFirst({
                where: { policyCode: dto.policyCode, id: { not: id }, status: { in: ['PUBLISHED', 'DRAFT'] } },
            });
            if (dup)
                throw new common_1.ConflictException(`Policy code ${dto.policyCode} already exists.`);
        }
        const color = dto.color || CATEGORY_COLORS[dto.category || existing.category] || existing.color;
        return this.prisma.hrPolicy.update({
            where: { id },
            data: {
                ...(dto.policyCode !== undefined && { policyCode: dto.policyCode }),
                ...(dto.title !== undefined && { title: dto.title }),
                ...(dto.category !== undefined && { category: dto.category }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.version !== undefined && { version: dto.version }),
                ...(dto.documentUrl !== undefined && { documentUrl: dto.documentUrl }),
                ...(dto.fileSize !== undefined && { fileSize: dto.fileSize }),
                ...(dto.color !== undefined && { color }),
                ...(dto.esignRequirement !== undefined && { esignRequirement: dto.esignRequirement }),
                ...(dto.status !== undefined && { status: dto.status }),
                ...(dto.totalEmployees !== undefined && { totalEmployees: dto.totalEmployees }),
                ...(dto.signedCount !== undefined && { signedCount: dto.signedCount }),
                ...(dto.updatedBy !== undefined && { updatedBy: dto.updatedBy }),
            },
        });
    }
    async createVersion(id, dto) {
        const parent = await this.prisma.hrPolicy.findUnique({ where: { id } });
        if (!parent)
            throw new common_1.NotFoundException(`Policy ${id} not found`);
        await this.prisma.hrPolicy.update({
            where: { id },
            data: { status: 'ARCHIVED' },
        });
        return this.prisma.hrPolicy.create({
            data: {
                companyId: parent.companyId,
                policyCode: parent.policyCode,
                title: dto.title || parent.title,
                category: parent.category,
                description: dto.description || parent.description,
                version: dto.version,
                documentUrl: dto.documentUrl || parent.documentUrl,
                fileSize: dto.fileSize || parent.fileSize,
                color: parent.color,
                esignRequirement: dto.esignRequirement ?? parent.esignRequirement,
                status: 'PUBLISHED',
                totalEmployees: parent.totalEmployees,
                signedCount: 0,
                createdBy: dto.updatedBy || 'HR Admin',
            },
        });
    }
    async sendReminder(id) {
        const policy = await this.prisma.hrPolicy.findUnique({ where: { id } });
        if (!policy)
            throw new common_1.NotFoundException(`Policy ${id} not found`);
        const pending = policy.totalEmployees - policy.signedCount;
        return {
            success: true,
            message: `Compliance reminder queue triggered for ${pending} pending staff members on "${policy.title}".`,
            pendingCount: pending,
            signedCount: policy.signedCount,
            totalEmployees: policy.totalEmployees,
        };
    }
    async remove(id) {
        const policy = await this.prisma.hrPolicy.findUnique({ where: { id } });
        if (!policy)
            throw new common_1.NotFoundException(`Policy ${id} not found`);
        return this.prisma.hrPolicy.delete({ where: { id } });
    }
};
exports.HrPoliciesService = HrPoliciesService;
exports.HrPoliciesService = HrPoliciesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HrPoliciesService);
//# sourceMappingURL=hr-policies.service.js.map