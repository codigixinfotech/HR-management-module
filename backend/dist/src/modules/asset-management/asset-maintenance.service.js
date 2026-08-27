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
exports.AssetMaintenanceService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let AssetMaintenanceService = class AssetMaintenanceService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    list(assetId) {
        return this.prisma.assetMaintenanceRecord.findMany({
            where: assetId ? { assetId } : undefined,
            include: {
                asset: {
                    select: {
                        id: true,
                        assetTag: true,
                        name: true,
                        category: true,
                        serialNumber: true,
                        company: { select: { id: true, name: true } },
                        branch: { select: { id: true, name: true } },
                        department: { select: { id: true, name: true } },
                        currentEmployee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } },
                    },
                },
            },
            orderBy: { startDate: 'desc' },
        });
    }
    async create(dto) {
        const woCount = await this.prisma.assetMaintenanceRecord.count();
        const workOrderNumber = `WO-2026-${String(woCount + 1001).padStart(6, '0')}`;
        const [record] = await this.prisma.$transaction([
            this.prisma.assetMaintenanceRecord.create({
                data: {
                    assetId: dto.assetId,
                    workOrderNumber,
                    issue: dto.issue,
                    priority: dto.priority || 'MEDIUM',
                    maintenanceType: dto.maintenanceType || 'Repair',
                    vendor: dto.vendor || null,
                    warrantyClaim: dto.warrantyClaim ?? false,
                    startDate: new Date(dto.startDate),
                    cost: dto.cost ? Number(dto.cost) : null,
                    notes: dto.notes || null,
                    qcStatus: 'PENDING',
                },
            }),
            this.prisma.asset.update({ where: { id: dto.assetId }, data: { status: client_1.AssetStatus.UNDER_MAINTENANCE } }),
        ]);
        return record;
    }
    async complete(id, dto) {
        const record = await this.prisma.assetMaintenanceRecord.findUnique({ where: { id } });
        if (!record)
            throw new common_1.NotFoundException('Maintenance record not found');
        const completionDate = dto?.completionDate ? new Date(dto.completionDate) : new Date();
        const finalCondition = dto?.finalCondition || 'GOOD';
        const actualCost = dto?.actualCost !== undefined && dto.actualCost !== null ? Number(dto.actualCost) : record.cost;
        const vendor = dto?.vendor || record.vendor;
        const notes = dto?.repairNotes || record.notes;
        const qcStatus = dto?.qcStatus || 'PASS';
        const newAssetStatus = qcStatus === 'PASS' ? client_1.AssetStatus.IN_STOCK : client_1.AssetStatus.UNDER_MAINTENANCE;
        const [updated] = await this.prisma.$transaction([
            this.prisma.assetMaintenanceRecord.update({
                where: { id },
                data: {
                    endDate: qcStatus === 'PASS' ? completionDate : null,
                    cost: actualCost,
                    vendor,
                    finalCondition,
                    workPerformed: dto?.workPerformed || null,
                    partsUsed: dto?.partsUsed || null,
                    qcStatus,
                    notes,
                },
            }),
            this.prisma.asset.update({
                where: { id: record.assetId },
                data: { status: newAssetStatus, condition: finalCondition },
            }),
        ]);
        return updated;
    }
};
exports.AssetMaintenanceService = AssetMaintenanceService;
exports.AssetMaintenanceService = AssetMaintenanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AssetMaintenanceService);
//# sourceMappingURL=asset-maintenance.service.js.map