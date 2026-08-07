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
exports.ShiftAssignmentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
let ShiftAssignmentsService = class ShiftAssignmentsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    listInclude = {
        employee: {
            select: { id: true, firstName: true, lastName: true, employeeCode: true },
        },
        shiftType: {
            select: { id: true, name: true, startTime: true, endTime: true },
        },
    };
    list(employeeId, shiftTypeId) {
        return this.prisma.shiftAssignment.findMany({
            where: {
                ...(employeeId ? { employeeId } : {}),
                ...(shiftTypeId ? { shiftTypeId } : {}),
            },
            include: this.listInclude,
            orderBy: { effectiveFrom: 'desc' },
        });
    }
    async findById(id) {
        const assignment = await this.prisma.shiftAssignment.findUnique({
            where: { id },
            include: this.listInclude,
        });
        if (!assignment)
            throw new common_1.NotFoundException('Shift assignment not found');
        return assignment;
    }
    create(dto) {
        return this.prisma.shiftAssignment.create({
            data: {
                ...dto,
                effectiveFrom: new Date(dto.effectiveFrom),
                effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
            },
            include: this.listInclude,
        });
    }
    async update(id, dto) {
        await this.findById(id);
        return this.prisma.shiftAssignment.update({
            where: { id },
            data: {
                ...dto,
                effectiveFrom: dto.effectiveFrom
                    ? new Date(dto.effectiveFrom)
                    : undefined,
                effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
            },
            include: this.listInclude,
        });
    }
    async remove(id) {
        await this.findById(id);
        await this.prisma.shiftAssignment.delete({ where: { id } });
        return { success: true };
    }
};
exports.ShiftAssignmentsService = ShiftAssignmentsService;
exports.ShiftAssignmentsService = ShiftAssignmentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ShiftAssignmentsService);
//# sourceMappingURL=shift-assignments.service.js.map