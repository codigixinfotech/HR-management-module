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
exports.AssetsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let AssetsService = class AssetsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    listInclude = {
        currentEmployee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
    };
    list(companyId) {
        return this.prisma.asset.findMany({
            where: companyId ? { companyId } : undefined,
            include: this.listInclude,
            orderBy: { createdAt: 'desc' },
        });
    }
    async findById(id) {
        const asset = await this.prisma.asset.findUnique({
            where: { id },
            include: { ...this.listInclude, allocations: { orderBy: { allocatedAt: 'desc' } }, maintenanceLogs: { orderBy: { startDate: 'desc' } } },
        });
        if (!asset)
            throw new common_1.NotFoundException('Asset not found');
        return asset;
    }
    async create(dto) {
        const existing = await this.prisma.asset.findFirst({
            where: { companyId: dto.companyId, assetTag: dto.assetTag },
        });
        if (existing)
            throw new common_1.ConflictException('An asset with this tag already exists for this company');
        return this.prisma.asset.create({
            data: {
                ...dto,
                purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
                warrantyExpiry: dto.warrantyExpiry ? new Date(dto.warrantyExpiry) : undefined,
            },
            include: this.listInclude,
        });
    }
    async update(id, dto) {
        await this.findById(id);
        return this.prisma.asset.update({
            where: { id },
            data: {
                ...dto,
                purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
                warrantyExpiry: dto.warrantyExpiry ? new Date(dto.warrantyExpiry) : undefined,
            },
            include: this.listInclude,
        });
    }
    async remove(id) {
        await this.findById(id);
        await this.prisma.asset.delete({ where: { id } });
        return { success: true };
    }
    async allocate(id, dto) {
        const asset = await this.findById(id);
        if (asset.status !== client_1.AssetStatus.IN_STOCK) {
            throw new common_1.ConflictException('Only assets that are in stock can be allocated');
        }
        const [, updated] = await this.prisma.$transaction([
            this.prisma.assetAllocation.create({
                data: { assetId: id, employeeId: dto.employeeId, remarks: dto.remarks },
            }),
            this.prisma.asset.update({
                where: { id },
                data: { status: client_1.AssetStatus.ALLOCATED, currentEmployeeId: dto.employeeId },
                include: this.listInclude,
            }),
        ]);
        return updated;
    }
    async returnAsset(id) {
        const asset = await this.findById(id);
        if (asset.status !== client_1.AssetStatus.ALLOCATED) {
            throw new common_1.ConflictException('Only allocated assets can be returned');
        }
        const openAllocation = await this.prisma.assetAllocation.findFirst({
            where: { assetId: id, returnedAt: null },
            orderBy: { allocatedAt: 'desc' },
        });
        const [, updated] = await this.prisma.$transaction([
            openAllocation
                ? this.prisma.assetAllocation.update({ where: { id: openAllocation.id }, data: { returnedAt: new Date() } })
                : this.prisma.assetAllocation.create({ data: { assetId: id, employeeId: asset.currentEmployeeId, returnedAt: new Date() } }),
            this.prisma.asset.update({
                where: { id },
                data: { status: client_1.AssetStatus.IN_STOCK, currentEmployeeId: null },
                include: this.listInclude,
            }),
        ]);
        return updated;
    }
};
exports.AssetsService = AssetsService;
exports.AssetsService = AssetsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AssetsService);
//# sourceMappingURL=assets.service.js.map