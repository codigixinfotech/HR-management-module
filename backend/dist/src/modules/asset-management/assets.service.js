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
        company: { select: { id: true, name: true, code: true } },
        branch: { select: { id: true, name: true, code: true } },
        department: { select: { id: true, name: true, code: true } },
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
            include: {
                ...this.listInclude,
                allocations: {
                    include: { employee: { select: { id: true, firstName: true, lastName: true, employeeCode: true } } },
                    orderBy: { allocatedAt: 'desc' },
                },
                maintenanceLogs: { orderBy: { startDate: 'desc' } },
            },
        });
        if (!asset)
            throw new common_1.NotFoundException('Asset not found');
        return asset;
    }
    async generateNextAssetTag(companyId) {
        const count = await this.prisma.asset.count({ where: { companyId } });
        const nextNum = (count + 1).toString().padStart(6, '0');
        return `AST-${nextNum}`;
    }
    async create(dto) {
        const assetTag = dto.assetTag || (await this.generateNextAssetTag(dto.companyId));
        const existing = await this.prisma.asset.findFirst({
            where: { companyId: dto.companyId, assetTag },
        });
        if (existing)
            throw new common_1.ConflictException(`An asset with tag "${assetTag}" already exists for this company`);
        if (dto.purchaseDate) {
            const pDate = new Date(dto.purchaseDate);
            const today = new Date();
            if (pDate > today) {
                throw new common_1.BadRequestException('Purchase Date cannot be in the future.');
            }
        }
        if (dto.serialNumber && dto.serialNumber.trim()) {
            const existingSerial = await this.prisma.asset.findFirst({
                where: { companyId: dto.companyId, serialNumber: dto.serialNumber.trim() },
            });
            if (existingSerial) {
                throw new common_1.ConflictException('This Serial Number is already registered.');
            }
        }
        if (dto.warrantyStart && dto.warrantyExpiry) {
            if (new Date(dto.warrantyExpiry) < new Date(dto.warrantyStart)) {
                throw new common_1.BadRequestException('Warranty End Date cannot be before Warranty Start Date.');
            }
        }
        let targetStatus = client_1.AssetStatus.IN_STOCK;
        if (dto.status === 'ALLOCATED')
            targetStatus = client_1.AssetStatus.ALLOCATED;
        else if (dto.status === 'UNDER_MAINTENANCE')
            targetStatus = client_1.AssetStatus.UNDER_MAINTENANCE;
        else if (dto.status === 'RETIRED' || dto.status === 'DISPOSED')
            targetStatus = client_1.AssetStatus.RETIRED;
        return this.prisma.asset.create({
            data: {
                companyId: dto.companyId,
                branchId: dto.branchId || null,
                departmentId: dto.departmentId || null,
                assetTag,
                name: dto.name,
                category: dto.category,
                assetType: dto.assetType || 'Hardware',
                physicalLocation: dto.physicalLocation || null,
                vendor: dto.vendor || null,
                invoiceNumber: dto.invoiceNumber || null,
                poNumber: dto.poNumber || null,
                serialNumber: dto.serialNumber || null,
                manufacturer: dto.manufacturer || null,
                modelNumber: dto.modelNumber || null,
                value: dto.value !== undefined && dto.value !== null ? Number(dto.value) : null,
                status: targetStatus,
                condition: dto.condition || 'NEW',
                usefulLife: dto.usefulLife || null,
                notes: dto.notes || null,
                remarks: dto.remarks || null,
                photoUrl: dto.photoUrl || null,
                purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
                warrantyStart: dto.warrantyStart ? new Date(dto.warrantyStart) : undefined,
                warrantyExpiry: dto.warrantyExpiry ? new Date(dto.warrantyExpiry) : undefined,
            },
            include: this.listInclude,
        });
    }
    async update(id, dto) {
        const existingAsset = await this.findById(id);
        if (dto.purchaseDate) {
            const pDate = new Date(dto.purchaseDate);
            const today = new Date();
            if (pDate > today) {
                throw new common_1.BadRequestException('Purchase Date cannot be a future date');
            }
        }
        if (dto.serialNumber && dto.serialNumber.trim() && dto.serialNumber.trim() !== existingAsset.serialNumber) {
            const existingSerial = await this.prisma.asset.findFirst({
                where: { companyId: existingAsset.companyId, serialNumber: dto.serialNumber.trim(), NOT: { id } },
            });
            if (existingSerial) {
                throw new common_1.ConflictException(`An asset with serial number "${dto.serialNumber}" already exists`);
            }
        }
        if (existingAsset.status === client_1.AssetStatus.ALLOCATED) {
            if (dto.branchId && dto.branchId !== existingAsset.branchId) {
                throw new common_1.BadRequestException('This asset is currently allocated. Please use Asset Allocation/Transfer workflow to change ownership or location.');
            }
            if (dto.departmentId && dto.departmentId !== existingAsset.departmentId) {
                throw new common_1.BadRequestException('This asset is currently allocated. Please use Asset Allocation/Transfer workflow to change ownership or location.');
            }
            if (dto.status && dto.status !== 'ALLOCATED') {
                throw new common_1.BadRequestException('This asset is currently allocated. Please use Asset Allocation/Return workflow to change lifecycle status.');
            }
        }
        const { companyId, status, purchaseDate, warrantyStart, warrantyExpiry, ...rest } = dto;
        let targetStatus = undefined;
        if (status === 'ALLOCATED')
            targetStatus = client_1.AssetStatus.ALLOCATED;
        else if (status === 'UNDER_MAINTENANCE')
            targetStatus = client_1.AssetStatus.UNDER_MAINTENANCE;
        else if (status === 'RETIRED' || status === 'DISPOSED')
            targetStatus = client_1.AssetStatus.RETIRED;
        else if (status === 'IN_STOCK' || status === 'AVAILABLE')
            targetStatus = client_1.AssetStatus.IN_STOCK;
        return this.prisma.asset.update({
            where: { id },
            data: {
                ...rest,
                ...(companyId ? { companyId } : {}),
                ...(targetStatus ? { status: targetStatus } : {}),
                purchaseDate: purchaseDate ? new Date(purchaseDate) : undefined,
                warrantyStart: warrantyStart ? new Date(warrantyStart) : undefined,
                warrantyExpiry: warrantyExpiry ? new Date(warrantyExpiry) : undefined,
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
            throw new common_1.ConflictException('This asset is not available for allocation.');
        }
        const employee = await this.prisma.employee.findUnique({ where: { id: dto.employeeId } });
        if (!employee) {
            throw new common_1.BadRequestException('Employee is required.');
        }
        if (employee.status !== 'ACTIVE') {
            throw new common_1.BadRequestException('Selected employee is inactive and cannot receive an asset.');
        }
        if (employee.companyId !== asset.companyId) {
            throw new common_1.BadRequestException('Selected employee does not belong to this company.');
        }
        const allocatedAt = dto.allocationDate ? new Date(dto.allocationDate) : new Date();
        const expectedReturnDate = dto.expectedReturnDate ? new Date(dto.expectedReturnDate) : null;
        const [, updated] = await this.prisma.$transaction([
            this.prisma.assetAllocation.create({
                data: {
                    assetId: id,
                    employeeId: dto.employeeId,
                    allocationType: dto.allocationType || 'New Allocation',
                    location: dto.location || null,
                    allocatedAt,
                    expectedReturnDate,
                    remarks: dto.remarks || null,
                },
            }),
            this.prisma.asset.update({
                where: { id },
                data: { status: client_1.AssetStatus.ALLOCATED, currentEmployeeId: dto.employeeId },
                include: this.listInclude,
            }),
        ]);
        return updated;
    }
    async returnAsset(id, dto) {
        const asset = await this.findById(id);
        if (asset.status !== client_1.AssetStatus.ALLOCATED) {
            throw new common_1.ConflictException('Only allocated assets can be returned');
        }
        const openAllocation = await this.prisma.assetAllocation.findFirst({
            where: { assetId: id, returnedAt: null },
            orderBy: { allocatedAt: 'desc' },
        });
        const returnDate = dto?.returnDate ? new Date(dto.returnDate) : new Date();
        const returnReason = dto?.returnReason === 'Other' && dto?.otherReason ? `Other: ${dto.otherReason}` : dto?.returnReason || 'Asset Return';
        const condition = dto?.condition || 'Good';
        let newStatus = client_1.AssetStatus.IN_STOCK;
        if (condition === 'Damaged') {
            newStatus = client_1.AssetStatus.UNDER_MAINTENANCE;
        }
        else if (condition === 'Lost') {
            newStatus = client_1.AssetStatus.RETIRED;
        }
        const [, updated] = await this.prisma.$transaction([
            openAllocation
                ? this.prisma.assetAllocation.update({
                    where: { id: openAllocation.id },
                    data: {
                        returnedAt: returnDate,
                        returnReason,
                        returnedBy: dto?.returnedBy || null,
                        returnLocation: dto?.returnLocation || null,
                        conditionOnReturn: condition,
                        accessoriesReturned: dto?.accessoriesReturned || null,
                        remarks: dto?.remarks || null,
                    },
                })
                : this.prisma.assetAllocation.create({
                    data: {
                        assetId: id,
                        employeeId: asset.currentEmployeeId,
                        returnedAt: returnDate,
                        returnReason,
                        returnedBy: dto?.returnedBy || null,
                        returnLocation: dto?.returnLocation || null,
                        conditionOnReturn: condition,
                        accessoriesReturned: dto?.accessoriesReturned || null,
                        remarks: dto?.remarks || null,
                    },
                }),
            this.prisma.asset.update({
                where: { id },
                data: {
                    status: newStatus,
                    condition,
                    currentEmployeeId: null,
                },
                include: this.listInclude,
            }),
            ...(condition === 'Damaged'
                ? [
                    this.prisma.assetMaintenanceRecord.create({
                        data: {
                            assetId: id,
                            issue: `Damaged on Return (${returnReason})`,
                            startDate: returnDate,
                            cost: null,
                        },
                    }),
                ]
                : []),
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