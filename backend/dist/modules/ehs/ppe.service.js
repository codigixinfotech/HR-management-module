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
exports.PpeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let PpeService = class PpeService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    list(companyId) {
        return this.prisma.ppeItem.findMany({
            where: companyId ? { companyId } : undefined,
            orderBy: { name: 'asc' },
        });
    }
    async findById(id) {
        const item = await this.prisma.ppeItem.findUnique({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException('PPE item not found');
        return item;
    }
    create(dto) {
        return this.prisma.ppeItem.create({ data: dto });
    }
    async update(id, dto) {
        await this.findById(id);
        return this.prisma.ppeItem.update({ where: { id }, data: dto });
    }
    async remove(id) {
        await this.findById(id);
        await this.prisma.ppeItem.delete({ where: { id } });
        return { success: true };
    }
    async issue(id, dto) {
        const item = await this.findById(id);
        if (item.stockQuantity < dto.quantity) {
            throw new common_1.ConflictException('Not enough stock to issue this quantity');
        }
        const [issuance] = await this.prisma.$transaction([
            this.prisma.ppeIssuance.create({
                data: { ppeItemId: id, employeeId: dto.employeeId, quantity: dto.quantity },
            }),
            this.prisma.ppeItem.update({
                where: { id },
                data: { stockQuantity: { decrement: dto.quantity } },
            }),
        ]);
        return issuance;
    }
    listIssuances(ppeItemId) {
        return this.prisma.ppeIssuance.findMany({
            where: ppeItemId ? { ppeItemId } : undefined,
            include: {
                ppeItem: { select: { id: true, name: true } },
                employee: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { issuedAt: 'desc' },
        });
    }
};
exports.PpeService = PpeService;
exports.PpeService = PpeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PpeService);
//# sourceMappingURL=ppe.service.js.map